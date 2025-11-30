/**
 * Script to update existing OTP email template with new design
 * Run: node scripts/updateOTPTemplate.js
 */

require('dotenv').config();
const db = require('../config/database');
const EmailTemplate = require('../models/EmailTemplate');

async function updateOTPTemplate() {
  try {
    // Initialize database connection
    await db.init();
    console.log('✅ Database connected\n');

    // Check if OTP template exists
    const existing = await EmailTemplate.findByType('OTP_Verification');
    if (!existing) {
      console.log('❌ OTP template not found. Please run seedDefaultOTPTemplate.js first');
      await db.pool.end();
      process.exit(1);
    }

    // New OTP template with AWS-style clean design
    const newTemplate = {
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

    const updated = await EmailTemplate.update(existing.id, newTemplate.subject, newTemplate.body_html);

    console.log('✅ OTP template updated successfully!');
    console.log('Template details:');
    console.log(`  ID: ${updated.id}`);
    console.log(`  Type: ${updated.type}`);
    console.log(`  Subject: ${updated.subject}`);
    console.log('\n📧 The new template features:');
    console.log('  - Pink gradient header matching website theme');
    console.log('  - Light gradient background for OTP code box');
    console.log('  - Modern, clean design');
    console.log('  - Responsive email-friendly HTML');

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating OTP template:', error);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

updateOTPTemplate();

