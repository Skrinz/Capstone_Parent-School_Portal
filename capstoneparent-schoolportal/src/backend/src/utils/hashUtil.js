const bcrypt = require("bcrypt");
const crypto = require("crypto");

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hashed password
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a cryptographically random device token (SHA-256 hex)
 */
const generateDeviceToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Generate OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  hashPassword,
  comparePassword,
  generateDeviceToken,
  generateOTP,
};
