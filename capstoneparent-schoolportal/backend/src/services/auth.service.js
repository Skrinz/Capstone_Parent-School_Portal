const jwt = require("jsonwebtoken");
const fs = require("fs");
const crypto = require("crypto");
const prisma = require("../config/database");
const {
  hashPassword,
  comparePassword,
  generateOTP,
  generateDeviceToken,
  hashDeviceToken,
} = require("../utils/hashUtil");
const {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendStaffAccountCreatedEmail,
} = require("../utils/emailUtil");
const usersService = require("./users.service");

// ─── Pending Registrations Store ────────────────────────────────────────────
const pendingRegistrations = new Map();
const PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MIN_PASSWORD_LENGTH = 8;

// ─── Password Reset Token Store ─────────────────────────────────────────────
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Pending Registration Helpers ───────────────────────────────────────────

function cleanupTempFiles(pending) {
  if (!pending?.filePaths?.length) return;
  for (const f of pending.filePaths) {
    try {
      if (f.path) fs.unlinkSync(f.path);
    } catch (_) {}
  }
}

function storePendingRegistration(email, data) {
  pendingRegistrations.set(email, {
    ...data,
    expiresAt: Date.now() + PENDING_TTL_MS,
  });
}

function getPendingRegistration(email) {
  const entry = pendingRegistrations.get(email);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cleanupTempFiles(entry);
    pendingRegistrations.delete(email);
    return null;
  }
  return entry;
}

function clearPendingRegistration(email) {
  pendingRegistrations.delete(email);
}

/** Sign a JWT for a given user */
function signToken(user) {
  return jwt.sign(
    { userId: user.user_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  );
}

// ─── Auth Service ────────────────────────────────────────────────────────────

const authService = {
  //http://localhost:5000/api/auth/register/parent
  async initiateParentRegistration(userData, files = []) {
    const {
      email,
      password,
      fname,
      lname,
      contact_num,
      address,
      date_of_birth,
      student_ids,
    } = userData;

    const resolvedRoles = ["Parent"];

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      cleanupTempFiles({ filePaths: files.map((f) => ({ path: f.path })) });
      throw new Error(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    if (!files || files.length < 2) {
      cleanupTempFiles({ filePaths: files.map((f) => ({ path: f.path })) });
      throw new Error("Parents must upload at least two supporting documents");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      cleanupTempFiles({ filePaths: files.map((f) => ({ path: f.path })) });
      throw new Error("User with this email already exists");
    }

    if (getPendingRegistration(email)) {
      cleanupTempFiles({ filePaths: files.map((f) => ({ path: f.path })) });
      throw new Error(
        "A verification email was already sent. Please check your inbox.",
      );
    }

    const hashedPassword = await hashPassword(password);
    const otpCode = generateOTP();
    const otpExpiresAt = Date.now() + PENDING_TTL_MS;

    storePendingRegistration(email, {
      email,
      hashedPassword,
      fname,
      lname,
      contact_num,
      address,
      date_of_birth,
      roles: resolvedRoles,
      student_ids,
      otpCode,
      otpExpiresAt,
      filePaths: files.map((f) => ({
        originalname: f.originalname,
        path: f.path,
        mimetype: f.mimetype,
        size: f.size,
      })),
    });

    const emailSent = await sendOTPEmail(email, otpCode, { isRegistration: true });
    if (!emailSent) {
      cleanupTempFiles(getPendingRegistration(email));
      clearPendingRegistration(email);
      throw new Error("Failed to send OTP email");
    }

    return {
      message:
        "Verification OTP sent. Please verify your email to complete registration.",
    };
  },

  async resendRegistrationOTP(email) {
    const pending = getPendingRegistration(email);
    if (!pending) {
      throw new Error(
        "No pending registration found or it has expired. Please register again.",
      );
    }

    const otpCode = generateOTP();
    const otpExpiresAt = Date.now() + PENDING_TTL_MS;

    // Update the pending entry
    storePendingRegistration(email, {
      ...pending,
      otpCode,
      otpExpiresAt,
    });

    const emailSent = await sendOTPEmail(email, otpCode, {
      isRegistration: true,
    });
    if (!emailSent) {
      throw new Error("Failed to send OTP email");
    }

    return true;
  },

  //http://localhost:5000/api/auth/register/employee
  async initiateEmployeeRegistration(userData, files = []) {
    const {
      email,
      password,
      fname,
      lname,
      contact_num,
      address,
      date_of_birth,
      roles,
      account_status,
    } = userData;

    const resolvedRoles = (roles || []).filter((r) => r !== "Parent");
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      cleanupTempFiles({ filePaths: files.map((f) => ({ path: f.path })) });
      throw new Error(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    if (resolvedRoles.length === 0) {
      cleanupTempFiles({ filePaths: files.map((f) => ({ path: f.path })) });
      throw new Error("Employee must have at least one valid role");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      cleanupTempFiles({ filePaths: files.map((f) => ({ path: f.path })) });
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await hashPassword(password);
    const normalizedAccountStatus =
      String(account_status || "").toLowerCase() === "inactive"
        ? "Inactive"
        : "Active";

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fname,
          lname,
          contact_num,
          address,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          account_status: normalizedAccountStatus,
        },
        select: {
          user_id: true,
          email: true,
          fname: true,
          lname: true,
          account_status: true,
        },
      });

      await tx.userRole_Model.createMany({
        data: resolvedRoles.map((role) => ({
          user_id: createdUser.user_id,
          role,
        })),
      });

      return createdUser;
    });

    const emailSent = await sendStaffAccountCreatedEmail(email, {
      name: `${fname} ${lname}`.trim(),
      roles: resolvedRoles,
      temporaryPassword: password,
    });

    return {
      message: emailSent
        ? "Staff account created successfully. Login details have been sent by email."
        : "Staff account created successfully, but the email notification could not be sent.",
      user,
    };
  },

  //http://localhost:5000/api/auth/verify-registration-otp
  async verifyRegistrationOTP(email, otpCode, parentsService) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("Email already registered. Please log in instead.");
    }

    const pending = getPendingRegistration(email);
    if (!pending) {
      throw new Error(
        "No pending registration found or it has expired. Please register again.",
      );
    }

    if (Date.now() > pending.otpExpiresAt) {
      cleanupTempFiles(pending);
      clearPendingRegistration(email);
      throw new Error("Invalid or expired OTP");
    }

    if (pending.otpCode !== otpCode) {
      throw new Error("Invalid or expired OTP");
    }

    clearPendingRegistration(email);

    const user = await prisma.user.create({
      data: {
        email: pending.email,
        password: pending.hashedPassword,
        fname: pending.fname,
        lname: pending.lname,
        contact_num: pending.contact_num,
        address: pending.address,
        date_of_birth: pending.date_of_birth
          ? new Date(pending.date_of_birth)
          : null,
        account_status: "Inactive",
      },
      select: {
        user_id: true,
        email: true,
        fname: true,
        lname: true,
        contact_num: true,
        address: true,
        date_of_birth: true,
        account_status: true,
        created_at: true,
      },
    });

    // Create all role records in one query
    if (pending.roles && pending.roles.length > 0) {
      await prisma.userRole_Model.createMany({
        data: pending.roles.map((role) => ({
          user_id: user.user_id,
          role,
        })),
      });
    }

    // Submit parent registration if applicable.
    if (
      pending.roles?.includes("Parent") &&
      pending.student_ids &&
      parentsService
    ) {
      let file_ids;
      if (pending.filePaths && pending.filePaths.length > 0) {
        const created = await usersService.createFiles(
          pending.filePaths,
          user.user_id,
          { storageTarget: "parent_docs" },
        );
        file_ids = created.map((f) => f.file_id);
      }
      await parentsService.submitRegistration({
        parent_id: user.user_id,
        student_ids: pending.student_ids,
        file_ids,
      });
    }

    // Issue the first trusted device token
    const rawToken = generateDeviceToken();
    await prisma.userTrustedDevice.create({
      data: {
        user_id: user.user_id,
        device_token: hashDeviceToken(rawToken),
        last_used_at: new Date(),
      },
    });
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      deviceToken: rawToken,
      message:
        "Email verified. Your account has been created and is now pending. Please wait for an administrator or teacher to check your registration.",
    };
  },

  //http://localhost:5000/api/auth/login
  async login(email, password, deviceToken) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.account_status === "Inactive") {
      const isParent = user.roles.some((r) => r.role === "Parent");
      if (!isParent) {
        throw new Error(
          "Account is inactive. Please wait for an administrator to activate your account.",
        );
      }
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    if (!deviceToken) {
      throw new Error(
        "Unrecognized device. Please complete OTP verification to register this device.",
      );
    }

    const hashedToken = hashDeviceToken(deviceToken);
    const trustedDevice = await prisma.userTrustedDevice.findFirst({
      where: { user_id: user.user_id, device_token: hashedToken },
    });

    if (!trustedDevice) {
      throw new Error(
        "Unrecognized device. Please complete OTP verification to register this device.",
      );
    }

    await prisma.userTrustedDevice.update({
      where: { td_id: trustedDevice.td_id },
      data: { last_used_at: new Date() },
    });

    const token = signToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return { token, user: userWithoutPassword };
  },

  //http://localhost:5000/api/auth/send-otp
  async sendOTP(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.userOTPCode.create({
      data: { user_id: user.user_id, otp_code: otpCode, expires_at: expiresAt },
    });

    const emailSent = await sendOTPEmail(email, otpCode);
    if (!emailSent) {
      throw new Error("Failed to send OTP email");
    }

    return true;
  },

  //http://localhost:5000/api/auth/verify-otp
  async verifyOTP(email, otpCode) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const otp = await prisma.userOTPCode.findFirst({
      where: {
        user_id: user.user_id,
        otp_code: otpCode,
        used: false,
        expires_at: { gt: new Date() },
      },
    });
    if (!otp) {
      throw new Error("Invalid or expired OTP");
    }

    await prisma.userOTPCode.update({
      where: { otp_id: otp.otp_id },
      data: { used: true },
    });

    const rawToken = generateDeviceToken();
    await prisma.userTrustedDevice.create({
      data: {
        user_id: user.user_id,
        device_token: hashDeviceToken(rawToken),
        last_used_at: new Date(),
      },
    });

    const token = signToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return { token, user: userWithoutPassword, deviceToken: rawToken };
  },

  //http://localhost:5000/api/auth/forgot-password
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return true;

    await prisma.userPasswordResetToken.deleteMany({
      where: { user_id: user.user_id },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.userPasswordResetToken.create({
      data: {
        user_id: user.user_id,
        token: rawToken,
        expires_at: expiresAt,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    const emailSent = await sendPasswordResetEmail(email, resetLink);
    if (!emailSent) {
      await prisma.userPasswordResetToken.deleteMany({
        where: { user_id: user.user_id },
      });
      throw new Error("Failed to send password reset email");
    }

    return true;
  },

  //http://localhost:5000/api/auth/reset-password
  async resetPassword(token, newPassword) {
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      );
    }

    const entry = await prisma.userPasswordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!entry || entry.used) {
      throw new Error("Invalid or expired reset token");
    }

    if (new Date() > entry.expires_at) {
      await prisma.userPasswordResetToken.delete({ where: { prt_id: entry.prt_id } });
      throw new Error("Invalid or expired reset token");
    }

    const user = entry.user;
    if (!user) {
      throw new Error("User not found");
    }

    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.$transaction([
      prisma.user.update({
        where: { user_id: user.user_id },
        data: { password: hashedPassword },
      }),
      prisma.userPasswordResetToken.delete({
        where: { prt_id: entry.prt_id },
      }),
    ]);

    return true;
  },

  //http://localhost:5000/api/auth/reset-password-info?token=
  async getResetPasswordInfo(token) {
    const entry = await prisma.userPasswordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!entry || entry.used) {
      throw new Error("Invalid or expired reset token");
    }

    if (new Date() > entry.expires_at) {
      await prisma.userPasswordResetToken.delete({ where: { prt_id: entry.prt_id } });
      throw new Error("Invalid or expired reset token");
    }

    const email = entry.user.email;
    const [local, domain] = email.split("@");
    const maskedLocal =
      local.length <= 2
        ? local[0] + "*".repeat(Math.max(0, local.length - 1))
        : local.slice(0, 2) + "*".repeat(local.length - 2);

    return { maskedEmail: `${maskedLocal}@${domain}` };
  },
};

module.exports = authService;
