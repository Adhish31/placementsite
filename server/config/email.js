const nodemailer = require('nodemailer');

/**
 * Reusable email sender.
 * Reads config from .env:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
 *
 * For local dev, use Mailtrap (free) — sign up at https://mailtrap.io
 * and paste your credentials into .env.
 */
const sendEmail = async ({ email, subject, html, text }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const message = {
        from: `CareerQuest <no-reply@careerquest.io>`,
        to: email,
        subject,
        text: text || subject,
        html
    };

    const info = await transporter.sendMail(message);
    console.log('📧 Email sent:', info.messageId);
    return info;
};

// ── Email Templates ───────────────────────────────────────────────────────────

const verifyEmailTemplate = (name, verifyUrl) => `
<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;background:#0a0a12;color:#e2e8f0;margin:0;padding:40px 20px;">
  <div style="max-width:520px;margin:auto;background:#13131f;border:1px solid rgba(157,78,221,0.25);border-radius:16px;padding:40px;">
    <h1 style="color:#c77dff;margin-bottom:8px;">CareerQuest</h1>
    <h2 style="margin-top:0;">Verify your email 📬</h2>
    <p>Hi <b>${name}</b>, welcome aboard!</p>
    <p>Click the button below to verify your email address. This link expires in <b>24 hours</b>.</p>
    <a href="${verifyUrl}"
       style="display:inline-block;margin:24px 0;background:linear-gradient(135deg,#9d4edd,#7b2d8b);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
      Verify Email
    </a>
    <p style="color:#94a3b8;font-size:0.85rem;">If the button doesn't work, copy this URL:<br>${verifyUrl}</p>
    <hr style="border-color:rgba(157,78,221,0.1);margin:24px 0;">
    <p style="color:#64748b;font-size:0.8rem;">If you didn't create an account, ignore this email.</p>
  </div>
</body>
</html>`;

const passwordResetTemplate = (name, resetUrl) => `
<!DOCTYPE html>
<html>
<body style="font-family:Inter,sans-serif;background:#0a0a12;color:#e2e8f0;margin:0;padding:40px 20px;">
  <div style="max-width:520px;margin:auto;background:#13131f;border:1px solid rgba(157,78,221,0.25);border-radius:16px;padding:40px;">
    <h1 style="color:#c77dff;margin-bottom:8px;">CareerQuest</h1>
    <h2 style="margin-top:0;">Password Reset Request 🔐</h2>
    <p>Hi <b>${name}</b>,</p>
    <p>We received a request to reset your password. Click below — this link expires in <b>1 hour</b>.</p>
    <a href="${resetUrl}"
       style="display:inline-block;margin:24px 0;background:linear-gradient(135deg,#ff5f56,#c0392b);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
      Reset Password
    </a>
    <p style="color:#94a3b8;font-size:0.85rem;">If the button doesn't work, copy this URL:<br>${resetUrl}</p>
    <hr style="border-color:rgba(157,78,221,0.1);margin:24px 0;">
    <p style="color:#64748b;font-size:0.8rem;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
  </div>
</body>
</html>`;

module.exports = { sendEmail, verifyEmailTemplate, passwordResetTemplate };
