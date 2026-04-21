const prisma = require("../config/database");

const LIBRARY_BORROWER_USER_ROLES = ["Teacher", "Admin", "Librarian", "Principal"];
const LIBRARY_BORROWER_ROLE_PRIORITY = ["Admin", "Principal", "Teacher", "Librarian"];

const buildNameSearchFilters = (queryText) => {
  const nameTokens = String(queryText || "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (nameTokens.length === 0) {
    return [];
  }

  return nameTokens.map((token) => ({
    OR: [
      { fname: { contains: token, mode: "insensitive" } },
      { lname: { contains: token, mode: "insensitive" } },
    ],
  }));
};

const libraryService = {
  async getAllMaterials({
    page = 1,
    limit = 10,
    item_type,
    category_id,
    grade_level,
    subject_id,
  }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (item_type) {
      where.item_type = item_type;
    }
    if (category_id) {
      where.category_id = parseInt(category_id);
    }
    if (grade_level) {
      where.gl_id = parseInt(grade_level);
    }
    if (subject_id) {
      where.subject_id = parseInt(subject_id);
    }

    const [materials, total] = await Promise.all([
      prisma.learningMaterial.findMany({
        where,
        skip,
        take,
        include: {
          category: true,
          grade_level: true,
          subject: true,
          uploader: {
            select: {
              user_id: true,
              fname: true,
              lname: true,
            },
          },
          copies: true,
        },
        orderBy: {
          item_name: "asc",
        },
      }),
      prisma.learningMaterial.count({ where }),
    ]);

    return {
      materials,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  async getMaterialById(materialId) {
    const material = await prisma.learningMaterial.findUnique({
      where: { item_id: materialId },
      include: {
        category: true,
        grade_level: true,
        subject: true,
        uploader: {
          select: {
            user_id: true,
            fname: true,
            lname: true,
          },
        },
        copies: {
          include: {
            borrow_records: {
              include: {
                student: true,
                user: {
                  select: {
                    user_id: true,
                    fname: true,
                    lname: true,
                  },
                },
              },
              orderBy: {
                borrowed_at: "desc",
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new Error("Material not found");
    }

    return material;
  },

  async createMaterial(materialData) {
    const {
      item_name,
      author,
      item_type,
      category_id,
      gl_id,
      uploaded_by,
      subject_id,
    } = materialData;

    // Check if uploader exists
    const uploader = await prisma.user.findUnique({
      where: { user_id: uploaded_by },
    });
    if (!uploader) {
      throw new Error("Uploader not found");
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { category_id },
    });
    if (!category) {
      throw new Error("Category not found");
    }

    // Check if grade level exists
    const gradeLevel = await prisma.gradeLevel.findUnique({
      where: { gl_id },
    });
    if (!gradeLevel) {
      throw new Error("Grade level not found");
    }

    if (subject_id !== undefined && subject_id !== null) {
      const subject = await prisma.subject.findFirst({
        where: {
          subject_id,
          deleted_at: null,
        },
      });
      if (!subject) {
        throw new Error("Subject not found");
      }
    }

    const material = await prisma.learningMaterial.create({
      data: {
        item_name,
        author,
        item_type,
        category_id,
        gl_id,
        uploaded_by,
        subject_id,
      },
      include: {
        category: true,
        grade_level: true,
        subject: true,
        uploader: {
          select: {
            user_id: true,
            fname: true,
            lname: true,
          },
        },
      },
    });

    return material;
  },

  async updateMaterial(materialId, updateData) {
    // Check if material exists
    const existingMaterial = await prisma.learningMaterial.findUnique({
      where: { item_id: materialId },
    });
    if (!existingMaterial) {
      throw new Error("Material not found");
    }

    if (updateData.category_id !== undefined) {
      const category = await prisma.category.findUnique({
        where: { category_id: updateData.category_id },
      });
      if (!category) {
        throw new Error("Category not found");
      }
    }

    if (updateData.gl_id !== undefined) {
      const gradeLevel = await prisma.gradeLevel.findUnique({
        where: { gl_id: updateData.gl_id },
      });
      if (!gradeLevel) {
        throw new Error("Grade level not found");
      }
    }

    if (Object.prototype.hasOwnProperty.call(updateData, "subject_id")) {
      if (updateData.subject_id === null) {
        // Allow clearing the subject assignment.
      } else {
        const subject = await prisma.subject.findFirst({
          where: {
            subject_id: updateData.subject_id,
            deleted_at: null,
          },
        });
        if (!subject) {
          throw new Error("Subject not found");
        }
      }
    }

    const material = await prisma.learningMaterial.update({
      where: { item_id: materialId },
      data: updateData,
      include: {
        category: true,
        grade_level: true,
        subject: true,
        uploader: {
          select: {
            user_id: true,
            fname: true,
            lname: true,
          },
        },
      },
    });

    return material;
  },

  async deleteMaterial(materialId) {
    // Check if material exists
    const existingMaterial = await prisma.learningMaterial.findUnique({
      where: { item_id: materialId },
    });
    if (!existingMaterial) {
      throw new Error("Material not found");
    }

    await prisma.learningMaterial.delete({
      where: { item_id: materialId },
    });

    return true;
  },

  async addCopy(copyData) {
    const { item_id, copy_code, condition } = copyData;

    // Check if material exists
    const material = await prisma.learningMaterial.findUnique({
      where: { item_id },
    });
    if (!material) {
      throw new Error("Material not found");
    }

    // Check if copy code is already in use
    const existingCopy = await prisma.materialCopy.findFirst({
      where: {
        item_id,
        copy_code,
      },
    });
    if (existingCopy) {
      throw new Error("Copy code already exists for this material");
    }

    const copy = await prisma.materialCopy.create({
      data: {
        item_id,
        copy_code,
        condition,
      },
    });

    return copy;
  },

  async updateCopyStatus(copyId, updateData) {
    const { status, condition } = updateData;

    // Check if copy exists
    const existingCopy = await prisma.materialCopy.findUnique({
      where: { copy_id: copyId },
    });
    if (!existingCopy) {
      throw new Error("Material copy not found");
    }

    const copy = await prisma.materialCopy.update({
      where: { copy_id: copyId },
      data: { status, condition },
    });

    return copy;
  },

  async borrowMaterial(borrowData) {
    const { copy_id, student_id, user_id, due_at } = borrowData;

    // Check if copy exists and is available
    const copy = await prisma.materialCopy.findUnique({
      where: { copy_id },
    });
    if (!copy) {
      throw new Error("Material copy not found");
    }
    if (copy.status !== "AVAILABLE") {
      throw new Error("Material copy is not available for borrowing");
    }

    const hasStudentBorrower = Boolean(student_id);
    const hasUserBorrower = Boolean(user_id);

    if ((hasStudentBorrower && hasUserBorrower) || (!hasStudentBorrower && !hasUserBorrower)) {
      throw new Error("A valid borrower is required");
    }

    if (hasStudentBorrower) {
      const student = await prisma.student.findUnique({
        where: { student_id },
      });
      if (!student) {
        throw new Error("Student not found");
      }
    }

    if (hasUserBorrower) {
      const user = await prisma.user.findFirst({
        where: {
          user_id,
          roles: {
            some: {
              role: {
                in: LIBRARY_BORROWER_USER_ROLES,
              },
            },
          },
        },
      });
      if (!user) {
        throw new Error("User not found");
      }
    }

    // Calculate due date (1 week from now if not provided)
    const dueDate = due_at
      ? new Date(due_at)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create borrow record
    return prisma.$transaction(async (tx) => {
      const record = await tx.materialBorrowRecord.create({
        data: {
          copy_id,
          student_id,
          user_id,
          due_at: dueDate,
        },
        include: {
          copy: {
            include: {
              item: true,
            },
          },
          student: true,
          user: {
            select: {
              user_id: true,
              fname: true,
              lname: true,
            },
          },
        },
      });

      await tx.materialCopy.update({
        where: { copy_id },
        data: { status: "BORROWED" },
      });

      return record;
    });
  },

  async returnMaterial(borrowId, returnData) {
    const { penalty_cost, remarks } = returnData;

    // Check if borrow record exists
    const existingRecord = await prisma.materialBorrowRecord.findUnique({
      where: { mbr_id: borrowId },
    });
    if (!existingRecord) {
      throw new Error("Borrow record not found");
    }

    // Check if material has already been returned
    if (existingRecord.returned_at) {
      throw new Error("Material has already been returned");
    }

    return prisma.$transaction(async (tx) => {
      const record = await tx.materialBorrowRecord.update({
        where: { mbr_id: borrowId },
        data: {
          returned_at: new Date(),
          penalty_cost: penalty_cost || 0,
          remarks,
        },
        include: {
          copy: true,
          student: true,
          user: {
            select: {
              user_id: true,
              fname: true,
              lname: true,
            },
          },
        },
      });

      await tx.materialCopy.update({
        where: { copy_id: record.copy_id },
        data: { status: "AVAILABLE" },
      });

      return record;
    });
  },

  async getBorrowHistory({ page, limit, student_id, user_id, status, copy_status }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (student_id) {
      where.student_id = parseInt(student_id);
    }
    if (user_id) {
      where.user_id = parseInt(user_id);
    }

    if (status === "borrowed") {
      where.returned_at = null;
    } else if (status === "returned") {
      where.returned_at = { not: null };
    } else if (status === "overdue") {
      where.returned_at = null;
      where.due_at = { lt: new Date() };
    }

    if (copy_status) {
      where.copy = {
        status: copy_status,
      };
    }

    const [records, total] = await Promise.all([
      prisma.materialBorrowRecord.findMany({
        where,
        skip,
        take,
        include: {
          copy: {
            include: {
              item: {
                include: {
                  category: true,
                  subject: true,
                },
              },
            },
          },
          student: true,
          user: {
            select: {
              user_id: true,
              fname: true,
              lname: true,
            },
          },
        },
        orderBy: {
          borrowed_at: "desc",
        },
      }),
      prisma.materialBorrowRecord.count({ where }),
    ]);

    return {
      records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  async getAllCategories() {
    const categories = await prisma.category.findMany({
      orderBy: {
        category_name: "asc",
      },
    });

    return categories;
  },

  async createCategory(categoryName) {
    // Check if category name already exists
    const existingCategory = await prisma.category.findFirst({
      where: { category_name: categoryName },
    });
    if (existingCategory) {
      throw new Error("Category already exists");
    }

    const category = await prisma.category.create({
      data: {
        category_name: categoryName,
      },
    });

    return category;
  },

  async updateCategory(categoryId, categoryName) {
    const existingCategory = await prisma.category.findUnique({
      where: { category_id: categoryId },
    });
    if (!existingCategory) {
      throw new Error("Category not found");
    }

    const duplicateCategory = await prisma.category.findFirst({
      where: {
        category_name: categoryName,
        NOT: {
          category_id: categoryId,
        },
      },
    });
    if (duplicateCategory) {
      throw new Error("Category already exists");
    }

    return prisma.category.update({
      where: { category_id: categoryId },
      data: {
        category_name: categoryName,
      },
    });
  },

  async getAllSubjects() {
    return prisma.subject.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        subject_id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  async lookupBorrowers(queryText) {
    const normalizedQuery = String(queryText || "").trim();
    if (!normalizedQuery) {
      return [];
    }

    const nameFilters = buildNameSearchFilters(normalizedQuery);
    const isNumericLookup = /^\d+$/.test(normalizedQuery);

    const [students, users] = await Promise.all([
      prisma.student.findMany({
        where: isNumericLookup
          ? {
              lrn_number: {
                startsWith: normalizedQuery,
              },
            }
          : {
              AND: nameFilters,
            },
        select: {
          student_id: true,
          fname: true,
          lname: true,
          lrn_number: true,
          grade_level: {
            select: {
              grade_level: true,
            },
          },
        },
        orderBy: [{ lname: "asc" }, { fname: "asc" }, { lrn_number: "asc" }],
        take: 10,
      }),
      prisma.user.findMany({
        where: isNumericLookup
          ? {
              user_id: -1,
            }
          : {
              AND: nameFilters,
              roles: {
                some: {
                  role: {
                    in: LIBRARY_BORROWER_USER_ROLES,
                  },
                },
              },
            },
        select: {
          user_id: true,
          fname: true,
          lname: true,
          roles: {
            select: {
              role: true,
            },
          },
        },
        orderBy: [{ lname: "asc" }, { fname: "asc" }],
        take: 10,
      }),
    ]);

    return [
      ...students.map((student) => ({
        type: "student",
        id: student.student_id,
        display_name: `${student.fname} ${student.lname}`,
        student_id: student.student_id,
        grade_level: student.grade_level?.grade_level ?? null,
        meta: student.lrn_number ? `LRN: ${student.lrn_number}` : null,
      })),
      ...users.map((user) => {
        const sortedRoles = user.roles
          .map((role) => role.role)
          .filter((role) => LIBRARY_BORROWER_USER_ROLES.includes(role))
          .sort(
            (left, right) =>
              LIBRARY_BORROWER_ROLE_PRIORITY.indexOf(left) -
              LIBRARY_BORROWER_ROLE_PRIORITY.indexOf(right),
          );

        return {
        type: "user",
        id: user.user_id,
        display_name: `${user.fname} ${user.lname}`,
        user_id: user.user_id,
        roles: sortedRoles,
        role_label: sortedRoles[0] ?? "User",
        meta: null,
      };
      }),
    ];
  },
};

module.exports = libraryService;
