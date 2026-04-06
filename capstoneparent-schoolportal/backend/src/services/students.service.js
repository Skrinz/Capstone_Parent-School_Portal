const prisma = require("../config/database");

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
        grade_level: {
          select: { grade_level: true },
        },
      },
      orderBy: { lrn_number: "asc" },
      take: 10,
    });

    return students;
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
      },
      orderBy: [{ lname: "asc" }, { fname: "asc" }, { lrn_number: "asc" }],
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

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        include: {
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
            include: {
              subject_record: {
                include: {
                  class_lists: {
                    select: { clist_id: true }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.student.count({ where }),
    ]);

    const studentsWithClass = students.map((student) => {
      const firstClassList = student.class_lists?.[0];
      const clist_id = firstClassList?.clist_id ?? null;
      const section_name =
        firstClassList?.class_list?.section?.section_name ?? null;

      return {
        ...student,
        clist_id,
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

    const results = [];

    for (const row of rows) {
      const {
        fname,
        lname,
        sex,
        lrn,
        grade_level,
        syear_start,
        syear_end,
      } = row;

      if (!fname || !lname || !lrn || !grade_level || !syear_start || !syear_end) {
        continue;
      }

      const normalizedGradeLevel = normalizeGradeLevelName(grade_level);
      const gl_id = normalizedGradeLevel
        ? gradeLevelMap.get(normalizedGradeLevel.toLowerCase())
        : undefined;

      if (!gl_id) {
        throw new Error(`Invalid grade level for LRN ${lrn}`);
      }

      const payload = {
        fname: String(fname).trim(),
        lname: String(lname).trim(),
        sex: normalizeSex(String(sex).trim() || "M"),
        lrn_number: String(lrn).trim(),
        gl_id,
        syear_start: parseInt(syear_start, 10),
        syear_end: parseInt(syear_end, 10),
        status: "ENROLLED",
      };

      const existingStudent = await prisma.student.findFirst({
        where: { lrn_number: payload.lrn_number },
      });

      if (existingStudent) {
        const updatedStudent = await prisma.student.update({
          where: { student_id: existingStudent.student_id },
          data: payload,
          include: { grade_level: true },
        });
        results.push(updatedStudent);
        continue;
      }

      const createdStudent = await prisma.student.create({
        data: payload,
        include: { grade_level: true },
      });
      results.push(createdStudent);
    }

    return results;
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
              },
            },
          },
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
};

module.exports = studentsService;
