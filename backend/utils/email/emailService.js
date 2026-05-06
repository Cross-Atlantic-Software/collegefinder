const nodemailer = require('nodemailer');
const EmailTemplate = require('../../src/models/taxonomy/EmailTemplate');

// Create transporter (configure based on your email provider)
const createTransporter = () => {
  // For development, you can use a test account or configure with real credentials
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    // Use console logging for development
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify connection configuration
  console.log('📧 Email configuration:', {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'not set',
    passSet: !!process.env.EMAIL_PASS
  });

  return transporter;
};

/**
 * Send OTP email using template
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();

  const logDevOtpDetails = (status) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📧 [DEV MODE] OTP Email ${status}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`To: ${email}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Valid for 10 minutes`);
      console.log(`${'='.repeat(60)}\n`);
    }
  };

  // Get email template
  let template = await EmailTemplate.findByType('OTP_Verification');
  
  // Fallback to default template if not found
  if (!template) {
      template = {
        subject: 'Verify your email -UniTracko',
        body_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff;">
          <tr>
            <td style="background-color: #232f3e; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">UniTracko</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 50px 40px; background-color: #ffffff;">
              <h2 style="margin: 0 0 20px 0; color: #232f3e; font-size: 28px; font-weight: bold; line-height: 1.2;">Verify your email address</h2>
              <p style="color: #232f3e; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0;">
                You’re almost set. We just need to confirm it’s really you.
              </p>
              <p style="color: #232f3e; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">Your verification code:</p>
              <div style="margin: 0 0 15px 0;">
                <div style="font-size: 48px; font-weight: bold; color: #232f3e; font-family: 'Courier New', Courier, monospace; letter-spacing: 8px;">
                  {{OTP}}
                </div>
              </div>
              <p style="color: #666666; font-size: 14px; font-style: italic; margin: 0;">
                This code is valid for 10 minutes.
              </p>
              <p style="color: #232f3e; font-size: 15px; line-height: 1.6; margin: 18px 0 0 0;">
                Enter this code to complete your sign-up.
              </p>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 12px 0 0 0;">
                If you didn’t request this, you can safely ignore this email.
              </p>
              <p style="color: #232f3e; font-size: 14px; font-weight: 600; margin: 16px 0 0 0;">
                — UniTracko
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} UniTracko. All rights reserved.
              </p>
              <p style="margin: 0; color: #666666; font-size: 12px;">
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
    };
  }

  // Replace template variables
  const subject = EmailTemplate.replaceVariables(template.subject, { otpCode: otp, OTP: otp });
  const html = EmailTemplate.replaceVariables(template.body_html, {
    otpCode: otp,
    OTP: otp,
    userName: email.split('@')[0] || 'User',
    email: email
  });

  // In development without email config, just log
  if (!transporter) {
    logDevOtpDetails('Details');
    return true;
  }

  const mailOptions = {
    from: `"UniTracko" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: html,
    text: `Verify your email -UniTracko\n\nVerify your email address\n\nYou’re almost set. We just need to confirm it’s really you.\n\nYour verification code:\n${otp}\n\nThis code is valid for 10 minutes.\n\nEnter this code to complete your sign-up.\n\nIf you didn’t request this, you can safely ignore this email.\n\n— UniTracko`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    logDevOtpDetails('Sent');
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message || error);
    // In development, don't fail the request if email sending fails
    // Just log the error and continue (OTP is still generated and stored)
    if (process.env.NODE_ENV === 'development') {
      logDevOtpDetails('Sending failed, using console');
      return true;
    }
    // In production, throw error
    throw new Error('Failed to send OTP email');
  }
};

/**
 * Send admin welcome email with login credentials
 * @param {string} email - Admin email
 * @param {string} password - Plain text password (sent only once at creation)
 * @param {string} type - Admin type (data_entry, admin, super_admin, counsellor)
 * @returns {Promise<boolean>} - Success status
 */
const sendAdminWelcomeEmail = async (email, password, type) => {
  const transporter = createTransporter();

  const typeLabel =
    type === 'super_admin'
      ? 'Super Admin'
      : type === 'admin'
        ? 'Admin'
        : type === 'counsellor'
          ? 'Counsellor'
          : 'Data Entry';
  const loginUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const adminLoginUrl = `${loginUrl}/admin/login`;

  const subject = 'Your UniTracko Admin Panel Access';
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #341050 0%, #8B1E8B 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">UniTracko</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Admin Panel Access</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #232f3e; font-size: 22px; font-weight: bold;">Welcome to the Admin Panel</h2>
              <p style="color: #232f3e; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                You have been granted <strong>${typeLabel}</strong> access to the UniTracko admin panel. Please use the credentials below to log in.
              </p>
              <div style="background-color: #f9f9f9; border: 1px solid #eeeeee; border-radius: 6px; padding: 20px; margin: 0 0 24px 0;">
                <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Login Email</p>
                <p style="margin: 0 0 16px 0; color: #232f3e; font-size: 16px; font-family: monospace;">${email}</p>
                <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Password</p>
                <p style="margin: 0; color: #232f3e; font-size: 16px; font-family: monospace;">${password}</p>
              </div>
              <p style="color: #666666; font-size: 14px; margin: 0 0 24px 0;">
                <strong>Important:</strong> For security, please change your password after your first login. Do not share these credentials with anyone.
              </p>
              <a href="${adminLoginUrl}" style="display: inline-block; background: linear-gradient(135deg, #341050 0%, #8B1E8B 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px;">Log in to Admin Panel</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} UniTracko. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; color: #666666; font-size: 12px;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Welcome to UniTracko Admin Panel\n\nYou have been granted ${typeLabel} access.\n\nLogin URL: ${adminLoginUrl}\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after your first login. Do not share these credentials.\n\n© ${new Date().getFullYear()} UniTracko`;

  if (!transporter) {
    console.log('📧 [DEV] Admin welcome email would be sent to:', email);
    console.log('📧 [DEV] Credentials: email=', email, 'password=', password);
    return true;
  }

  const mailOptions = {
    from: `"UniTracko" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Admin welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending admin welcome email:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Email sending failed, but continuing in development mode');
      return true;
    }
    throw new Error('Failed to send admin welcome email');
  }
};

/**
 * Send payment notification email to admin when a student pays for Strength Analysis
 * @param {Object} studentData - Student information
 * @param {number} studentData.id - Student user ID
 * @param {string} studentData.name - Student name
 * @param {string} studentData.email - Student email
 * @param {string} studentData.phone - Student phone
 * @param {string} studentData.class_info - Student class
 * @param {string} studentData.school - Student school
 * @returns {Promise<boolean>}
 */
const sendStrengthPaymentNotification = async (studentData) => {
  const transporter = createTransporter();
  const recipientEmail = 'sharmaharsh634@gmail.com';

  const subject = `Strength Analysis Payment - Student ID #${studentData.id}`;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#f5f5f5;">
    <tr><td align="center" style="padding:20px 0;">
      <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#0f4c75 0%,#3282b8 100%);padding:30px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">UniTracko</h1>
          <p style="margin:8px 0 0 0;color:rgba(255,255,255,0.9);font-size:14px;">Strength Analysis Payment Notification</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 20px 0;color:#232f3e;font-size:22px;font-weight:bold;">New Payment Received</h2>
          <p style="color:#232f3e;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
            A student has successfully completed payment for the Strength Analysis test.
          </p>
          <div style="background-color:#f9f9f9;border:1px solid #eeeeee;border-radius:6px;padding:20px;margin:0 0 24px 0;">
            <p style="margin:0 0 12px 0;"><strong>Student ID:</strong> ${studentData.id}</p>
            <p style="margin:0 0 12px 0;"><strong>Name:</strong> ${studentData.name || 'N/A'}</p>
            <p style="margin:0 0 12px 0;"><strong>Email:</strong> ${studentData.email || 'N/A'}</p>
            <p style="margin:0 0 12px 0;"><strong>Phone:</strong> ${studentData.phone || 'N/A'}</p>
            <p style="margin:0 0 12px 0;"><strong>Class:</strong> ${studentData.class_info || 'N/A'}</p>
            <p style="margin:0;"><strong>School:</strong> ${studentData.school || 'N/A'}</p>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;background-color:#f9f9f9;border-top:1px solid #eeeeee;">
          <p style="margin:0;color:#666666;font-size:12px;">© ${new Date().getFullYear()} UniTracko. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Strength Analysis Payment Notification\n\nStudent ID: ${studentData.id}\nName: ${studentData.name}\nEmail: ${studentData.email}\nPhone: ${studentData.phone}\nClass: ${studentData.class_info}\nSchool: ${studentData.school}`;

  if (!transporter) {
    console.log('📧 [DEV] Strength payment notification would be sent to:', recipientEmail);
    console.log('📧 [DEV] Student data:', studentData);
    return true;
  }

  const mailOptions = {
    from: `"UniTracko" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject,
    html,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Strength payment notification sent for student #${studentData.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending strength payment notification:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Email sending failed, but continuing in development mode');
      return true;
    }
    throw new Error('Failed to send strength payment notification');
  }
};

/**
 * Send referral invite email using the Referral_Invite template.
 * @param {string} recipientEmail
 * @param {string} referralCode
 * @param {string} senderName - Name of the person sharing the code
 * @returns {Promise<boolean>}
 */
/**
 * Send referral invite email(s) using the Referral_Invite template.
 * @param {string|string[]} recipients - One or multiple recipient email addresses
 * @param {string} referralCode
 * @param {string} senderName - Display name of the person sharing the code
 * @returns {Promise<{ sent: string[], failed: string[] }>}
 */
const sendReferralInviteEmail = async (recipients, referralCode, senderName) => {
  const transporter = createTransporter();

  const variables = EmailTemplate.buildReferralVariables(
    senderName ? { name: senderName } : null,
    referralCode
  );

  let template = await EmailTemplate.findReferralInviteRow();
  if (!template) {
    template = EmailTemplate.getReferralInviteDefaultTemplate();
  }

  const subject = EmailTemplate.replaceVariables(template.subject, variables);
  const html = EmailTemplate.replaceVariables(template.body_html, variables);

  const waTpl = await EmailTemplate.findReferralWhatsAppRow();
  const waBody =
    waTpl?.body_html || EmailTemplate.getReferralWhatsAppDefaultTemplate().body_html;
  const text = EmailTemplate.replaceVariables(waBody, variables);

  const recipientList = Array.isArray(recipients) ? recipients : [recipients];
  const sent = [];
  const failed = [];

  for (const recipientEmail of recipientList) {
    if (!transporter) {
      console.log('📧 [DEV] Referral invite email would be sent to:', recipientEmail);
      console.log('📧 [DEV] Referral code:', referralCode);
      sent.push(recipientEmail);
      continue;
    }

    const mailOptions = {
      from: `"${variables.platformName}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject,
      html,
      text,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Referral invite email sent to ${recipientEmail}`);
      sent.push(recipientEmail);
    } catch (error) {
      console.error(`❌ Error sending referral invite to ${recipientEmail}:`, error);
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️  Email to ${recipientEmail} failed in dev — counting as sent`);
        sent.push(recipientEmail);
      } else {
        failed.push(recipientEmail);
      }
    }
  }

  return { sent, failed };
};

/**
 * Send institute referral invite (HTML from REFERRAL_INSTITUTE_INVITE template).
 * @param {string[]} recipients
 * @param {object} institute - row with institute_name, referral_code
 * @returns {Promise<{ sent: string[], failed: string[] }>}
 */
const sendInstituteReferralInviteEmail = async (recipients, institute) => {
  const transporter = createTransporter();
  const variables = EmailTemplate.buildInstituteReferralVariables(institute);
  let template = await EmailTemplate.findReferralInstituteInviteRow();
  if (!template) {
    template = EmailTemplate.getReferralInstituteInviteDefaultTemplate();
  }
  const subject = EmailTemplate.replaceVariables(template.subject, variables);
  const html = EmailTemplate.replaceVariables(template.body_html, variables);
  const text =
    `${variables.instituteName} invites you to join ${variables.platformName}.\n\n` +
    `Referral code: ${variables.referralCode}\n` +
    `Sign up: ${variables.shareUrl}`;

  const recipientList = Array.isArray(recipients) ? recipients : [recipients];
  const sent = [];
  const failed = [];

  for (const recipientEmail of recipientList) {
    if (!transporter) {
      console.log('📧 [DEV] Institute referral would send to:', recipientEmail);
      sent.push(recipientEmail);
      continue;
    }
    const mailOptions = {
      from: `"${variables.platformName}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject,
      html,
      text,
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Institute referral email sent to ${recipientEmail}`);
      sent.push(recipientEmail);
    } catch (error) {
      console.error(`❌ Institute referral email error (${recipientEmail}):`, error);
      if (process.env.NODE_ENV === 'development') {
        sent.push(recipientEmail);
      } else {
        failed.push(recipientEmail);
      }
    }
  }
  return { sent, failed };
};

/**
 * Send password reset link (forgot password)
 * @param {string} email
 * @param {string} resetLink - Full URL to reset-password page with token query param
 */
const sendPasswordResetEmail = async (email, resetLink) => {
  const transporter = createTransporter();
  const subject = 'Reset Your Password - UniTracko';
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#f5f5f5;"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" style="max-width:560px;width:100%;border-collapse:collapse;background:#fff;border-radius:8px;">
      <tr><td style="background:linear-gradient(135deg,#341050 0%,#8B1E8B 100%);padding:28px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">UniTracko</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">Password reset</p>
      </td></tr>
      <tr><td style="padding:32px 28px;">
        <p style="margin:0 0 14px;color:#232f3e;font-size:16px;line-height:1.5;">Hi,</p>
        <p style="margin:0 0 16px;color:#232f3e;font-size:16px;line-height:1.5;">We received a request to reset your UniTracko account password.</p>
        <p style="margin:0 0 16px;color:#232f3e;font-size:16px;line-height:1.5;">Click the button below to create a new password. This link will expire in 1 hour.</p>
        <p style="margin:0 0 24px;text-align:center;">
          <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#341050 0%,#8B1E8B 100%);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:15px;">Reset Password</a>
        </p>
        <p style="margin:0;color:#666;font-size:13px;line-height:1.5;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p style="margin:16px 0 0;color:#666;font-size:13px;line-height:1.5;">If the button doesn&apos;t work, copy and paste the link below into your browser:</p>
        <p style="margin:8px 0 0;color:#999;font-size:11px;word-break:break-all;">${resetLink}</p>
      </td></tr>
      <tr><td style="padding:20px 28px;background:#f9f9f9;border-top:1px solid #eee;">
        <p style="margin:0;color:#666;font-size:12px;">Team UniTracko</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
  const text = `Reset Your Password - UniTracko

Hi,

We received a request to reset your UniTracko account password.

Click the button below to create a new password. This link will expire in 1 hour.

Reset Password: ${resetLink}

If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.

If the button doesn't work, copy and paste the link below into your browser:

${resetLink}

Team UniTracko`;

  if (!transporter) {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(60));
      console.log('📧 [DEV] Password reset email (no SMTP)');
      console.log('To:', email);
      console.log('Link:', resetLink);
      console.log('='.repeat(60) + '\n');
    }
    return true;
  }

  const mailOptions = {
    from: `"UniTracko" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Password reset email error:', error.message || error);
    // Do not swallow errors in development — callers must know delivery failed
    // (forgot-password returns a dev-only link or 500 instead of a false success).
    throw new Error(
      error && error.message ? `Failed to send password reset email: ${error.message}` : 'Failed to send password reset email'
    );
  }
};

/**
 * Send resolution email to a user after admin resolves their query.
 * @param {Object} payload
 * @param {string} payload.toEmail
 * @param {string} payload.name
 * @param {string} payload.queryType
 * @param {string} payload.queryDescription
 * @param {string} payload.answer
 * @returns {Promise<boolean>}
 */
const sendQueryResolutionEmail = async ({
  toEmail,
  name,
  queryType,
  queryDescription,
  answer,
}) => {
  const transporter = createTransporter();
  const safeName = (name || '').trim() || 'there';
  const subject = `Your UniTracko query has been resolved`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#f5f5f5;"><tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" style="max-width:600px;width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#341050 0%,#8B1E8B 100%);padding:28px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">UniTracko</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">Query Resolution</p>
      </td></tr>
      <tr><td style="padding:28px;">
        <p style="margin:0 0 14px;color:#1f2937;font-size:15px;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
          Your query has been reviewed by our team.
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin:0 0 16px;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.3px;">Query Type</p>
          <p style="margin:0 0 12px;color:#111827;font-size:14px;">${queryType || 'General'}</p>
          <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.3px;">Your Query</p>
          <p style="margin:0;color:#111827;font-size:14px;line-height:1.5;">${queryDescription || '-'}</p>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;">
          <p style="margin:0 0 8px;color:#1d4ed8;font-size:12px;text-transform:uppercase;letter-spacing:.3px;">Our Answer</p>
          <p style="margin:0;color:#1f2937;font-size:14px;line-height:1.6;">${answer}</p>
        </div>
      </td></tr>
      <tr><td style="padding:18px 28px;background:#f9f9f9;border-top:1px solid #eee;">
        <p style="margin:0;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} UniTracko</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const text = `Hi ${safeName},

Your query has been reviewed by our team.

Query type: ${queryType || 'General'}
Your query: ${queryDescription || '-'}

Our answer:
${answer}

Regards,
UniTracko Team`;

  if (!transporter) {
    console.log('📧 [DEV] Query resolution email would be sent to:', toEmail);
    return true;
  }

  await transporter.sendMail({
    from: `"UniTracko" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html,
    text,
  });
  return true;
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail,
  sendAdminWelcomeEmail,
  sendStrengthPaymentNotification,
  sendReferralInviteEmail,
  sendInstituteReferralInviteEmail,
  sendQueryResolutionEmail,
};

