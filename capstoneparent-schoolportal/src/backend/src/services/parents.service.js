const prisma = require("../config/database");
const { uploadFile, attachSignedUrls } = require("../utils/supabaseStorage");

/**
 * Enrich a registration object by replacing bare file records with
 * ones that also carry a fresh signed_url field.
 */
const enrichRegistrationFiles = async (registration) => {
  if (!registration?.files?.length) return registration;

  const enrichedFiles = await attachSignedUrls(
    registration.files.map((pf) => pf.file),
  );

  return {
    ...registration,
    files: registration.files.map((pf, i) => ({
      ...pf,
      file: enrichedFiles[i],
    })),
  };
};

const parentsService = {
  /**
   * Upload multer files to Supabase Storage and persist File records.
   * file_path stores the Supabase storage object path, NOT a URL.
   */
  async createFiles(files, uploaded_by) {
    const uploader = await prisma.user.findUnique({
      where: { user_id: uploaded_by },
    });
    if (!uploader) {
      throw new Error("Uploader not found");
    }

    const created = [];

    for (const f of files) {
      // uploadFile returns the storage path, e.g. "1715000000000_abc123.pdf"
      const storagePath = await uploadFile(f);

      const file = await prisma.file.create({
        data: {
          file_name: f.originalname,
          file_path: storagePath, // storage path — signed URL generated on read
          file_type: f.mimetype,
          file_size: f.size,
          uploaded_by,
        },
      });

      created.push(file);
    }

    return created;
  },

  async submitRegistration({ parent_id, student_ids, file_ids }) {
    // Coerce to integers — form-data values arrive as strings
    const parsedStudentIds = (student_ids || []).map((id) => parseInt(id, 10));
    const parsedFileIds = (file_ids || []).map((id) => parseInt(id, 10));

    const parent = await prisma.user.findUnique({
      where: { user_id: parent_id },
    });
    if (!parent) throw new Error("Parent not found");

    const existingRegistration = await prisma.parentRegistration.findFirst({
      where: {
        parent_id,
        status: { in: ["PENDING", "VERIFIED"] },
      },
    });
    if (existingRegistration) {
      throw new Error("Parent already has an active or pending registration");
    }

    const students = await prisma.student.findMany({
      where: { student_id: { in: parsedStudentIds } },
    });
    if (students.length !== parsedStudentIds.length) {
      throw new Error("One or more students not found");
    }

    if (parsedFileIds.length > 0) {
      const files = await prisma.file.findMany({
        where: { file_id: { in: parsedFileIds } },
      });
      if (files.length !== parsedFileIds.length) {
        throw new Error("One or more files not found");
      }
    }

    const registration = await prisma.parentRegistration.create({
      data: {
        parent_id,
        students: {
          create: parsedStudentIds.map((studentId) => ({
            student_id: studentId,
          })),
        },
        files:
          parsedFileIds.length > 0
            ? { create: parsedFileIds.map((fileId) => ({ file_id: fileId })) }
            : undefined,
      },
      include: {
        students: { include: { student: true } },
        files: { include: { file: true } },
      },
    });

    return enrichRegistrationFiles(registration);
  },

  async getAllRegistrations({ page, limit, status }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [registrations, total] = await Promise.all([
      prisma.parentRegistration.findMany({
        where,
        skip,
        take,
        include: {
          parent: {
            select: {
              user_id: true,
              fname: true,
              lname: true,
              email: true,
              contact_num: true,
            },
          },
          students: {
            include: { student: { include: { grade_level: true } } },
          },
          files: { include: { file: true } },
          verifier: { select: { user_id: true, fname: true, lname: true } },
        },
        orderBy: { submitted_at: "desc" },
      }),
      prisma.parentRegistration.count({ where }),
    ]);

    // Attach signed URLs to every registration's files in parallel
    const enriched = await Promise.all(
      registrations.map((r) => enrichRegistrationFiles(r)),
    );

    return {
      registrations: enriched,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  async getRegistrationById(registrationId) {
    const registration = await prisma.parentRegistration.findUnique({
      where: { pr_id: registrationId },
      include: {
        parent: {
          select: {
            user_id: true,
            fname: true,
            lname: true,
            email: true,
            contact_num: true,
          },
        },
        students: {
          include: { student: { include: { grade_level: true } } },
        },
        files: { include: { file: true } },
        verifier: { select: { user_id: true, fname: true, lname: true } },
      },
    });

    if (!registration) throw new Error("Registration not found");

    return enrichRegistrationFiles(registration);
  },

  async verifyRegistration({ pr_id, status, remarks, verified_by }) {
    const existingRegistration = await prisma.parentRegistration.findUnique({
      where: { pr_id },
    });
    if (!existingRegistration) throw new Error("Registration not found");
    if (existingRegistration.status !== "PENDING") {
      throw new Error("Registration has already been processed");
    }

    const verifier = await prisma.user.findUnique({
      where: { user_id: verified_by },
    });
    if (!verifier) throw new Error("Verifier not found");

    const registration = await prisma.parentRegistration.update({
      where: { pr_id },
      data: { status, remarks, verified_by, verified_at: new Date() },
      include: {
        parent: {
          select: {
            user_id: true,
            fname: true,
            lname: true,
            email: true,
            account_status: true,
          },
        },
        students: { include: { student: true } },
      },
    });

    if (status === "VERIFIED" && registration.parent) {
      await prisma.user.update({
        where: { user_id: registration.parent.user_id },
        data: { account_status: "Active" },
      });
    }

    return registration;
  },

  async getMyChildren(parentId) {
    const parent = await prisma.user.findUnique({
      where: { user_id: parentId },
    });
    if (!parent) throw new Error("Parent not found");

    const verifiedRegistrations = await prisma.parentRegistration.findMany({
      where: { parent_id: parentId, status: "VERIFIED" },
      include: {
        students: {
          include: { student: { include: { grade_level: true } } },
        },
      },
    });

    return verifiedRegistrations.flatMap((reg) =>
      reg.students.map((s) => s.student),
    );
  },

  async getChildGrades({ parent_id, student_id }) {
    const hasAccess = await prisma.parentRegistration.findFirst({
      where: {
        parent_id,
        status: "VERIFIED",
        students: { some: { student_id } },
      },
    });
    if (!hasAccess) throw new Error("Access denied to this student record");

    return prisma.subjectRecordStudent.findMany({
      where: { student_id },
      include: {
        subject_record: {
          include: {
            teacher: { select: { user_id: true, fname: true, lname: true } },
          },
        },
      },
    });
  },

  async getChildAttendance({ parent_id, student_id }) {
    const hasAccess = await prisma.parentRegistration.findFirst({
      where: {
        parent_id,
        status: "VERIFIED",
        students: { some: { student_id } },
      },
    });
    if (!hasAccess) throw new Error("Access denied to this student record");

    return prisma.attendanceRecord.findMany({
      where: { student_id },
      orderBy: { month: "asc" },
    });
  },
};

module.exports = parentsService;
