/**
 * Script to seed default OTP email template
 * Run: node scripts/seedDefaultOTPTemplate.js
 */

require('dotenv').config();
const db = require('../config/database');
const EmailTemplate = require('../src/models/EmailTemplate');

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

    // Default OTP template with AWS-style clean design
    const defaultTemplate = {
      type: 'OTP_Verification',
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
          <!-- Header with Dark Background -->
          <tr>
            <td style="background-color: #232f3e; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px;">College Finder</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px; background-color: #ffffff;">
              <!-- Title -->
              <h2 style="margin: 0 0 20px 0; color: #232f3e; font-size: 28px; font-weight: bold; line-height: 1.2;">Verify your email address</h2>
              
              <!-- Body Text -->
              <p style="color: #232f3e; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0;">
                Thanks for starting the College Finder account creation process. We want to make sure it's really you. Please enter the following verification code when prompted.
              </p>
              
              <!-- Verification Code Label -->
              <p style="color: #232f3e; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">Verification code</p>
              
              <!-- OTP Code - Large and Bold -->
              <div style="margin: 0 0 15px 0;">
                <div style="font-size: 48px; font-weight: bold; color: #232f3e; font-family: 'Courier New', Courier, monospace; letter-spacing: 8px;">
                  {{otpCode}}
                </div>
              </div>
              
              <!-- Validity Period -->
              <p style="color: #666666; font-size: 14px; font-style: italic; margin: 0;">
                (This code is valid for 10 minutes)
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
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

