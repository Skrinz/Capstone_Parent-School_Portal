const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.EMAIL_FROM ||
  "Pagsabungan Elementary School Email Verification <noreply@yourdomain.com>";

/**
 * Send OTP email
 */
const sendOTPEmail = async (email, otpCode, options = {}) => {
  try {
    const safeName = options?.name?.trim() || "User";
    const roles = Array.isArray(options?.roles) ? options.roles : [];
    const roleText = roles.length > 0 ? roles.join(", ") : "";
    const temporaryPassword =
      typeof options?.temporaryPassword === "string"
        ? options.temporaryPassword
        : "";

    const accountInfoSection =
      roleText || temporaryPassword
        ? `
          <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">Account Information</h3>
            ${
              roleText
                ? `<p style="margin: 4px 0;"><strong>Assigned Role/s:</strong> ${roleText}</p>`
                : ""
            }
            ${
              temporaryPassword
                ? `<p style="margin: 4px 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace;">${temporaryPassword}</span></p>`
                : ""
            }
            ${
              temporaryPassword
                ? `<p style="margin: 10px 0 0 0; color: #92400e;"><strong>Note:</strong> Upon logging in, please change your password immediately for security.</p>`
                : ""
            }
          </div>
        `
        : "";

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>OTP Verification</h2>
          <p>Hello ${safeName},</p>
          <p>Your OTP code is: <strong style="font-size: 24px;">${otpCode}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          ${accountInfoSection}
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset</h2>
          <p>You requested to reset your password.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
};

/**
 * Send parent verification approval email
 */
const sendParentVerifiedEmail = async (email, parentName) => {
  try {
    const safeName = parentName?.trim() || "Parent";

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your Parent Account Has Been Verified",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Account Verified</h2>
          <p>Hello ${safeName},</p>
          <p>Your parent account has been verified and is now active. You can now access your account.</p>
          <p>For your privacy, the files you submitted for verification have been deleted from the system after approval.</p>
          <p>Thank you.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend email error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendParentVerifiedEmail,
};
