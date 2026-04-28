const authService = require("../services/auth.service");
const parentsService = require("../services/parents.service");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const authController = {
  //http://localhost:5000/api/auth/register/parent
  async registerParent(req, res, next) {
    try {
      const files = req.files || [];
      const userData = req.body;

      const result = await authService.initiateParentRegistration(userData, files);
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

  //http://localhost:5000/api/auth/register/employee
  async registerEmployee(req, res, next) {
    try {
      const files = req.files || [];
      const userData = req.body;

      const result = await authService.initiateEmployeeRegistration(userData, files);
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

  //http://localhost:5000/api/auth/verify-registration-otp
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
        error.message === "One or more students already have an active or pending registration under your account"
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

  //http://localhost:5000/api/auth/resend-registration-otp
  async resendRegistrationOTP(req, res, next) {
    try {
      const { email } = req.body;
      await authService.resendRegistrationOTP(email);
      res
        .status(200)
        .json({ message: "Verification code resent successfully" });
    } catch (error) {
      if (error.message.startsWith("No pending registration found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Failed to send OTP email") {
        return res.status(502).json({ message: error.message });
      }
      next(error);
    }
  },

  //http://localhost:5000/api/auth/login
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
      if (error.message.startsWith("Unrecognized device")) {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  },

  //http://localhost:5000/api/auth/send-otp
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

  //http://localhost:5000/api/auth/verify-otp
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
  //http://localhost:5000/api/auth/logout
  async logout(req, res, next) {
    try {
      res.clearCookie("token");
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      next(error);
    }
  },

  //http://localhost:5000/api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.status(200).json({
        message:
          "If that email is registered, a password reset link has been sent. The link expires in 10 minutes.",
      });
    } catch (error) {
      if (error.message === "Failed to send password reset email") {
        return res.status(502).json({ message: error.message });
      }
      next(error);
    }
  },

  //http://localhost:5000/api/auth/reset-password
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

  //http://localhost:5000/api/auth/reset-password-info?token=
  async getResetPasswordInfo(req, res, next) {
    try {
      const { token } = req.query;
      const result = await authService.getResetPasswordInfo(token);
      res.status(200).json({ data: result });
    } catch (error) {
      if (error.message === "Invalid or expired reset token") {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  },
};

module.exports = authController;
