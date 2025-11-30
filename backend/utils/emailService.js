const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');

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

  // Get email template
  let template = await EmailTemplate.findByType('OTP_Verification');
  
  // Fallback to default template if not found
  if (!template) {
      template = {
        subject: 'Verify your email address - College Finder',
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
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">College Finder</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 50px 40px; background-color: #ffffff;">
              <h2 style="margin: 0 0 20px 0; color: #232f3e; font-size: 28px; font-weight: bold; line-height: 1.2;">Verify your email address</h2>
              <p style="color: #232f3e; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0;">
                Thanks for starting the College Finder account creation process. We want to make sure it's really you. Please enter the following verification code when prompted.
              </p>
              <p style="color: #232f3e; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">Verification code</p>
              <div style="margin: 0 0 15px 0;">
                <div style="font-size: 48px; font-weight: bold; color: #232f3e; font-family: 'Courier New', Courier, monospace; letter-spacing: 8px;">
                  {{otpCode}}
                </div>
              </div>
              <p style="color: #666666; font-size: 14px; font-style: italic; margin: 0;">
                (This code is valid for 10 minutes)
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} College Finder. All rights reserved.
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
  const subject = EmailTemplate.replaceVariables(template.subject, { otpCode: otp });
  const html = EmailTemplate.replaceVariables(template.body_html, {
    otpCode: otp,
    userName: email.split('@')[0] || 'User',
    email: email
  });

  // In development without email config, just log
  if (!transporter) {
    console.log('📧 [DEV] OTP Email would be sent to:', email);
    console.log('📧 [DEV] OTP Code:', otp);
    return true;
  }

  const mailOptions = {
    from: `"College Finder" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: html,
    text: `Verify your email address - College Finder\n\nThanks for starting the College Finder account creation process. We want to make sure it's really you. Please enter the following verification code when prompted.\n\nVerification code: ${otp}\n\n(This code is valid for 10 minutes)`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // In development, don't fail the request if email sending fails
    // Just log the error and continue (OTP is still generated and stored)
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Email sending failed, but continuing in development mode');
      console.log(`📧 [DEV] OTP Code for ${email}: ${otp}`);
      return true;
    }
    // In production, throw error
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  sendOTPEmail
};

