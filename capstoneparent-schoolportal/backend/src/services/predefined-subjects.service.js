const prisma = require("../config/database");
const { findOrThrow } = require("../utils/findOrThrow");

const normalizeSubjectName = (name) => String(name ?? "").trim().replace(/\s+/g, " ");

const buildSubjectInclude = () => ({
  grade_levels: {
    include: {
      grade_level: true,
    },
    orderBy: {
      grade_level: {
        gl_id: "asc",
      },
    },
  },
});

const isSubjectIdSequenceConflict = (error) =>
  error?.code === "P2002" &&
  Array.isArray(error?.meta?.target) &&
  error.meta.target.includes("subject_id");

const syncSubjectIdSequence = async () => {
  const sequenceRows = await prisma.$queryRaw`
    SELECT pg_get_serial_sequence('"subjects"', 'subject_id') AS sequence_name
  `;

  const sequenceName = sequenceRows?.[0]?.sequence_name;
  if (!sequenceName) {
    return;
  }

  const maxIdRows = await prisma.$queryRaw`
    SELECT COALESCE(MAX(subject_id), 0) AS max_id
    FROM "subjects"
  `;

  const maxId = Number(maxIdRows?.[0]?.max_id ?? 0);
  await prisma.$executeRawUnsafe(
    `SELECT setval('${sequenceName}', ${maxId}, true)`,
  );
};

const predefinedSubjectsService = {
  async getAllSubjects() {
    return prisma.subject.findMany({
      where: {
        deleted_at: null,
      },
      include: buildSubjectInclude(),
      orderBy: { name: "asc" },
    });
  },

  async createSubject(name) {
    const normalizedName = normalizeSubjectName(name);
    if (!normalizedName) {
      throw new Error("Subject name is required");
    }

    const existingSubject = await prisma.subject.findFirst({
      where: { name: normalizedName },
      include: buildSubjectInclude(),
    });

    if (existingSubject?.deleted_at) {
      return prisma.subject.update({
        where: { subject_id: existingSubject.subject_id },
        data: { deleted_at: null },
        include: buildSubjectInclude(),
      });
    }

    if (existingSubject) {
      throw new Error("Subject name already exists");
    }

    try {
      return await prisma.subject.create({
        data: { name: normalizedName },
        include: buildSubjectInclude(),
      });
    } catch (error) {
      if (!isSubjectIdSequenceConflict(error)) {
        throw error;
      }

      await syncSubjectIdSequence();

      return prisma.subject.create({
        data: { name: normalizedName },
        include: buildSubjectInclude(),
      });
    }
  },

  async archiveSubject(subjectId) {
    const subject = await findOrThrow(
      () => prisma.subject.findUnique({ where: { subject_id: subjectId } }),
      "Subject not found",
    );

    if (subject.deleted_at) {
      throw new Error("Subject not found");
    }

    // Always perform soft delete (archive)
    await prisma.subject.update({
      where: { subject_id: subjectId },
      data: { deleted_at: new Date() },
    });

    return true;
  },

  async getSubjectsByGradeLevel(gradeLevelId) {
    await findOrThrow(
      () => prisma.gradeLevel.findUnique({ where: { gl_id: gradeLevelId } }),
      "Grade level not found",
    );

    return prisma.gradeLevelSubject.findMany({
      where: {
        gl_id: gradeLevelId,
        subject: {
          deleted_at: null,
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        subject: {
          name: "asc",
        },
      },
    });
  },

  async assignSubjectToGradeLevel(gradeLevelId, subjectId) {
    await findOrThrow(
      () => prisma.gradeLevel.findUnique({ where: { gl_id: gradeLevelId } }),
      "Grade level not found",
    );

    await findOrThrow(
      () =>
        prisma.subject.findFirst({
          where: {
            subject_id: subjectId,
            deleted_at: null,
          },
        }),
      "Subject not found",
    );

    return prisma.gradeLevelSubject.create({
      data: {
        gl_id: gradeLevelId,
        subject_id: subjectId,
      },
      include: {
        grade_level: true,
        subject: true,
      },
    });
  },

  async removeSubjectFromGradeLevel(gradeLevelId, subjectId) {
    await findOrThrow(
      () =>
        prisma.gradeLevelSubject.findUnique({
          where: {
            gl_id_subject_id: {
              gl_id: gradeLevelId,
              subject_id: subjectId,
            },
          },
        }),
      "Predefined subject assignment not found",
    );

    await prisma.gradeLevelSubject.delete({
      where: {
        gl_id_subject_id: {
          gl_id: gradeLevelId,
          subject_id: subjectId,
        },
      },
    });

    return true;
  },
};

module.exports = predefinedSubjectsService;
