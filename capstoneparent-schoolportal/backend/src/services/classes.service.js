const prisma = require("../config/database");
const { findOrThrow } = require("../utils/findOrThrow");
const { replaceFile } = require("../utils/supabaseStorage");
const {
  createZipBuffer,
  sanitizeFileName,
} = require("../utils/gradeExport");
const { generateReportCard } = require("../utils/gradeConfig");

const normalizeSex = (sex) => {
  if (sex === "Female" || sex === "F") return "F";
  return "M";
};

const isClassImportStudentUnchanged = (existingStudent, payload) =>
  existingStudent &&
  existingStudent.fname === payload.fname &&
  existingStudent.lname === payload.lname &&
  existingStudent.sex === payload.sex &&
  existingStudent.lrn_number === payload.lrn_number &&
  existingStudent.gl_id === payload.gl_id &&
  existingStudent.syear_start === payload.syear_start &&
  existingStudent.syear_end === payload.syear_end &&
  existingStudent.status === payload.status;

const ensureStudentMatchesClassGrade = (student, classData) => {
  if (student.gl_id !== classData.gl_id) {
    throw new Error("Student grade level does not match this class");
  }
};

const normalizeSubjectTitle = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const DEFAULT_SUBJECT_TIME_START = "07:00";
const DEFAULT_SUBJECT_TIME_END = "08:00";

const createSubjectRecordTime = (time, fallback) =>
  new Date(`1970-01-01T${time || fallback}:00`);

const seedPredefinedSubjectsForClass = async (db, classId, gradeLevelId) => {
  const predefinedSubjects = await db.gradeLevelSubject.findMany({
    where: {
      gl_id: gradeLevelId,
      subject: {
        deleted_at: null,
      },
    },
    include: {
      subject: {
        select: {
          subject_id: true,
          name: true,
        },
      },
    },
    orderBy: {
      subject: {
        name: "asc",
      },
    },
  });

  if (predefinedSubjects.length === 0) {
    return [];
  }

  const subjectRecords = [];

  for (const predefinedSubject of predefinedSubjects) {
    const subjectRecord = await db.subjectRecord.create({
      data: {
        subject_name: predefinedSubject.subject.name,
        subject_id: predefinedSubject.subject.subject_id,
        time_start: createSubjectRecordTime(null, DEFAULT_SUBJECT_TIME_START),
        time_end: createSubjectRecordTime(null, DEFAULT_SUBJECT_TIME_END),
      },
    });

    subjectRecords.push(subjectRecord);
  }

  await db.classListSubjectRecord.createMany({
    data: subjectRecords.map((subjectRecord) => ({
      clist_id: classId,
      srecord_id: subjectRecord.srecord_id,
    })),
  });

  return subjectRecords;
};

const syncStudentIntoClassSubjects = async (db, classId, studentId) => {
  const classSubjects = await db.classListSubjectRecord.findMany({
    where: { clist_id: classId },
    select: { srecord_id: true },
  });

  if (classSubjects.length === 0) {
    return;
  }

  await db.subjectRecordStudent.createMany({
    data: classSubjects.map((subject) => ({
      srecord_id: subject.srecord_id,
      student_id: studentId,
    })),
    skipDuplicates: true,
  });
};

const removeStudentFromClassSubjects = async (db, classId, studentId) => {
  const classSubjects = await db.classListSubjectRecord.findMany({
    where: { clist_id: classId },
    select: { srecord_id: true },
  });

  const subjectIds = classSubjects.map((subject) => subject.srecord_id);
  if (subjectIds.length === 0) return;

  await db.subjectRecordStudent.deleteMany({
    where: {
      student_id: studentId,
      srecord_id: { in: subjectIds },
    },
  });
};

const importGradesForSubjectRecord = async (srecord_id, rows, options = {}) => {
  const normalizedRows = rows
    .map((row) => ({
      lrn: row?.lrn ? String(row.lrn).trim() : "",
      q1_grade: Number.parseInt(row?.q1, 10) || null,
      q2_grade: Number.parseInt(row?.q2, 10) || null,
      q3_grade: Number.parseInt(row?.q3, 10) || null,
      q4_grade: Number.parseInt(row?.q4, 10) || null,
    }))
    .filter((row) => row.lrn);

  if (normalizedRows.length === 0) {
    return {
      records: [],
      summary: {
        added: 0,
        replaced: 0,
        unchanged: 0,
        failed: 0,
        totalProcessed: 0,
        failures: [],
      },
    };
  }

  const allowedStudentIds = options.allowedStudentIds
    ? new Set(options.allowedStudentIds)
    : null;

  const uniqueLrns = [...new Set(normalizedRows.map((row) => row.lrn))];
  const students = await prisma.student.findMany({
    where: { lrn_number: { in: uniqueLrns } },
    select: { student_id: true, lrn_number: true },
  });

  if (students.length === 0) {
    throw new Error("No matching students found for the uploaded LRN numbers");
  }

  const studentIdByLrn = new Map(
    students.map((student) => [String(student.lrn_number), student.student_id]),
  );
  const targetStudentIds = students.map((student) => student.student_id);

  const existingRecords = await prisma.subjectRecordStudent.findMany({
    where: {
      srecord_id,
      student_id: { in: targetStudentIds },
    },
    select: {
      srs_id: true,
      student_id: true,
      q1_grade: true,
      q2_grade: true,
      q3_grade: true,
      q4_grade: true,
      avg_grade: true,
      remarks: true,
    },
  });

  const existingRecordByStudentId = new Map(
    existingRecords.map((record) => [record.student_id, record]),
  );

  const createPayloads = [];
  const updatePayloads = [];
  const touchedStudentIds = new Set();
  let added = 0;
  let replaced = 0;
  let unchanged = 0;

  for (const row of normalizedRows) {
    const student_id = studentIdByLrn.get(row.lrn);
    if (!student_id) continue;
    if (allowedStudentIds && !allowedStudentIds.has(student_id)) continue;

    const grades = [row.q1_grade, row.q2_grade, row.q3_grade, row.q4_grade].filter(
      (grade) => grade !== null,
    );
    const avg_grade =
      grades.length > 0
        ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
        : null;
    const remarks =
      avg_grade === null
        ? "IN_PROGRESS"
        : avg_grade >= 75
          ? "PASSED"
          : "FAILED";

    const payload = {
      q1_grade: row.q1_grade,
      q2_grade: row.q2_grade,
      q3_grade: row.q3_grade,
      q4_grade: row.q4_grade,
      avg_grade,
      remarks,
    };

    touchedStudentIds.add(student_id);

    const existingRecord = existingRecordByStudentId.get(student_id);
    if (existingRecord) {
      const isUnchanged =
        existingRecord.q1_grade === payload.q1_grade &&
        existingRecord.q2_grade === payload.q2_grade &&
        existingRecord.q3_grade === payload.q3_grade &&
        existingRecord.q4_grade === payload.q4_grade &&
        existingRecord.avg_grade === payload.avg_grade &&
        existingRecord.remarks === payload.remarks;

      if (isUnchanged) {
        unchanged += 1;
        continue;
      }

      updatePayloads.push({
        srs_id: existingRecord.srs_id,
        data: payload,
      });
      replaced += 1;
    } else {
      createPayloads.push({
        srecord_id,
        student_id,
        ...payload,
      });
      added += 1;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (createPayloads.length > 0) {
      await tx.subjectRecordStudent.createMany({
        data: createPayloads,
        skipDuplicates: true,
      });
    }

    if (updatePayloads.length > 0) {
      await Promise.all(
        updatePayloads.map((updatePayload) =>
          tx.subjectRecordStudent.update({
            where: { srs_id: updatePayload.srs_id },
            data: updatePayload.data,
          }),
        ),
      );
    }
  });

  if (touchedStudentIds.size === 0) {
    if (allowedStudentIds && allowedStudentIds.size === 0) {
      throw new Error("No students are enrolled in this subject");
    }

    throw new Error("None of the uploaded students are enrolled in this subject");
  }

  const records = await prisma.subjectRecordStudent.findMany({
    where: {
      srecord_id,
      student_id: { in: [...touchedStudentIds] },
    },
    include: {
      student: true,
      subject_record: true,
    },
    orderBy: { student_id: "asc" },
  });

  return {
    records,
    summary: {
      added,
      replaced,
      unchanged,
      failed: 0,
      totalProcessed: added + replaced + unchanged,
      failures: [],
    },
  };
};

const ATTENDANCE_MONTHS = ['Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const CALENDAR_MONTH_TO_ENUM = {
  0: 'Jan',
  1: 'Feb',
  2: 'Mar',
  5: 'Jun',
  6: 'Jul',
  7: 'Aug',
  8: 'Sept',
  9: 'Oct',
  10: 'Nov',
  11: 'Dec',
};

const parseAttendanceDate = (value) => {
  const input = String(value ?? "").trim();
  if (!input) return null;

  let year;
  let month;
  let day;

  let match = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    year = Number.parseInt(match[1], 10);
    month = Number.parseInt(match[2], 10);
    day = Number.parseInt(match[3], 10);
  } else {
    match = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;

    month = Number.parseInt(match[1], 10);
    day = Number.parseInt(match[2], 10);
    year = Number.parseInt(match[3], 10);
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const normalizeAttendanceStatus = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized) return "Absent";
  if (['present', 'p', '1', 'yes'].includes(normalized)) return "Present";
  if (['absent', 'a', '0', 'no'].includes(normalized)) return "Absent";

  throw new Error(`Invalid attendance status: ${value}`);
};

const normalizeAttendanceStudentName = (value) => {
  const suffixes = new Set(['jr', 'sr', 'ii', 'iii', 'iv']);

  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, " ")
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter((token) => token && token.length > 1 && !suffixes.has(token))
    .join(" ");
};

const buildAttendanceNameKeys = (student) => {
  const keys = new Set();
  const firstLast = normalizeAttendanceStudentName(`${student.fname} ${student.lname}`);
  const lastFirst = normalizeAttendanceStudentName(`${student.lname}, ${student.fname}`);
  const lastFirstNoComma = normalizeAttendanceStudentName(`${student.lname} ${student.fname}`);

  if (firstLast) keys.add(firstLast);
  if (lastFirst) keys.add(lastFirst);
  if (lastFirstNoComma) keys.add(lastFirstNoComma);

  return [...keys];
};

const classesService = {
  async getAllClasses({ page, limit, school_year, grade_level, user }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (school_year) {
      where.syear_start = parseInt(school_year);
    }
    if (grade_level) {
      where.gl_id = parseInt(grade_level);
    }

    // Restriction for Principals: only see classes they created
    const userRoles = user?.roles?.map(r => r.role) || [];
    if (userRoles.includes('Principal') && !userRoles.includes('Admin')) {
      where.created_by = user.user_id;
    }

    const [classes, total] = await Promise.all([
      prisma.classList.findMany({
        where,
        skip,
        take,
        include: {
          grade_level: true,
          section: true,
          adviser: {
            select: { user_id: true, fname: true, lname: true },
          },
          _count: {
            select: { students: true },
          },
        },
        orderBy: [
          { grade_level: { gl_id: "asc" } },
          { section: { section_name: "asc" } },
          { syear_start: "desc" },
        ],
      }),
      prisma.classList.count({ where }),
    ]);

    return {
      classes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  async getTeacherClasses(teacherId) {
    return prisma.classList.findMany({
      where: { class_adviser: teacherId },
      include: {
        grade_level: true,
        section: true,
        adviser: {
          select: { user_id: true, fname: true, lname: true },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: [
        { grade_level: { gl_id: "asc" } },
        { section: { section_name: "asc" } },
        { syear_start: "desc" },
      ],
    });
  },

  async getTeacherSubjects(teacherId) {
    return prisma.subjectRecord.findMany({
      where: { subject_teacher: teacherId },
      include: {
        teacher: {
          select: { user_id: true, fname: true, lname: true },
        },
        students: {
          select: { srs_id: true },
        },
        class_lists: {
          include: {
            class_list: {
              include: {
                grade_level: true,
                section: true,
              },
            },
          },
        },
      },
    });
  },

  async getAllSections() {
    return prisma.section.findMany({
      orderBy: { section_name: "asc" },
    });
  },

  async getAllGradeLevels() {
    return prisma.gradeLevel.findMany({
      orderBy: { gl_id: "asc" },
    });
  },

  async createSection(name) {
    return prisma.section.create({
      data: { section_name: name },
    });
  },

  async updateSection(sectionId, name) {
    await findOrThrow(
      () => prisma.section.findUnique({ where: { section_id: sectionId } }),
      "Section not found",
    );

    return prisma.section.update({
      where: { section_id: sectionId },
      data: { section_name: name },
    });
  },

  async deleteSection(sectionId) {
    await findOrThrow(
      () => prisma.section.findUnique({ where: { section_id: sectionId } }),
      "Section not found",
    );

    const checkUsage = await prisma.classList.findFirst({
      where: { section_id: sectionId },
    });

    if (checkUsage) {
      throw new Error("Cannot delete section: It is currently assigned to a class.");
    }

    await prisma.section.delete({ where: { section_id: sectionId } });
    return true;
  },

  async getClassById(classId) {
    const classData = await prisma.classList.findUnique({
      where: { clist_id: classId },
      include: {
        grade_level: true,
        section: true,
        adviser: {
          select: { user_id: true, fname: true, lname: true },
        },
        students: {
          include: {
            student: true,
          },
          orderBy: {
            student: { lname: "asc" },
          },
        },
        subject_records: {
          include: {
            subject_record: {
              include: {
                teacher: {
                  select: { user_id: true, fname: true, lname: true },
                },
                students: {
                  include: { student: true },
                  orderBy: {
                    student: { lname: "asc" },
                  },
                },
              },
            },
          },
          orderBy: {
            subject_record: { subject_name: "asc" },
          },
        },
      },
    });

    if (!classData) throw new Error("Class not found");
    return classData;
  },

  async createClass(classData) {
    const {
      gl_id,
      section_id,
      class_adviser,
      created_by,
      syear_start,
      syear_end,
      class_sched,
    } = classData;

    await findOrThrow(
      () => prisma.gradeLevel.findUnique({ where: { gl_id } }),
      "Grade level not found",
    );

    await findOrThrow(
      () => prisma.section.findUnique({ where: { section_id } }),
      "Section not found",
    );

    if (class_adviser === undefined || class_adviser === null) {
      throw new Error("Class adviser is required");
    }

    await findOrThrow(
      () => prisma.user.findUnique({ where: { user_id: class_adviser } }),
      "Adviser not found",
    );

    const existingAdviserClass = await prisma.classList.findFirst({
      where: { class_adviser, syear_start },
    });
    if (existingAdviserClass) {
      throw new Error(
        "Adviser is already assigned to a class in this school year",
      );
    }

    const existingClass = await prisma.classList.findFirst({
      where: { gl_id, section_id, syear_start },
    });
    if (existingClass) {
      throw new Error(
        "A class with this grade level and section already exists for this school year",
      );
    }

    return prisma.$transaction(
      async (tx) => {
        const createdClass = await tx.classList.create({
          data: {
            gl_id,
            section_id,
            class_adviser,
            created_by,
            syear_start,
            syear_end,
            class_sched,
          },
          include: {
            grade_level: true,
            section: true,
            adviser: { select: { user_id: true, fname: true, lname: true } },
          },
        });

        await seedPredefinedSubjectsForClass(tx, createdClass.clist_id, gl_id);

        return createdClass;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );
  },

  async updateClass(classId, updateData) {
    await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    return prisma.classList.update({
      where: { clist_id: classId },
      data: updateData,
      include: {
        grade_level: true,
        section: true,
        adviser: { select: { user_id: true, fname: true, lname: true } },
      },
    });
  },

  async uploadClassSchedule(classId, file) {
    const existingClass = await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    const scheduleUrl = await replaceFile(
      file,
      existingClass.class_sched,
      "teacher_files",
      "classes.service",
    );

    return prisma.classList.update({
      where: { clist_id: classId },
      data: {
        class_sched: scheduleUrl,
      },
      include: {
        grade_level: true,
        section: true,
        adviser: { select: { user_id: true, fname: true, lname: true } },
      },
    });
  },

  async deleteClass(classId) {
    await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    await prisma.classList.delete({ where: { clist_id: classId } });
    return true;
  },

  async addSubjectToClass(classId, subjectData) {
    const { subject_name, time_start, time_end, subject_teacher } = subjectData;

    const classData = await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    if (subject_teacher !== undefined && subject_teacher !== null) {
      await findOrThrow(
        () => prisma.user.findUnique({ where: { user_id: subject_teacher } }),
        "Teacher not found",
      );
    }

    return prisma.$transaction(async (tx) => {
      const subjectRecord = await tx.subjectRecord.create({
        data: {
          subject_name,
          time_start: createSubjectRecordTime(time_start, DEFAULT_SUBJECT_TIME_START),
          time_end: createSubjectRecordTime(time_end, DEFAULT_SUBJECT_TIME_END),
          subject_teacher: subject_teacher ?? null,
        },
      });

      await tx.classListSubjectRecord.create({
        data: { clist_id: classId, srecord_id: subjectRecord.srecord_id },
      });

      const classStudents = await tx.classListStudent.findMany({
        where: { clist_id: classId },
        select: { student_id: true },
      });

      if (classStudents.length > 0) {
        await tx.subjectRecordStudent.createMany({
          data: classStudents.map((classStudent) => ({
            srecord_id: subjectRecord.srecord_id,
            student_id: classStudent.student_id,
          })),
          skipDuplicates: true,
        });
      }

      return subjectRecord;
    });
  },

  async getClassSubjects(classId) {
    await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    const subjects = await prisma.classListSubjectRecord.findMany({
      where: { clist_id: classId },
      include: {
        subject_record: {
          include: {
            teacher: { select: { user_id: true, fname: true, lname: true } },
            students: {
              include: { student: true },
              orderBy: {
                student: { lname: "asc" },
              },
            },
          },
        },
      },
      orderBy: {
        subject_record: { subject_name: "asc" },
      },
    });

    return subjects.map((s) => s.subject_record);
  },

  async assignTeacherToSubject(subjectId, teacherId) {
    await findOrThrow(
      () => prisma.subjectRecord.findUnique({ where: { srecord_id: subjectId } }),
      "Subject record not found",
    );

    await findOrThrow(
      () => prisma.user.findUnique({ where: { user_id: teacherId } }),
      "Teacher not found",
    );

    return prisma.subjectRecord.update({
      where: { srecord_id: subjectId },
      data: { subject_teacher: teacherId },
      include: {
        teacher: { select: { user_id: true, fname: true, lname: true } },
        class_lists: {
          include: {
            class_list: {
              include: {
                grade_level: true,
                section: true,
              },
            },
          },
        },
      },
    });
  },

  async addStudentToClass(classId, studentData) {
    const classData = await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    const { student_id, fname, lname, sex, lrn_number, syear_start, syear_end } =
      studentData;
    const targetStartYear = parseInt(syear_start) || classData.syear_start;
    const targetEndYear = parseInt(syear_end) || classData.syear_end;

    return prisma.$transaction(async (tx) => {
      let student;

      if (student_id) {
        student = await findOrThrow(
          () => tx.student.findUnique({ where: { student_id } }),
          "Student not found",
        );

        ensureStudentMatchesClassGrade(student, classData);

        student = await tx.student.update({
          where: { student_id },
          data: {
            syear_start: targetStartYear,
            syear_end: targetEndYear,
            status: "ENROLLED",
          },
        });
      } else {
        if (!fname || !lname || !lrn_number) {
          throw new Error("First name, last name, and LRN are required");
        }

        const existingStudent = await tx.student.findFirst({
          where: {
            lrn_number: String(lrn_number),
            syear_start: targetStartYear,
          },
        });

        if (existingStudent) {
          ensureStudentMatchesClassGrade(existingStudent, classData);

          student = await tx.student.update({
            where: { student_id: existingStudent.student_id },
            data: {
              fname: String(fname).trim(),
              lname: String(lname).trim(),
              sex: normalizeSex(sex),
              syear_start: targetStartYear,
              syear_end: targetEndYear,
              status: "ENROLLED",
            },
          });
        } else {
          student = await tx.student.create({
            data: {
              fname: String(fname).trim(),
              lname: String(lname).trim(),
              sex: normalizeSex(sex),
              lrn_number: String(lrn_number).trim(),
              gl_id: classData.gl_id,
              syear_start: targetStartYear,
              syear_end: targetEndYear,
              status: "ENROLLED",
            },
          });
        }
      }

      await tx.classListStudent.upsert({
        where: {
          clist_id_student_id: {
            clist_id: classId,
            student_id: student.student_id,
          },
        },
        update: {},
        create: {
          clist_id: classId,
          student_id: student.student_id,
        },
      });

      await syncStudentIntoClassSubjects(tx, classId, student.student_id);

      return student;
    });
  },

  async removeStudentFromClass(classId, studentId) {
    await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    await findOrThrow(
      () => prisma.student.findUnique({ where: { student_id: studentId } }),
      "Student not found",
    );

    const classMembership = await prisma.classListStudent.findUnique({
      where: {
        clist_id_student_id: {
          clist_id: classId,
          student_id: studentId,
        },
      },
    });

    if (!classMembership) {
      throw new Error("Student is not enrolled in this class");
    }

    await prisma.$transaction(async (tx) => {
      await removeStudentFromClassSubjects(tx, classId, studentId);
      await tx.classListStudent.delete({
        where: {
          clist_id_student_id: {
            clist_id: classId,
            student_id: studentId,
          },
        },
      });
    });

    return true;
  },

  async addStudentToSubject(subjectId, studentId) {
    const subject = await findOrThrow(
      () =>
        prisma.subjectRecord.findUnique({
          where: { srecord_id: subjectId },
          include: {
            class_lists: true,
          },
        }),
      "Subject record not found",
    );

    const student = await findOrThrow(
      () => prisma.student.findUnique({ where: { student_id: studentId } }),
      "Student not found",
    );

    const classIds = subject.class_lists.map((item) => item.clist_id);
    const classMembership = await prisma.classListStudent.findFirst({
      where: {
        clist_id: { in: classIds },
        student_id,
      },
    });

    if (!classMembership) {
      throw new Error("Student must belong to the class before joining this subject");
    }

    return prisma.subjectRecordStudent.upsert({
      where: {
        srecord_id_student_id: {
          srecord_id: subjectId,
          student_id: student.student_id,
        },
      },
      update: {},
      create: {
        srecord_id: subjectId,
        student_id: student.student_id,
      },
      include: {
        student: true,
        subject_record: true,
      },
    });
  },

  async removeStudentFromSubject(subjectId, studentId) {
    await findOrThrow(
      () => prisma.subjectRecord.findUnique({ where: { srecord_id: subjectId } }),
      "Subject record not found",
    );

    await findOrThrow(
      () => prisma.student.findUnique({ where: { student_id: studentId } }),
      "Student not found",
    );

    const subjectEnrollment = await prisma.subjectRecordStudent.findFirst({
      where: {
        srecord_id: subjectId,
        student_id: studentId,
      },
    });

    if (!subjectEnrollment) {
      throw new Error("Student is not enrolled in this subject");
    }

    await prisma.subjectRecordStudent.delete({
      where: { srs_id: subjectEnrollment.srs_id },
    });

    return true;
  },

  async getAllSubjects({ page = 1, limit = 10 } = {}) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [subjects, total] = await Promise.all([
      prisma.subjectRecord.findMany({
        skip,
        take,
        include: {
          teacher: { select: { user_id: true, fname: true, lname: true } },
          class_lists: {
            include: {
              class_list: {
                include: {
                  grade_level: true,
                  section: true,
                },
              },
            },
          },
        },
        orderBy: { subject_name: "asc" },
      }),
      prisma.subjectRecord.count(),
    ]);

    return {
      subjects,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  async updateStudentGrades({
    subject_id,
    student_id,
    q1_grade,
    q2_grade,
    q3_grade,
    q4_grade,
  }) {
    await findOrThrow(
      () =>
        prisma.subjectRecord.findUnique({ where: { srecord_id: subject_id } }),
      "Subject record not found",
    );

    // ✅ FIX: was incorrectly using prisma.user.findUnique with user_id.
    //    Students are a separate model with their own student_id PK.
    await findOrThrow(
      () => prisma.student.findUnique({ where: { student_id } }),
      "Student not found",
    );

    const grades = [q1_grade, q2_grade, q3_grade, q4_grade].filter(
      (g) => g !== undefined && g !== null,
    );
    const avg_grade =
      grades.length > 0
        ? Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length)
        : null;

    const remarks =
      avg_grade === null
        ? "IN_PROGRESS"
        : avg_grade >= 75
          ? "PASSED"
          : "FAILED";

    const existingRecord = await prisma.subjectRecordStudent.findUnique({
      where: {
        srecord_id_student_id: {
          srecord_id: subject_id,
          student_id,
        },
      },
    });

    if (existingRecord) {
      return prisma.subjectRecordStudent.update({
        where: { srs_id: existingRecord.srs_id },
        data: { q1_grade, q2_grade, q3_grade, q4_grade, avg_grade, remarks },
        include: {
          student: true,
          subject_record: true,
        },
      });
    }

    return prisma.subjectRecordStudent.create({
      data: {
        srecord_id: subject_id,
        student_id,
        q1_grade,
        q2_grade,
        q3_grade,
        q4_grade,
        avg_grade,
        remarks,
      },
      include: {
        student: true,
        subject_record: true,
      },
    });
  },

  async updateAttendance(attendanceData) {
    const { student_id, school_days, days_present, days_absent, month } =
      attendanceData;

    // ✅ FIX: was incorrectly using prisma.user.findUnique with user_id.
    //    Students are a separate model with their own student_id PK.
    await findOrThrow(
      () => prisma.student.findUnique({ where: { student_id } }),
      "Student not found",
    );

    if (days_present + days_absent > school_days) {
      throw new Error(
        "Days present and days absent cannot exceed total school days",
      );
    }

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: { student_id, month },
    });

    if (existingRecord) {
      return prisma.attendanceRecord.update({
        where: { attendance_id: existingRecord.attendance_id },
        data: { school_days, days_present, days_absent },
      });
    }

    return prisma.attendanceRecord.create({
      data: { student_id, school_days, days_present, days_absent, month },
    });
  },

  async importGrades(srecord_id, rows) {
    const subjectRecord = await findOrThrow(
      () =>
        prisma.subjectRecord.findUnique({
          where: { srecord_id },
          select: { srecord_id: true, subject_name: true },
        }),
      "Subject record not found",
    );
    const providedSubjectTitles = [
      ...new Set(
        rows
          .map((row) => normalizeSubjectTitle(row?.subject_title))
          .filter(Boolean),
      ),
    ];

    if (
      providedSubjectTitles.length > 0 &&
      providedSubjectTitles.some(
        (subjectTitle) =>
          subjectTitle !== normalizeSubjectTitle(subjectRecord.subject_name),
      )
    ) {
      throw new Error("Subject title does not match the selected subject");
    }

    const subjectStudents = await prisma.subjectRecordStudent.findMany({
      where: { srecord_id },
      select: { student_id: true },
    });

    if (subjectStudents.length === 0) {
      throw new Error("No students are enrolled in this subject");
    }

    return importGradesForSubjectRecord(srecord_id, rows, {
      allowedStudentIds: subjectStudents.map((student) => student.student_id),
    });
  },

  async importClassGrades(classId, rows) {
    await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    const classSubjects = await prisma.classListSubjectRecord.findMany({
      where: { clist_id: classId },
      include: {
        subject_record: {
          select: {
            srecord_id: true,
            subject_name: true,
          },
        },
      },
    });

    if (classSubjects.length === 0) {
      throw new Error("No subjects found for this class");
    }

    const subjectByTitle = new Map(
      classSubjects.map((item) => [
        normalizeSubjectTitle(item.subject_record.subject_name),
        item.subject_record,
      ]),
    );

    const normalizedRows = rows
      .map((row) => ({
        subject_title: String(row?.subject_title ?? "").trim(),
        lrn: String(row?.lrn ?? "").trim(),
        name: String(row?.name ?? "").trim(),
        q1: row?.q1,
        q2: row?.q2,
        q3: row?.q3,
        q4: row?.q4,
      }))
      .filter((row) => row.subject_title || row.lrn || row.name);

    if (normalizedRows.length === 0) {
      return {
        students: [],
        summary: {
          added: 0,
          replaced: 0,
          unchanged: 0,
          failed: 0,
          totalProcessed: 0,
          failures: [],
        },
      };
    }

    const rowsMissingSubjectTitle = normalizedRows.some(
      (row) => (row.lrn || row.name) && !row.subject_title,
    );
    if (rowsMissingSubjectTitle) {
      throw new Error("Subject title is required for class grade imports");
    }

    const classStudents = await prisma.student.findMany({
      where: {
        class_lists: {
          some: {
            clist_id: classId,
          },
        },
      },
      select: {
        student_id: true,
        fname: true,
        lname: true,
        lrn_number: true,
      },
    });
    const allowedStudentIds = classStudents.map((student) => student.student_id);
    const allowedLrns = new Set(
      classStudents
        .map((student) => String(student.lrn_number ?? "").trim())
        .filter(Boolean),
    );
    const studentLrnByName = new Map();

    classStudents.forEach((student) => {
      buildAttendanceNameKeys(student).forEach((key) => {
        const existingLrn = studentLrnByName.get(key);
        if (existingLrn && existingLrn !== student.lrn_number) {
          studentLrnByName.set(key, null);
          return;
        }

        if (!studentLrnByName.has(key)) {
          studentLrnByName.set(key, student.lrn_number);
        }
      });
    });

    const rowsBySubjectId = new Map();

    for (const row of normalizedRows) {
      const normalizedTitle = normalizeSubjectTitle(row.subject_title);
      const subjectRecord = subjectByTitle.get(normalizedTitle);

      if (!subjectRecord) {
        throw new Error(`Subject title not found in this class: ${row.subject_title}`);
      }

      const resolvedLrn = row.lrn || studentLrnByName.get(normalizeAttendanceStudentName(row.name));
      if (row.name && (resolvedLrn === null || !resolvedLrn)) {
        continue;
      }
      if (resolvedLrn && !allowedLrns.has(String(resolvedLrn).trim())) {
        continue;
      }

      const existingRows = rowsBySubjectId.get(subjectRecord.srecord_id) ?? [];
      existingRows.push({
        ...row,
        lrn: resolvedLrn ?? row.lrn,
      });
      rowsBySubjectId.set(subjectRecord.srecord_id, existingRows);
    }

    const importedGroups = await Promise.all(
      [...rowsBySubjectId.entries()].map(([srecord_id, subjectRows]) =>
        importGradesForSubjectRecord(srecord_id, subjectRows, {
          allowedStudentIds,
        }),
      ),
    );

    return {
      records: importedGroups.flatMap((group) => group.records),
      summary: importedGroups.reduce(
        (acc, group) => ({
          added: acc.added + group.summary.added,
          replaced: acc.replaced + group.summary.replaced,
          unchanged: acc.unchanged + group.summary.unchanged,
          failed: acc.failed + group.summary.failed,
          totalProcessed: acc.totalProcessed + group.summary.totalProcessed,
          failures: [...acc.failures, ...group.summary.failures],
        }),
        {
          added: 0,
          replaced: 0,
          unchanged: 0,
          failed: 0,
          totalProcessed: 0,
          failures: [],
        },
      ),
    };
  },

  async importAttendance(rows, classId) {
    const normalizedRows = rows.filter((row) => row?.lrn || row?.name);

    if (normalizedRows.length === 0) {
      return {
        records: [],
        summary: {
          added: 0,
          replaced: 0,
          unchanged: 0,
          failed: 0,
          totalProcessed: 0,
          failures: [],
        },
      };
    }

    const uniqueLrns = [
      ...new Set(
        normalizedRows
          .map((row) => String(row.lrn ?? "").trim())
          .filter(Boolean),
      ),
    ];
    const hasNameBasedRows = normalizedRows.some((row) => row?.name);

    if (hasNameBasedRows && !classId) {
      throw new Error("Class ID is required for attendance sheets that identify students by name");
    }

    let classStudents = [];

    if (classId) {
      classStudents = await prisma.student.findMany({
        where: {
          class_lists: {
            some: {
              clist_id: classId,
            },
          },
        },
        select: {
          student_id: true,
          lrn_number: true,
          fname: true,
          lname: true,
        },
      });
    }

    const studentsById = new Map();

    if (uniqueLrns.length > 0) {
      const lrnMatchedStudents = classId
        ? classStudents.filter((student) => uniqueLrns.includes(String(student.lrn_number)))
        : await prisma.student.findMany({
            where: {
              lrn_number: { in: uniqueLrns },
            },
            select: {
              student_id: true,
              lrn_number: true,
              fname: true,
              lname: true,
            },
          });

      lrnMatchedStudents.forEach((student) => {
        studentsById.set(student.student_id, student);
      });
    }

    if (classId && hasNameBasedRows) {
      classStudents.forEach((student) => {
        studentsById.set(student.student_id, student);
      });
    }

    const students = [...studentsById.values()];

    if (students.length === 0) {
      return {
        records: [],
        summary: {
          added: 0,
          replaced: 0,
          unchanged: 0,
          failed: normalizedRows.length,
          totalProcessed: normalizedRows.length,
          failures: normalizedRows.map((row) => ({
            input: String(row.lrn ?? row.name ?? "Unknown entry").trim() || "Unknown entry",
            message: "Student not found in the selected class.",
          })),
        },
      };
    }

    const studentIdByLrn = new Map(
      students
        .filter((student) => student.lrn_number)
        .map((student) => [String(student.lrn_number), student.student_id]),
    );
    const studentIdByName = new Map();

    students.forEach((student) => {
      buildAttendanceNameKeys(student).forEach((key) => {
        const existingStudentId = studentIdByName.get(key);
        if (existingStudentId && existingStudentId !== student.student_id) {
          studentIdByName.set(key, null);
          return;
        }

        if (!studentIdByName.has(key)) {
          studentIdByName.set(key, student.student_id);
        }
      });
    });
    const studentIds = students.map((student) => student.student_id);

    const existingRecords = await prisma.attendanceRecord.findMany({
      where: {
        student_id: { in: studentIds },
        month: { in: ATTENDANCE_MONTHS },
      },
      select: {
        attendance_id: true,
        student_id: true,
        month: true,
      },
    });

    const existingRecordMap = new Map(
      existingRecords.map((record) => [
        `${record.student_id}:${record.month}`,
        record.attendance_id,
      ]),
    );

    const createPayloads = [];
    const updateOperations = [];
    const monthlyAttendanceMap = new Map();
    const touchedStudentIds = new Set();
    const failures = [];

    for (const row of normalizedRows) {
      const normalizedLrn = String(row.lrn ?? "").trim();
      const normalizedName = normalizeAttendanceStudentName(row.name);
      const rowLabel = normalizedLrn || String(row.name ?? "").trim() || "Unknown entry";
      const studentId = normalizedLrn
        ? studentIdByLrn.get(normalizedLrn)
        : studentIdByName.get(normalizedName);

      if (normalizedName && studentId === null) {
        throw new Error(`Attendance student name is ambiguous: ${row.name}`);
      }

      if (!studentId) {
        failures.push({
          input: rowLabel,
          message: "Student not found in the selected class.",
        });
        continue;
      }
      touchedStudentIds.add(studentId);

      if (row.date !== undefined) {
        const parsedDate = parseAttendanceDate(row.date);
        if (!parsedDate) {
          throw new Error(`Invalid attendance date for LRN ${row.lrn}: ${row.date}`);
        }

        const month = CALENDAR_MONTH_TO_ENUM[parsedDate.getUTCMonth()];
        if (!month) {
          throw new Error(`Attendance date is outside supported school months: ${row.date}`);
        }

        const status = normalizeAttendanceStatus(row.status);
        const dateKey = parsedDate.toISOString().slice(0, 10);
        const recordKey = `${studentId}:${month}`;
        const existingMonthRecord = monthlyAttendanceMap.get(recordKey) ?? {
          student_id: studentId,
          month,
          dailyStatuses: new Map(),
        };

        existingMonthRecord.dailyStatuses.set(dateKey, status);
        monthlyAttendanceMap.set(recordKey, existingMonthRecord);
        continue;
      }

      const absences = row.absences ?? {};

      for (const month of ATTENDANCE_MONTHS) {
        if (absences[month] === undefined) continue;

        const parsedAbsences = Number.parseInt(absences[month], 10);
        const daysAbsent = Number.isFinite(parsedAbsences) ? parsedAbsences : 0;
        const schoolDays = 22;
        const daysPresent = schoolDays - daysAbsent;

        if (daysPresent < 0) {
          throw new Error(
            "Days present and days absent cannot exceed total school days",
          );
        }

        monthlyAttendanceMap.set(`${studentId}:${month}`, {
          student_id: studentId,
          month,
          school_days: schoolDays,
          days_present: daysPresent,
          days_absent: daysAbsent,
        });
      }
    }

    for (const [recordKey, record] of monthlyAttendanceMap.entries()) {
      const schoolDays = record.dailyStatuses ? record.dailyStatuses.size : record.school_days;
      const daysAbsent = record.dailyStatuses
        ? [...record.dailyStatuses.values()].filter((status) => status === "Absent").length
        : record.days_absent;
      const daysPresent = record.dailyStatuses
        ? schoolDays - daysAbsent
        : record.days_present;

      if (daysPresent < 0) {
        throw new Error(
          "Days present and days absent cannot exceed total school days",
        );
      }

      const attendanceId = existingRecordMap.get(recordKey);
      const payload = {
        school_days: schoolDays,
        days_present: daysPresent,
        days_absent: daysAbsent,
      };

      if (attendanceId) {
        updateOperations.push(
          prisma.attendanceRecord.update({
            where: { attendance_id: attendanceId },
            data: payload,
          }),
        );
      } else {
        createPayloads.push({
          student_id: record.student_id,
          month: record.month,
          ...payload,
        });
      }
    }

    if (createPayloads.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: createPayloads,
      });
    }

    if (updateOperations.length > 0) {
      await prisma.$transaction(updateOperations);
    }

    if (touchedStudentIds.size === 0) {
      return {
        records: [],
        summary: {
          added: 0,
          replaced: 0,
          unchanged: 0,
          failed: failures.length,
          totalProcessed: failures.length,
          failures,
        },
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        student_id: { in: [...touchedStudentIds] },
        month: { in: ATTENDANCE_MONTHS },
      },
      orderBy: [
        { student_id: 'asc' },
        { attendance_id: 'asc' },
      ],
    });

    return {
      records,
      summary: {
        added: createPayloads.length,
        replaced: updateOperations.length,
        unchanged: 0,
        failed: failures.length,
        totalProcessed: createPayloads.length + updateOperations.length + failures.length,
        failures,
      },
    };
  },

  async importStudents(classId, rows) {
    const classData = await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    const normalizedRows = rows
      .map((row) => ({
        fname: row?.fname ? String(row.fname).trim() : "",
        lname: row?.lname ? String(row.lname).trim() : "",
        sex: normalizeSex(row?.sex),
        lrn_number: row?.lrn ? String(row.lrn).trim() : "",
        syear_start: Number.parseInt(row?.syear_start, 10) || classData.syear_start,
        syear_end: Number.parseInt(row?.syear_end, 10) || classData.syear_end,
      }))
      .filter((row) => row.lrn_number && row.fname && row.lname);

    if (normalizedRows.length === 0) {
      return [];
    }

    const existingStudents = await prisma.student.findMany({
      where: {
        lrn_number: {
          in: [...new Set(normalizedRows.map((row) => row.lrn_number))],
        },
      },
      select: {
        student_id: true,
        fname: true,
        lname: true,
        sex: true,
        lrn_number: true,
        gl_id: true,
        syear_start: true,
        syear_end: true,
        status: true,
      },
    });

    const existingStudentByKey = new Map(
      existingStudents.map((student) => [student.lrn_number, student]),
    );

    existingStudents.forEach((student) =>
      ensureStudentMatchesClassGrade(student, classData),
    );

    const classSubjects = await prisma.classListSubjectRecord.findMany({
      where: { clist_id: classId },
      select: { srecord_id: true },
    });

    const existingEnrollments = await prisma.classListStudent.findMany({
      where: {
        clist_id: classId,
        student_id: {
          in: existingStudents.map((student) => student.student_id),
        },
      },
      select: { student_id: true },
    });

    const alreadyEnrolledIds = new Set(
      existingEnrollments.map((enrollment) => enrollment.student_id),
    );

    return prisma.$transaction(async (tx) => {
      const enrolledStudents = [];
      let added = 0;
      let replaced = 0;
      let unchanged = 0;

      for (const row of normalizedRows) {
        const existingStudent = existingStudentByKey.get(row.lrn_number);
        const payload = {
          fname: row.fname,
          lname: row.lname,
          sex: row.sex,
          lrn_number: row.lrn_number,
          gl_id: classData.gl_id,
          syear_start: row.syear_start,
          syear_end: row.syear_end,
          status: "ENROLLED",
        };

        if (existingStudent) {
          const alreadyEnrolled = alreadyEnrolledIds.has(existingStudent.student_id);
          const unchangedRecord = isClassImportStudentUnchanged(existingStudent, payload);

          if (alreadyEnrolled && unchangedRecord) {
            enrolledStudents.push(existingStudent);
            unchanged += 1;
            continue;
          }

          const updatedStudent = unchangedRecord
            ? existingStudent
            : await tx.student.update({
                where: { student_id: existingStudent.student_id },
                data: {
                  fname: payload.fname,
                  lname: payload.lname,
                  sex: payload.sex,
                  syear_start: payload.syear_start,
                  syear_end: payload.syear_end,
                  status: payload.status,
                },
              });

          enrolledStudents.push(updatedStudent);
          existingStudentByKey.set(row.lrn_number, updatedStudent);

          if (alreadyEnrolled) {
            replaced += 1;
          } else {
            added += 1;
          }
          continue;
        }

        const createdStudent = await tx.student.create({
          data: {
            fname: row.fname,
            lname: row.lname,
            sex: row.sex,
            lrn_number: row.lrn_number,
            gl_id: classData.gl_id,
            syear_start: row.syear_start,
            syear_end: row.syear_end,
            status: "ENROLLED",
          },
        });
        existingStudentByKey.set(row.lrn_number, createdStudent);
        enrolledStudents.push(createdStudent);
        added += 1;
      }

      if (enrolledStudents.length === 0) {
        return {
          students: [],
          summary: {
            added: 0,
            replaced: 0,
            unchanged: 0,
            failed: 0,
            totalProcessed: 0,
            failures: [],
          },
        };
      }

      const studentIds = enrolledStudents.map((student) => student.student_id);

      await tx.classListStudent.createMany({
        data: studentIds.map((student_id) => ({
          clist_id: classId,
          student_id,
        })),
        skipDuplicates: true,
      });

      if (classSubjects.length > 0) {
        await tx.subjectRecordStudent.createMany({
          data: studentIds.flatMap((student_id) =>
            classSubjects.map((subject) => ({
              srecord_id: subject.srecord_id,
              student_id,
            })),
          ),
          skipDuplicates: true,
        });
      }

      return {
        students: enrolledStudents,
        summary: {
          added,
          replaced,
          unchanged,
          failed: 0,
          totalProcessed: normalizedRows.length,
          failures: [],
        },
      };
    });
  },

  async exportAllQuartersGrades(classId) {
    // Fetch class data including the adviser user for their name
    const [classData, principalRecord] = await Promise.all([
      prisma.classList.findUnique({
        where: { clist_id: classId },
        include: {
          grade_level: true,
          section: true,
          adviser: { select: { fname: true, lname: true } },
          students: {
            include: {
              student: {
                include: {
                  grade_level: true,
                  subject_records: {
                    include: {
                      subject_record: true,
                    },
                  },
                  attendance_records: true,
                },
              },
            },
          },
        },
      }),
      // Fetch first Principal user for the report card signature field
      prisma.userRole_Model.findFirst({
        where: { role: "Principal" },
        include: { user: { select: { fname: true, lname: true } } },
      }),
    ]);

    if (!classData) {
      throw new Error("Class not found");
    }

    const adviserName = classData.adviser
      ? `${classData.adviser.fname} ${classData.adviser.lname}`
      : "";
    const principalName = principalRecord?.user
      ? `${principalRecord.user.fname} ${principalRecord.user.lname}`
      : "";

    const classInfo = {
      grade_level:    classData.grade_level?.grade_level ?? "",
      section_name:   classData.section?.section_name ?? "",
      syear_start:    classData.syear_start,
      syear_end:      classData.syear_end,
      adviser_name:   adviserName,
      principal_name: principalName,
    };

    const students = classData.students
      .map((entry) => entry.student)
      .sort((left, right) =>
        `${left.lname} ${left.fname}`.localeCompare(`${right.lname} ${right.fname}`),
      );

    // generateReportCard returns the appropriate async generator function,
    // or null when there is no template for that grade level.
    const gradeLevel = classInfo.grade_level;
    const generator = generateReportCard(gradeLevel);

    if (!generator) {
      throw new Error(`No report card template available for grade level: "${gradeLevel}"`);
    }

    // Generate all PDFs concurrently — generators are async (pdf-lib).
    const zipEntries = await Promise.all(
      students.map(async (student) => {
        const pdfBytes = await generator({ student, classInfo });
        return {
          name: `${sanitizeFileName(student.lname)}_${sanitizeFileName(student.fname)}_${sanitizeFileName(student.lrn_number)}_ReportCard.pdf`,
          content: Buffer.from(pdfBytes),
        };
      }),
    );

    const zipFileName = `${sanitizeFileName(classInfo.grade_level)}-${sanitizeFileName(classInfo.section_name)}_Quarterly_Grades.zip`;

    return {
      fileName: zipFileName,
      contentType: "application/zip",
      buffer: createZipBuffer(zipEntries),
    };
  },
};

module.exports = classesService;
