const nodemailer = require('nodemailer');

// Create transporter (configure based on your email provider)
const createTransporter = () => {
  // For development, you can use a test account or configure with real credentials
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    // Use console logging for development
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise<boolean>} - Success status
 */
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();

  // In development without email config, just log
  if (!transporter) {
    console.log('📧 [DEV] OTP Email would be sent to:', email);
    console.log('📧 [DEV] OTP Code:', otp);
    return true;
  }

  const mailOptions = {
    from: `"College Finder" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your College Finder Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(to right, #9705F9 0%, #B903B8 50%, #DB0078 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">College Finder</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #DB0078;">Your Verification Code</h2>
            <p>Hello!</p>
            <p>Your verification code for College Finder is:</p>
            <div style="background: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #DB0078; border: 2px dashed #DB0078; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              © ${new Date().getFullYear()} College Finder. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Your College Finder verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
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

