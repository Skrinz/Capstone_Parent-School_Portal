const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS =
  process.env.EMAIL_FROM ||
  "Pagsabungan Elementary School Email Verification <noreply@yourdomain.com>";

const LOGIN_URL = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
const REGISTER_URL = `${process.env.FRONTEND_URL || "http://localhost:5173"}/register`;

const buildAutoVerifyUrl = (baseUrl, email, otpCode) =>
  `${baseUrl}?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otpCode)}&autoVerify=1`;

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
    const includeAutoVerifyLink = options?.includeAutoVerifyLink !== false;
    const isRegistration = options?.isRegistration === true;
    
    // Choose base URL based on whether this is for registration or login
    const baseUrl = isRegistration ? REGISTER_URL : LOGIN_URL;
    const autoVerifyUrl = buildAutoVerifyUrl(baseUrl, email, otpCode);

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
                ? `
                <div style="margin-top: 12px; padding: 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Note:</strong> Upon logging in, please change your password immediately for security.</p>
                  <p style="margin: 8px 0 0 0;"><a href="${LOGIN_URL}" style="display: inline-block; padding: 8px 16px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Portal</a></p>
                </div>
                `
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
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #374151;">
          <h2 style="color: #111827; margin-top: 0;">OTP Verification</h2>
          <p>Hello ${safeName},</p>
          <p>Your OTP code is: <strong style="font-size: 24px; color: #2563eb; letter-spacing: 2px;">${otpCode}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          ${
            includeAutoVerifyLink
              ? `
              <div style="margin: 20px 0;">
                <a href="${autoVerifyUrl}" style="display: inline-block; padding: 12px 20px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Automatically</a>
              </div>
              <p style="margin-top: 0;">You can click the button above to verify automatically, or enter the OTP manually on the login page.</p>
              `
              : ""
          }
          ${accountInfoSection}
          <div style="margin-top: 24px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
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
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #374151;">
          <h2 style="color: #111827; margin-top: 0;">Password Reset</h2>
          <p>You requested to reset your password.</p>
          <p>Click the link below to reset your password:</p>
          <div style="margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 10 minutes.</p>
          <div style="margin-top: 24px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <p>If you didn't request this, please ignore this email.</p>
          </div>
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
 * Send staff account creation email
 */
const sendStaffAccountCreatedEmail = async (
  email,
  { name, roles = [], temporaryPassword = "" } = {},
) => {
  try {
    const safeName = name?.trim() || "Staff";
    const roleText =
      Array.isArray(roles) && roles.length > 0 ? roles.join(", ") : "Staff";

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your Staff Account Has Been Created",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #374151;">
          <h2 style="color: #111827; margin-top: 0;">Staff Account Created</h2>
          <p>Hello ${safeName},</p>
          <p>Your staff account has been created successfully.</p>
          <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <p style="margin: 4px 0;"><strong>Assigned Role/s:</strong> ${roleText}</p>
            ${
              temporaryPassword
                ? `<p style="margin: 4px 0;"><strong>Temporary Password:</strong> <span style="font-family: monospace;">${temporaryPassword}</span></p>`
                : ""
            }
          </div>
          <div style="margin-top: 16px; padding: 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;">
            <p style="margin: 0 0 8px 0;">Use the button below to log in. Device verification will be requested during sign-in.</p>
            <p style="margin: 0;"><a href="${LOGIN_URL}" style="display: inline-block; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Portal</a></p>
          </div>
          <div style="margin-top: 24px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <p>Please change your password after your first successful login.</p>
          </div>
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
const sendParentVerifiedEmail = async (email, parentName, studentNames = []) => {
  try {
    const safeName = parentName?.trim() || "Parent";
    const studentsList =
      studentNames.length > 0 ? studentNames.join(", ") : "your child";

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Your Parent Account Has Been Verified",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #374151;">
          <h2 style="color: #111827; margin-top: 0;">Account Verified</h2>
          <p>Hello ${safeName},</p>
          <p>Your parent account has been verified and is now active.</p>
          <p>You now have access to the <strong>class schedule, grades, and library records</strong> of ${studentsList}, the student(s) you applied registration for.</p>
          <div style="margin: 24px 0;">
            <a href="${LOGIN_URL}" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Portal</a>
          </div>
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

/**
 * Send parent registration denial email
 */
const sendParentDeniedEmail = async (email, parentName, remarks) => {
  try {
    const safeName = parentName?.trim() || "Parent";
    const reasonText = remarks?.trim() || "No specific reason provided.";

    console.log(`[emailUtil] Attempting to send denial email to: ${email}`);
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: "Update Regarding Your Parent Registration",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #374151;">
          <h2 style="color: #dc2626; margin-top: 0;">Registration Update</h2>
          <p>Hello ${safeName},</p>
          <p>Thank you for your interest in registering for the Parent-School Portal.</p>
          <p>After reviewing your application, we regret to inform you that your registration has been <strong>denied</strong> at this time.</p>
          <div style="margin-top: 16px; padding: 16px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #991b1b;">Remarks from Administrator:</h3>
            <p style="margin: 0; color: #b91c1c;">${reasonText}</p>
          </div>
          <p style="margin-top: 20px;">If you believe this was an error or you would like to try again with corrected information/documents, you may log in to the portal to submit a resubmission.</p>
          <p>Thank you for your understanding.</p>
        </div>
      `,
    });

    if (error) {
      console.error("[emailUtil] Resend email error:", error);
      return false;
    }

    console.log(`[emailUtil] Email sent successfully. Data:`, data);
    return true;
  } catch (error) {
    console.error("[emailUtil] Email sending error:", error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendStaffAccountCreatedEmail,
  sendParentVerifiedEmail,
  sendParentDeniedEmail,
};
