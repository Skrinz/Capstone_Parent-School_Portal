const authService = require("../services/auth.service");
const parentsService = require("../services/parents.service");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const authController = {
  /**
   * POST /auth/register
   * Validates data and sends a verification OTP. Does NOT write to the DB yet.
   */
  async register(req, res, next) {
    try {
      const files = req.files || [];
      const userData = req.body;

      // Parent role is automatically injected by the service when student_ids
      // is present. No manual role override is needed here.

      const result = await authService.initiateRegistration(userData, files);
      res.status(200).json({ message: result.message });
    } catch (error) {
      if (error.message === "User with this email already exists") {
        return res.status(409).json({ message: error.message });
      }
      if (error.message.startsWith("A verification email was already sent")) {
        return res.status(409).json({ message: error.message });
      }
      if (error.message === "Failed to send OTP email") {
        return res.status(502).json({ message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /auth/verify-registration-otp
   * Verifies OTP and finalises account creation (status: Inactive).
   * Returns the first deviceToken — client must store this for future logins.
   */
  async verifyRegistrationOTP(req, res, next) {
    try {
      const { email, otpCode } = req.body;
      const result = await authService.verifyRegistrationOTP(
        email,
        otpCode,
        parentsService,
      );

      res.status(201).json({
        message: result.message,
        data: {
          user: result.user,
          deviceToken: result.deviceToken,
        },
      });
    } catch (error) {
      if (error.message.startsWith("No pending registration found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Invalid or expired OTP") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message === "One or more students not found") {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message === "Parent already has an active or pending registration"
      ) {
        return res.status(409).json({ message: error.message });
      }
      if (
        error.message === "Email already registered. Please log in instead."
      ) {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /auth/login
   *
   * Requires email, password, AND deviceToken.
   * Returns a JWT immediately when all three are valid.
   *
   * If the client has no deviceToken yet (first login / new device), it must
   * first complete:
   *   POST /auth/send-otp  →  POST /auth/verify-otp
   * which returns a JWT + fresh deviceToken to persist.
   */
  async login(req, res, next) {
    try {
      const { email, password, deviceToken } = req.body;
      const result = await authService.login(email, password, deviceToken);

      // Set JWT as an httpOnly cookie (for browser clients)
      res.cookie("token", result.token, COOKIE_OPTIONS);

      // Also return it in the body so Postman / mobile clients can use it
      res.status(200).json({
        message: "Login successful",
        data: {
          token: result.token,
          user: result.user,
        },
      });
    } catch (error) {
      if (error.message === "Invalid email or password") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.startsWith("Account is inactive")) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message === "Device token is required") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.startsWith("Unrecognized device")) {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /auth/send-otp
   * Sends a 6-digit OTP to the user's email.
   * Used when the client has no deviceToken (first login or new device).
   */
  async sendOTP(req, res, next) {
    try {
      const { email } = req.body;
      await authService.sendOTP(email);
      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Failed to send OTP email") {
        return res.status(502).json({ message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /auth/verify-otp
   * Verifies the OTP, issues a JWT, and registers this device as trusted.
   */
  async verifyOTP(req, res, next) {
    try {
      const { email, otpCode } = req.body;
      const result = await authService.verifyOTP(email, otpCode);

      res.cookie("token", result.token, COOKIE_OPTIONS);
      res.status(200).json({
        message: "OTP verified successfully",
        data: {
          token: result.token,
          user: result.user,
          deviceToken: result.deviceToken,
        },
      });
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Invalid or expired OTP") {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      res.clearCookie("token");
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      next(error);
    }
  },

  async getCurrentUser(req, res, next) {
    try {
      res.status(200).json({ data: req.user });
    } catch (error) {
      next(error);
    }
  },

  async getTrustedDevices(req, res, next) {
    try {
      const devices = await authService.getTrustedDevices(req.user.user_id);
      res.status(200).json({ data: devices });
    } catch (error) {
      next(error);
    }
  },

  async removeTrustedDevice(req, res, next) {
    try {
      const tdId = parseInt(req.params.id, 10);
      await authService.removeTrustedDevice(req.user.user_id, tdId);
      res.status(200).json({ message: "Trusted device removed" });
    } catch (error) {
      if (error.message === "Trusted device not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  // ─── Password Reset ────────────────────────────────────────────────────────

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.status(200).json({
        message:
          "If that email is registered, a password reset link has been sent. The link expires in 1 hour.",
      });
    } catch (error) {
      if (error.message === "Failed to send password reset email") {
        return res.status(502).json({ message: error.message });
      }
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      await authService.resetPassword(token, newPassword);
      res.status(200).json({
        message: "Password has been reset successfully. Please log in.",
      });
    } catch (error) {
      if (error.message === "Invalid or expired reset token") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message === "User not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },
};

module.exports = authController;
