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
const { sendOTPEmail, sendPasswordResetEmail } = require("../utils/emailUtil");
const usersService = require("./users.service");

// ─── Pending Registrations Store ────────────────────────────────────────────
const pendingRegistrations = new Map();
const PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Password Reset Token Store ─────────────────────────────────────────────
const passwordResetTokens = new Map();
const passwordResetByEmail = new Map();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function invalidateResetToken(email) {
  const oldToken = passwordResetByEmail.get(email);
  if (oldToken) {
    passwordResetTokens.delete(oldToken);
    passwordResetByEmail.delete(email);
  }
}

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
  //http://localhost:5000/api/auth/register
  async initiateRegistration(userData, files = []) {
    const { email, password, fname, lname, contact_num, address, student_ids } =
      userData;

    // Strip any accidental "Parent" from the roles array — Parent is derived
    // from student_ids, not set directly by the client
    const nonParentRoles = (userData.roles || []).filter((r) => r !== "Parent");

    const isParent = !!(student_ids && student_ids.length > 0);

    // Merge: non-parent roles + Parent (if student_ids provided)
    const resolvedRoles = isParent
      ? [...nonParentRoles, "Parent"]
      : nonParentRoles;

    if (isParent) {
      if (!files || files.length === 0) {
        cleanupTempFiles({ filePaths: files.map((f) => ({ path: f.path })) });
        throw new Error("Parents must upload at least one supporting document");
      }
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

    const emailSent = await sendOTPEmail(email, otpCode);
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
        account_status: "Inactive",
      },
      select: {
        user_id: true,
        email: true,
        fname: true,
        lname: true,
        contact_num: true,
        address: true,
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
    // File upload is delegated to usersService.createFiles — file handling
    // is a user-level concern, not specific to parent registration.
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
        );
        file_ids = created.map((f) => f.file_id);
      }
      await parentsService.submitRegistration({
        parent_id: user.user_id,
        student_ids: pending.student_ids,
        file_ids,
      });
    }

    // Issue the first trusted device token — client stores this raw value
    // and sends it with every POST /login going forward
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
        "Email verified. Your account has been created and is pending activation by an administrator.",
    };
  },

  //http://localhost:5000/api/auth/login
  async login(email, password, deviceToken) {
    // 1. Validate credentials
    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.account_status === "Inactive") {
      throw new Error(
        "Account is inactive. Please wait for an administrator to activate your account.",
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // 2. Require a device token — clients without one must go through OTP first
    if (!deviceToken) {
      throw new Error("Device token is required");
    }

    // 3. Verify the device token against trusted devices
    const hashedToken = hashDeviceToken(deviceToken);
    const trustedDevice = await prisma.userTrustedDevice.findFirst({
      where: { user_id: user.user_id, device_token: hashedToken },
    });

    if (!trustedDevice) {
      throw new Error(
        "Unrecognized device. Please complete OTP verification to register this device.",
      );
    }

    // 4. Refresh last_used_at timestamp
    await prisma.userTrustedDevice.update({
      where: { td_id: trustedDevice.td_id },
      data: { last_used_at: new Date() },
    });

    // 5. Issue and return JWT
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

    // Register this device as trusted
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
    if (!user) return true; // silent — do not reveal whether email exists

    invalidateResetToken(email);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

    passwordResetTokens.set(rawToken, { email, expiresAt });
    passwordResetByEmail.set(email, rawToken);

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    const emailSent = await sendPasswordResetEmail(email, resetLink);
    if (!emailSent) {
      passwordResetTokens.delete(rawToken);
      passwordResetByEmail.delete(email);
      throw new Error("Failed to send password reset email");
    }

    return true;
  },

  //http://localhost:5000/api/auth/reset-password
  async resetPassword(token, newPassword) {
    const entry = passwordResetTokens.get(token);

    if (!entry) {
      throw new Error("Invalid or expired reset token");
    }

    if (Date.now() > entry.expiresAt) {
      passwordResetTokens.delete(token);
      passwordResetByEmail.delete(entry.email);
      throw new Error("Invalid or expired reset token");
    }

    const user = await prisma.user.findUnique({
      where: { email: entry.email },
    });
    if (!user) {
      passwordResetTokens.delete(token);
      passwordResetByEmail.delete(entry.email);
      throw new Error("User not found");
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { password: hashedPassword },
    });

    passwordResetTokens.delete(token);
    passwordResetByEmail.delete(entry.email);

    return true;
  },
};

module.exports = authService;
