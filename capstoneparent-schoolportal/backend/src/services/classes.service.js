const prisma = require("../config/database");
const { findOrThrow } = require("../utils/findOrThrow");
const { uploadFile } = require("../utils/supabaseStorage");

const classesService = {
  async getAllClasses({ page, limit, school_year, grade_level }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (school_year) {
      where.syear_start = parseInt(school_year);
    }
    if (grade_level) {
      where.gl_id = parseInt(grade_level);
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
        },
        orderBy: { syear_start: "desc" },
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
      },
      orderBy: { syear_start: "desc" },
    });
  },

  async getTeacherSubjects(teacherId) {
    return prisma.subjectRecord.findMany({
      where: { subject_teacher: teacherId },
      include: {
        teacher: {
          select: { user_id: true, fname: true, lname: true },
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
        subject_records: {
          include: {
            subject_record: {
              include: {
                teacher: {
                  select: { user_id: true, fname: true, lname: true },
                },
                students: { include: { student: true } },
              },
            },
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

    return prisma.classList.create({
      data: {
        gl_id,
        section_id,
        class_adviser,
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
    await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    const scheduleUrl = await uploadFile(file, "teacher_files");

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

    const subjectRecord = await prisma.subjectRecord.create({
      data: {
        subject_name,
        time_start: new Date(`1970-01-01T${time_start || "07:00"}:00`),
        time_end: new Date(`1970-01-01T${time_end || "08:00"}:00`),
        subject_teacher: subject_teacher ?? null,
      },
    });

    await prisma.classListSubjectRecord.create({
      data: { clist_id: classId, srecord_id: subjectRecord.srecord_id },
    });

    return subjectRecord;
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
            students: { include: { student: true } },
          },
        },
      },
    });

    return subjects.map((s) => s.subject_record);
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

    const existingRecord = await prisma.subjectRecordStudent.findFirst({
      where: { srecord_id: subject_id, student_id },
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
    const results = [];
    for (const row of rows) {
      const { lrn, q1, q2, q3, q4 } = row;
      if (!lrn) continue;

      const student = await prisma.student.findFirst({
        where: { lrn_number: String(lrn) },
      });

      if (student) {
        const updated = await this.updateStudentGrades({
          subject_id: srecord_id,
          student_id: student.student_id,
          q1_grade: parseInt(q1) || null,
          q2_grade: parseInt(q2) || null,
          q3_grade: parseInt(q3) || null,
          q4_grade: parseInt(q4) || null,
        });
        results.push(updated);
      }
    }
    return results;
  },

  async importAttendance(rows) {
    const results = [];
    const months = ['Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    
    for (const row of rows) {
      const { lrn, absences } = row; // absences is an object { Jun: X, Jul: Y, ... }
      if (!lrn) continue;

      const student = await prisma.student.findFirst({
        where: { lrn_number: String(lrn) },
      });

      if (student) {
        for (const month of months) {
          if (absences[month] !== undefined) {
             const updated = await this.updateAttendance({
              student_id: student.student_id,
              school_days: 22, // Assuming standard 22 days per month for now or could be dynamic
              days_present: 22 - (parseInt(absences[month]) || 0),
              days_absent: parseInt(absences[month]) || 0,
              month,
            });
            results.push(updated);
          }
        }
      }
    }
    return results;
  },

  async importStudents(classId, rows) {
    const classData = await findOrThrow(
      () => prisma.classList.findUnique({ where: { clist_id: classId } }),
      "Class not found",
    );

    const results = [];
    for (const row of rows) {
      const { fname, lname, sex, lrn, syear_start, syear_end } = row;
      if (!lrn || !fname || !lname) continue;

      // Check if student already exists for this LRN
      // If they exist, we just update their grade level and school year to match the class
      const existingStudent = await prisma.student.findFirst({
        where: { lrn_number: String(lrn) },
      });

      if (existingStudent) {
        const updated = await prisma.student.update({
          where: { student_id: existingStudent.student_id },
          data: {
            gl_id: classData.gl_id,
            syear_start: parseInt(syear_start) || classData.syear_start,
            syear_end: parseInt(syear_end) || classData.syear_end,
            status: 'ENROLLED'
          }
        });
        results.push(updated);
      } else {
        const created = await prisma.student.create({
          data: {
            fname,
            lname,
            sex: sex === 'F' ? 'F' : 'M',
            lrn_number: String(lrn),
            gl_id: classData.gl_id,
            syear_start: parseInt(syear_start) || classData.syear_start,
            syear_end: parseInt(syear_end) || classData.syear_end,
            status: 'ENROLLED'
          }
        });
        results.push(created);
      }
    }
    return results;
  },
};

module.exports = classesService;
