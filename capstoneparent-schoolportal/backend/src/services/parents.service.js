const prisma = require("../config/database");
const { findOrThrow } = require("../utils/findOrThrow");
const { deleteFileByUrl, refreshSignedUrl } = require("../utils/supabaseStorage");
const { sendParentVerifiedEmail } = require("../utils/emailUtil");
const PENDING_REGISTRATION_TTL_MS = 10 * 60 * 1000;

/**
 * File → User relationship (from schema):
 *
 *   File.uploaded_by  (Int, FK) ──► User.user_id  (PK)
 *   User.files        (File[])  ◄── uploaded_by relation
 *
 * ParentChildFile joins File and ParentRegistration:
 *   ParentChildFile.file_id (FK) ──► File.file_id
 *   ParentChildFile.pr_id   (FK) ──► ParentRegistration.pr_id
 *
 * Required creation order (enforced in verifyRegistrationOTP):
 *   1. User must exist before File rows         (File.uploaded_by FK)
 *   2. File rows must exist before ParentChildFile (file_id FK)
 *   3. ParentRegistration must exist before ParentChildFile (pr_id FK)
 *
 * Note: createFiles has been moved to users.service.js as it is a
 * general user-scoped file operation, not specific to parent registration.
 */

const parentsService = {
  async purgeExpiredPendingRegistrations() {
    const cutoff = new Date(Date.now() - PENDING_REGISTRATION_TTL_MS);
    const expiredRegistrations = await prisma.parentRegistration.findMany({
      where: {
        status: "PENDING",
        submitted_at: { lte: cutoff },
      },
      include: {
        parent: {
          include: {
            roles: true,
            _count: {
              select: {
                parent_registrations: true,
              },
            },
          },
        },
        files: {
          include: {
            file: true,
          },
        },
      },
    });

    if (expiredRegistrations.length === 0) {
      return 0;
    }

    for (const registration of expiredRegistrations) {
      await parentsService.deleteRegistrationFiles(registration.files || []);

      const shouldDeleteParentUser =
        registration.parent &&
        registration.parent.account_status === "Inactive" &&
        registration.parent.roles.length === 1 &&
        registration.parent.roles[0].role === "Parent" &&
        registration.parent._count.parent_registrations === 1;

      if (shouldDeleteParentUser) {
        await prisma.user.delete({
          where: { user_id: registration.parent.user_id },
        });
        continue;
      }

      await prisma.parentRegistration.delete({
        where: { pr_id: registration.pr_id },
      });
    }

    return expiredRegistrations.length;
  },

  async refreshRegistrationFileUrls(registration) {
    const refreshedFiles = await Promise.all(
      (registration.files || []).map(async (entry) => ({
        ...entry,
        file: {
          ...entry.file,
          file_path: await refreshSignedUrl(entry.file.file_path),
        },
      })),
    );

    return {
      ...registration,
      files: refreshedFiles,
    };
  },

  async deleteRegistrationFiles(fileRecords = []) {
    if (!fileRecords.length) return;

    await prisma.file.deleteMany({
      where: {
        file_id: {
          in: fileRecords.map((entry) => entry.file_id),
        },
      },
    });

    await Promise.all(
      fileRecords.map(async (entry) => {
        try {
          await deleteFileByUrl(entry.file.file_path);
        } catch (error) {
          console.error(
            `[parents.service] Failed deleting parent file from Supabase: ${entry.file.file_path}`,
            error,
          );
        }
      }),
    );
  },

  async submitRegistration({ parent_id, student_ids, file_ids }) {
    await parentsService.purgeExpiredPendingRegistrations();

    const parsedStudentIds = (student_ids || []).map((id) => parseInt(id, 10));
    const parsedFileIds = (file_ids || []).map((id) => parseInt(id, 10));

    await findOrThrow(
      () => prisma.user.findUnique({ where: { user_id: parent_id } }),
      "Parent not found",
    );

    const existingRegistration = await prisma.parentRegistration.findFirst({
      where: { parent_id, status: { in: ["PENDING", "VERIFIED"] } },
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

    // ParentRegistration and ParentChildFile rows created together.
    // File rows must already exist (from usersService.createFiles) because
    // ParentChildFile.file_id is a FK referencing File.file_id.
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

    return registration;
  },

  async getAllRegistrations({ page, limit, status }) {
    await parentsService.purgeExpiredPendingRegistrations();

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
              address: true,
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

    const refreshedRegistrations = await Promise.all(
      registrations.map((registration) =>
        parentsService.refreshRegistrationFileUrls(registration),
      ),
    );

    return {
      registrations: refreshedRegistrations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  async getRegistrationById(registrationId) {
    await parentsService.purgeExpiredPendingRegistrations();

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
            address: true,
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
    return parentsService.refreshRegistrationFileUrls(registration);
  },

  async verifyRegistration({ pr_id, status, remarks, verified_by }) {
    await parentsService.purgeExpiredPendingRegistrations();

    const existingRegistration = await prisma.parentRegistration.findUnique({
      where: { pr_id },
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
        files: {
          include: {
            file: true,
          },
        },
      },
    });
    if (!existingRegistration) throw new Error("Registration not found");
    if (existingRegistration.status !== "PENDING") {
      throw new Error("Registration has already been processed");
    }

    await findOrThrow(
      () => prisma.user.findUnique({ where: { user_id: verified_by } }),
      "Verifier not found",
    );

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

    if (status === "VERIFIED" || status === "DENIED") {
      await parentsService.deleteRegistrationFiles(existingRegistration.files || []);
    }

    if (status === "VERIFIED" && registration.parent?.email) {
      const parentName =
        `${registration.parent.fname || ""} ${registration.parent.lname || ""}`.trim();
      await sendParentVerifiedEmail(registration.parent.email, parentName);
    }

    return registration;
  },

  async getMyChildren(parentId) {
    await parentsService.purgeExpiredPendingRegistrations();

    await findOrThrow(
      () => prisma.user.findUnique({ where: { user_id: parentId } }),
      "Parent not found",
    );

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
    await parentsService.purgeExpiredPendingRegistrations();

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
    await parentsService.purgeExpiredPendingRegistrations();

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
