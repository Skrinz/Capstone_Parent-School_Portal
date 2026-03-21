const prisma = require("../config/database");
const { uploadFiles } = require("../utils/supabaseStorage");
const { findOrThrow } = require("../utils/findOrThrow");

const usersService = {
  /**
   * Upload multer file objects to Supabase Storage in parallel and persist
   * File records.
   *
   * uploadFiles() uploads all files concurrently and returns an array of
   * permanent signed URLs in the same order as the input. Each URL is stored
   * directly in File.file_path — no URL generation step is needed on reads.
   *
   * Precondition: the User row for `uploaded_by` must already exist in the DB
   * because File.uploaded_by is a non-nullable FK referencing User.user_id.
   *
   * @param {Array<{originalname,path,mimetype,size}>} files  multer file objects
   * @param {number} uploaded_by  user_id of the owning user
   * @returns {Promise<Array>} created File records (file_path = signed URL)
   */
  async createFiles(files, uploaded_by) {
    if (!files || files.length === 0) return [];

    await findOrThrow(
      () => prisma.user.findUnique({ where: { user_id: uploaded_by } }),
      "Uploader not found",
    );

    // Upload all files to Supabase in parallel — returns signed URLs in input order
    const signedUrls = await uploadFiles(files);

    // Persist all File rows using createMany for a single DB round-trip
    const fileData = files.map((f, i) => ({
      file_name: f.originalname,
      file_path: signedUrls[i],
      file_type: f.mimetype,
      file_size: f.size,
      uploaded_by,
    }));

    await prisma.file.createMany({ data: fileData });

    // createMany does not return created rows — fetch them back by matching
    // the signed URLs which are guaranteed unique per upload
    const created = await prisma.file.findMany({
      where: { file_path: { in: signedUrls } },
    });

    return created;
  },

  async getAllUsers({ page, limit, role, status }) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (status) {
      where.account_status = status;
    }
    if (role) {
      where.roles = {
        some: {
          role: role,
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          user_id: true,
          email: true,
          fname: true,
          lname: true,
          contact_num: true,
          address: true,
          account_status: true,
          created_at: true,
          roles: true,
        },
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  },

  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        email: true,
        fname: true,
        lname: true,
        contact_num: true,
        address: true,
        account_status: true,
        created_at: true,
        updated_at: true,
        roles: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },

  async updateUser(userId, updateData) {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!existingUser) {
      throw new Error("User not found");
    }

    if (updateData.email && updateData.email !== existingUser.email) {
      const duplicateEmail = await prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (duplicateEmail) {
        throw new Error("Email is already in use");
      }
    }

    const user = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      select: {
        user_id: true,
        email: true,
        fname: true,
        lname: true,
        contact_num: true,
        address: true,
        account_status: true,
        updated_at: true,
      },
    });

    return user;
  },

  /**
   * Update a user's account_status and/or roles in a single operation.
   *
   * Either field is optional — supply one or both. When roles is provided,
   * all existing role records are replaced atomically inside a transaction
   * so the user is never left in a roleless state if something fails.
   *
   * @param {number} userId
   * @param {{ account_status?: string, roles?: string[] }} payload
   * @returns {{ user_id, email, fname, lname, account_status, roles }}
   */
  async updateAccountSettings(userId, { account_status, roles }) {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { roles: true },
    });
    if (!existingUser) {
      throw new Error("User not found");
    }

    if (account_status && existingUser.account_status === account_status) {
      throw new Error(`User account is already ${account_status}`);
    }

    return prisma.$transaction(async (tx) => {
      // Update account_status when provided
      if (account_status) {
        await tx.user.update({
          where: { user_id: userId },
          data: { account_status },
        });
      }

      // Replace roles when provided
      if (roles) {
        const uniqueRoles = [...new Set(roles)];
        await tx.userRole_Model.deleteMany({ where: { user_id: userId } });
        await tx.userRole_Model.createMany({
          data: uniqueRoles.map((role) => ({ user_id: userId, role })),
        });
      }

      // Return the full updated user
      return tx.user.findUnique({
        where: { user_id: userId },
        select: {
          user_id: true,
          email: true,
          fname: true,
          lname: true,
          account_status: true,
          roles: true,
        },
      });
    });
  },

  async assignRole(userId, role) {
    const existingUser = await prisma.user.findUnique({
      where: { user_id: userId },
    });
    if (!existingUser) {
      throw new Error("User not found");
    }

    const existingRole = await prisma.userRole_Model.findFirst({
      where: { user_id: userId, role },
    });
    if (existingRole) {
      throw new Error("User already has this role");
    }

    const userRole = await prisma.userRole_Model.create({
      data: { user_id: userId, role },
    });

    return userRole;
  },

  async removeRole(userId, roleId) {
    const existingRole = await prisma.userRole_Model.findFirst({
      where: { ur_id: roleId, user_id: userId },
    });
    if (!existingRole) {
      throw new Error("Role not found for this user");
    }

    await prisma.userRole_Model.delete({
      where: { ur_id: roleId, user_id: userId },
    });

    return true;
  },
};

module.exports = usersService;
