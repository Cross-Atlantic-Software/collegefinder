/**
 * Script to seed default OTP email template
 * Run: node scripts/seedDefaultOTPTemplate.js
 */

require('dotenv').config();
const db = require('../config/database');
const EmailTemplate = require('../models/EmailTemplate');

async function seedDefaultTemplate() {
  try {
    // Initialize database connection
    await db.init();
    console.log('✅ Database connected\n');

    // Check if OTP template already exists
    const existing = await EmailTemplate.findByType('OTP_Verification');
    if (existing) {
      console.log('ℹ️  OTP template already exists');
      console.log('Template ID:', existing.id);
      await db.pool.end();
      process.exit(0);
    }

    // Default OTP template with website's pink gradient theme
    const defaultTemplate = {
      type: 'OTP_Verification',
      subject: 'Your Verification Code - College Finder',
      body_html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Manrope', Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header with Gradient -->
                  <tr>
                    <td style="background: linear-gradient(to right, #9705F9 0%, #B903B8 50%, #DB0078 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">College Finder</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px; background-color: #ffffff;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="margin: 0 0 10px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Email Verification</h2>
                        <p style="margin: 0; color: #666666; font-size: 14px;">Verify your email address to continue</p>
                      </div>
                      
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello {{userName}},</p>
                      
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Your verification code for College Finder is:</p>
                      
                      <!-- OTP Code Box -->
                      <div style="text-align: center; margin: 35px 0;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #FBEDF7 0%, #FAF5FF 50%, #DAF1FF 100%); padding: 25px 50px; border-radius: 12px; border: 2px solid #DB0078;">
                          <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #DB0078; font-family: 'Courier New', monospace;">
                            {{otpCode}}
                          </div>
                        </div>
                      </div>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; text-align: center;">
                        <strong style="color: #DB0078;">⏱️ This code will expire in 10 minutes</strong>
                      </p>
                      
                      <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                        If you didn't request this verification code, please ignore this email or contact our support team.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #eeeeee;">
                      <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px;">
                        © ${new Date().getFullYear()} College Finder. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        This is an automated email, please do not reply.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    const template = await EmailTemplate.create(
      defaultTemplate.type,
      defaultTemplate.subject,
      defaultTemplate.body_html
    );

    console.log('✅ Default OTP template created successfully!');
    console.log('Template details:');
    console.log(`  ID: ${template.id}`);
    console.log(`  Type: ${template.type}`);
    console.log(`  Subject: ${template.subject}`);

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding default template:', error);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

seedDefaultTemplate();

