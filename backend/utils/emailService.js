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
      subject: 'Your College Finder Verification Code',
      body_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c5530; margin: 0; font-size: 28px;">Email Verification</h1>
            </div>
            <div style="margin-bottom: 25px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Dear {{userName}},</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">Your verification code is:</p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background-color: #f0f0f0; padding: 20px 40px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2c5530;">
                  {{otpCode}}
                </div>
              </div>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">This code will expire in 10 minutes.</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">If you didn't request this code, please ignore this email.</p>
            </div>
          </div>
        </div>
      `
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

