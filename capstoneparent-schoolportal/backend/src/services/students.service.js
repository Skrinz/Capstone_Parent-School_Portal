const { generateReportCard } = require("../utils/gradeConfig");

const prisma = require("../config/database");
const {
  buildStudentGradePdf,
  sanitizeFileName,
} = require("../utils/gradeExport");

const normalizeSex = (sex) => {
  if (sex === "Male") return "M";
  if (sex === "Female") return "F";
  return sex;
};

const normalizeGradeLevelName = (gradeLevel) => {
  const normalized = String(gradeLevel || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const gradeAliases = {
    kinder: "Kindergarten",
    kindergarten: "Kindergarten",
    "grade 1": "Grade 1",
    "grade 2": "Grade 2",
    "grade 3": "Grade 3",
    "grade 4": "Grade 4",
    "grade 5": "Grade 5",
    "grade 6": "Grade 6",
  };

  return gradeAliases[normalized] ?? null;
};

const isImportedStudentUnchanged = (existingStudent, payload) =>
  existingStudent &&
  existingStudent.fname === payload.fname &&
  existingStudent.lname === payload.lname &&
  existingStudent.sex === payload.sex &&
  existingStudent.lrn_number === payload.lrn_number &&
  existingStudent.gl_id === payload.gl_id &&
  existingStudent.syear_start === payload.syear_start &&
  existingStudent.syear_end === payload.syear_end &&
  existingStudent.status === payload.status;

const studentsService = {
  /**
   * Public LRN prefix search used during parent registration.
   * Returns up to 10 ENROLLED students whose lrn_number starts with `lrn`.
   * Only exposes safe, non-sensitive fields.
   */
  async searchByLRN(lrn) {
    const students = await prisma.student.findMany({
      where: {
        lrn_number: { startsWith: lrn },
        status: "ENROLLED",
      },
      select: {
        student_id: true,
        lrn_number: true,
        fname: true,
        lname: true,
        parent_registrations: {
          where: {
            registration: {
              status: "VERIFIED",
            },
          },
          select: { prs_id: true },
          take: 1,
        },
        grade_level: {
          select: { grade_level: true },
        },
      },
      orderBy: { lrn_number: "asc" },
      take: 10,
    });

    return students.map((s) => ({
      ...s,
      is_verified: s.parent_registrations.length > 0,
    }));
  },

  async lookupStudents(queryText) {
    const normalizedQuery = String(queryText || "").trim();
    if (!normalizedQuery) {
      return [];
    }

    const isNumericLookup = /^\d+$/.test(normalizedQuery);
    const nameTokens = normalizedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const students = await prisma.student.findMany({
      where: isNumericLookup
        ? {
            lrn_number: {
              startsWith: normalizedQuery,
            },
          }
        : {
            AND: nameTokens.map((token) => ({
              OR: [
                { fname: { contains: token, mode: "insensitive" } },
                { lname: { contains: token, mode: "insensitive" } },
              ],
            })),
          },
      select: {
        student_id: true,
        lrn_number: true,
        fname: true,
        lname: true,
        status: true,
        grade_level: {
          select: { grade_level: true },
        },
        parent_registrations: {
          where: {
            registration: {
              status: "VERIFIED",
            },
          },
          select: { prs_id: true },
          take: 1,
        },
      },
      orderBy: [{ fname: "asc" }, { lname: "asc" }, { lrn_number: "asc" }],
      take: 20,
    });

    return students;
  },

  async getAllStudents({
    page = 1,
    limit = 10,
    status,
    grade_level,
    syear_start,
    clist_id,
    search,
  } = {}) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (grade_level) where.gl_id = parseInt(grade_level);
    if (syear_start) where.syear_start = parseInt(syear_start);
    
    if (clist_id) {
      where.class_lists = {
        some: {
          clist_id: parseInt(clist_id),
        },
      };
    }

    if (search) {
      const normalizedQuery = String(search).trim();
      const isNumericLookup = /^\d+$/.test(normalizedQuery);
      
      if (isNumericLookup) {
        where.lrn_number = {
          startsWith: normalizedQuery,
        };
      } else {
        const nameTokens = normalizedQuery
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean);
          
        if (nameTokens.length > 0) {
          where.AND = nameTokens.map((token) => ({
            OR: [
              { fname: { contains: token, mode: "insensitive" } },
              { lname: { contains: token, mode: "insensitive" } },
            ],
          }));
        }
      }
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
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
          created_at: true,
          updated_at: true,
          grade_level: true,
          class_lists: {
            select: {
              clist_id: true,
              class_list: {
                select: {
                  section: {
                    select: {
                      section_name: true,
                    },
                  },
                },
              },
            },
          },
          subject_records: {
            select: {
              srs_id: true,
              srecord_id: true,
              student_id: true,
              q1_grade: true,
              q2_grade: true,
              q3_grade: true,
              q4_grade: true,
              avg_grade: true,
              remarks: true,
              subject_record: {
                select: {
                  subject_name: true,
                  class_lists: {
                    select: { clist_id: true }
                  },
                },
              },
            }
          },
        },
        orderBy: [{ fname: "asc" }, { lname: "asc" }],
      }),
      prisma.student.count({ where }),
    ]);

    const studentsWithClass = students.map((student) => {
      // If clist_id was provided in query, prioritize that specific membership
      // otherwise fallback to the first one found.
      const targetClistId = clist_id ? parseInt(clist_id) : null;
      const matchedClassList = targetClistId
        ? student.class_lists.find(cl => cl.clist_id === targetClistId)
        : student.class_lists?.[0];

      const effective_clist_id = matchedClassList?.clist_id ?? null;
      const section_name =
        matchedClassList?.class_list?.section?.section_name ?? null;

      return {
        ...student,
        clist_id: effective_clist_id,
        section_name,
      };
    });

    return {
      students: studentsWithClass,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  async getStudentById(studentId) {
    const student = await prisma.student.findUnique({
      where: { student_id: studentId },
      include: {
        grade_level: true,
        class_lists: true,
        subject_records: {
          include: {
            subject_record: {
              include: {
                teacher: {
                  select: {
                    user_id: true,
                    fname: true,
                    lname: true,
                  },
                },
              },
            },
          },
        },
        attendance_records: true,
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    return student;
  },

  async createStudent(studentData) {
    const {
      fname,
      lname,
      sex,
      lrn_number,
      gl_id,
      syear_start,
      syear_end,
      status,
    } =
      studentData;

    // Check if grade level exists
    const gradeLevel = await prisma.gradeLevel.findUnique({
      where: { gl_id },
    });
    if (!gradeLevel) {
      throw new Error("Grade level not found");
    }

    // Check if LRN is already in use
    const existingStudent = await prisma.student.findFirst({
      where: { lrn_number },
    });
    if (existingStudent) {
      throw new Error("A student with this LRN already exists");
    }

    const student = await prisma.student.create({
      data: {
        fname,
        lname,
        sex: normalizeSex(sex),
        lrn_number,
        gl_id,
        syear_start,
        syear_end,
        ...(status ? { status } : {}),
      },
      include: {
        grade_level: true,
      },
    });

    return student;
  },

  async importStudents(rows) {
    const gradeLevels = await prisma.gradeLevel.findMany({
      select: { gl_id: true, grade_level: true },
    });

    const gradeLevelMap = new Map(
      gradeLevels.map((gradeLevel) => [
        gradeLevel.grade_level.trim().toLowerCase(),
        gradeLevel.gl_id,
      ]),
    );

    const normalizedRows = rows
      .map((row) => {
        const normalizedGradeLevel = normalizeGradeLevelName(row?.grade_level);
        const gl_id = normalizedGradeLevel
          ? gradeLevelMap.get(normalizedGradeLevel.toLowerCase())
          : undefined;

        return {
          fname: row?.fname ? String(row.fname).trim() : "",
          lname: row?.lname ? String(row.lname).trim() : "",
          sex: normalizeSex(String(row?.sex || "M").trim()),
          lrn_number: row?.lrn ? String(row.lrn).trim() : "",
          gl_id,
          syear_start: Number.parseInt(row?.syear_start, 10),
          syear_end: Number.parseInt(row?.syear_end, 10),
        };
      })
      .filter(
        (row) =>
          row.fname &&
          row.lname &&
          row.lrn_number &&
          row.gl_id &&
          Number.isFinite(row.syear_start) &&
          Number.isFinite(row.syear_end),
      );

    const invalidRow = rows.find((row) => {
      if (!row?.fname || !row?.lname || !row?.lrn || !row?.grade_level) {
        return false;
      }

      const normalizedGradeLevel = normalizeGradeLevelName(row.grade_level);
      return !normalizedGradeLevel
        || !gradeLevelMap.get(normalizedGradeLevel.toLowerCase());
    });

    if (invalidRow?.lrn) {
      throw new Error(`Invalid grade level for LRN ${invalidRow.lrn}`);
    }

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

    const importSummary = await prisma.$transaction(async (tx) => {
      const ids = [];
      let added = 0;
      let replaced = 0;
      let unchanged = 0;

      for (const row of normalizedRows) {
        const payload = {
          fname: row.fname,
          lname: row.lname,
          sex: row.sex,
          lrn_number: row.lrn_number,
          gl_id: row.gl_id,
          syear_start: row.syear_start,
          syear_end: row.syear_end,
          status: "ENROLLED",
        };

        const existingStudent = existingStudentByKey.get(row.lrn_number);

        if (existingStudent) {
          if (isImportedStudentUnchanged(existingStudent, payload)) {
            ids.push(existingStudent.student_id);
            unchanged += 1;
            continue;
          }

          const updatedStudent = await tx.student.update({
            where: { student_id: existingStudent.student_id },
            data: payload,
            select: { student_id: true },
          });
          ids.push(updatedStudent.student_id);
          replaced += 1;
          existingStudentByKey.set(row.lrn_number, {
            ...existingStudent,
            ...payload,
            student_id: updatedStudent.student_id,
          });
          continue;
        }

        const createdStudent = await tx.student.create({
          data: payload,
          select: { student_id: true },
        });
        existingStudentByKey.set(row.lrn_number, {
          ...payload,
          student_id: createdStudent.student_id,
        });
        ids.push(createdStudent.student_id);
        added += 1;
      }

      return { ids, added, replaced, unchanged };
    });

    const students = await prisma.student.findMany({
      where: { student_id: { in: importSummary.ids } },
      include: { grade_level: true },
      orderBy: [{ fname: "asc" }, { lname: "asc" }],
    });

    return {
      students,
      summary: {
        added: importSummary.added,
        replaced: importSummary.replaced,
        unchanged: importSummary.unchanged,
        failed: 0,
        totalProcessed: normalizedRows.length,
        failures: [],
      },
    };
  },

  async updateStudent(studentId, updateData) {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { student_id: studentId },
    });
    if (!existingStudent) {
      throw new Error("Student not found");
    }

    // Check if new LRN is already taken by another student
    if (
      updateData.lrn_number &&
      updateData.lrn_number !== existingStudent.lrn_number
    ) {
      const duplicateLRN = await prisma.student.findFirst({
        where: { lrn_number: updateData.lrn_number },
      });
      if (duplicateLRN) {
        throw new Error("A student with this LRN already exists");
      }
    }

    if (updateData.sex) {
      updateData.sex = normalizeSex(updateData.sex);
    }

    if (updateData.gl_id) {
      const gradeLevel = await prisma.gradeLevel.findUnique({
        where: { gl_id: updateData.gl_id },
      });

      if (!gradeLevel) {
        throw new Error("Grade level not found");
      }
    }

    const student = await prisma.student.update({
      where: { student_id: studentId },
      data: updateData,
      include: {
        grade_level: true,
      },
    });

    return student;
  },

  async deleteStudent(studentId) {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { student_id: studentId },
    });
    if (!existingStudent) {
      throw new Error("Student not found");
    }

    await prisma.student.delete({
      where: { student_id: studentId },
    });

    return true;
  },

  async getStudentGrades(studentId) {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { student_id: studentId },
    });
    if (!existingStudent) {
      throw new Error("Student not found");
    }

    const grades = await prisma.subjectRecordStudent.findMany({
      where: { student_id: studentId },
      include: {
        subject_record: {
          include: {
            teacher: {
              select: {
                user_id: true,
                fname: true,
                lname: true,
                roles: true,
              },
            },
          },
        },
      },
      orderBy: {
        subject_record: {
          subject_name: "asc",
        },
      },
    });

    return grades;
  },

  async getStudentAttendance(studentId) {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { student_id: studentId },
    });
    if (!existingStudent) {
      throw new Error("Student not found");
    }

    const attendance = await prisma.attendanceRecord.findMany({
      where: { student_id: studentId },
      orderBy: {
        month: "asc",
      },
    });

    return attendance;
  },

  async exportQuarterlyGrades(studentId) {
  // Query student with full relations needed for report card
  const [student, principalRole] = await Promise.all([
    prisma.student.findUnique({
      where: { student_id: studentId },
      include: {
        grade_level: true,
        class_lists: {
          include: {
            class_list: {
              include: {
                grade_level: true,
                section:     true,
                adviser: {
                  select: { fname: true, lname: true },
                },
              },
            },
          },
        },
        subject_records: {
          include: { subject_record: true },
        },
        attendance_records: true,
      },
    }),

    // Query the school principal from user_roles
    prisma.userRole_Model.findFirst({
      where: { role: 'Principal' },
      include: {
        user: { select: { fname: true, lname: true } },
      },
    }),
  ]);

  if (!student) throw new Error('Student not found');

  const firstClass    = student.class_lists?.[0]?.class_list;
  const adviserUser   = firstClass?.adviser;
  const principalUser = principalRole?.user;

  const classInfo = firstClass
    ? {
        grade_level:    firstClass.grade_level?.grade_level ?? '',
        section_name:   firstClass.section?.section_name   ?? '',
        syear_start:    firstClass.syear_start,
        syear_end:      firstClass.syear_end,
        adviser_name:   adviserUser
          ? `${adviserUser.fname} ${adviserUser.lname}` : '',
        principal_name: principalUser
          ? `${principalUser.fname} ${principalUser.lname}` : '',
      }
    : {
        principal_name: principalUser
          ? `${principalUser.fname} ${principalUser.lname}` : '',
      };

  const gradeLevel = classInfo.grade_level ?? student.grade_level?.grade_level ?? '';
  const generator  = generateReportCard(gradeLevel);

  let buffer;
  if (generator) {
    const uint8 = await generator({ student, classInfo });
    buffer = Buffer.from(uint8);
  } else {
    buffer = buildStudentGradePdf({ student, classInfo });
  }

  return {
    fileName: `${sanitizeFileName(student.lname)}_${sanitizeFileName(student.fname)}_${sanitizeFileName(student.lrn_number)}_ReportCard.pdf`,
    contentType: 'application/pdf',
    buffer,
  };
},
};

module.exports = studentsService;
