const nodemailer = require('nodemailer');

class EmailAlertService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    this.alertEmail = 'sharmaharsh634@gmail.com';
    this.sentAlerts = new Set(); // Track sent alerts to avoid spam
  }

  /**
   * Send alert email for unknown question type
   * @param {string} questionType - The unknown question type detected
   * @param {number} questionId - The question ID
   * @param {object} questionData - Additional question data
   */
  async sendUnknownQuestionTypeAlert(questionType, questionId, questionData = {}) {
    // Avoid sending duplicate alerts for the same type
    const alertKey = `unknown_type_${questionType}`;
    if (this.sentAlerts.has(alertKey)) {
      console.log(`Alert already sent for question type: ${questionType}`);
      return;
    }

    const knownTypes = [
      'mcq_single',
      'mcq_multiple',
      'numerical',
      'paragraph',
      'assertion_reason',
      'match_following',
      'true_false',
      'fill_blank',
    ];

    // Check if it's truly unknown
    if (knownTypes.includes(questionType)) {
      return; // It's a known type, no alert needed
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: this.alertEmail,
        subject: `🚨 ALERT: Unknown Question Type Detected - "${questionType}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">⚠️ Unknown Question Type Alert</h1>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #dc2626; margin-top: 0;">New Question Type Detected</h2>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #dc2626;">
                  Type: <code style="background: #fee2e2; padding: 4px 8px; border-radius: 4px;">${questionType}</code>
                </p>
              </div>

              <h3 style="color: #333; margin-top: 30px;">Question Details:</h3>
              <ul style="background-color: #f9fafb; padding: 20px; border-radius: 6px; list-style: none;">
                <li style="margin-bottom: 10px;"><strong>Question ID:</strong> ${questionId}</li>
                <li style="margin-bottom: 10px;"><strong>Subject:</strong> ${questionData.subject || 'N/A'}</li>
                <li style="margin-bottom: 10px;"><strong>Difficulty:</strong> ${questionData.difficulty || 'N/A'}</li>
                <li style="margin-bottom: 10px;"><strong>Topic:</strong> ${questionData.topic || 'N/A'}</li>
                <li style="margin-bottom: 10px;"><strong>Detected At:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
              </ul>

              <h3 style="color: #333; margin-top: 30px;">Currently Supported Types:</h3>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; border: 1px solid #86efac;">
                ${knownTypes.map(type => `<span style="display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 4px; margin: 4px; font-size: 13px;">${type}</span>`).join('')}
              </div>

              <h3 style="color: #333; margin-top: 30px;">Action Required:</h3>
              <ol style="color: #555; line-height: 1.8;">
                <li>Add the new question type to the database schema if valid</li>
                <li>Update the UI component to handle this type</li>
                <li>Update the answer submission logic</li>
                <li>Add the type to the known types list in EmailAlertService</li>
              </ol>

              <div style="margin-top: 30px; padding: 15px; background-color: #eff6ff; border-radius: 6px; border: 1px solid #93c5fd;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>Note:</strong> This alert will only be sent once per unique question type to avoid spam.
                </p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
              <p>CollegeFinder - Automated Question Type Monitoring System</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.sentAlerts.add(alertKey);
      console.log(`✅ Alert email sent for unknown question type: ${questionType}`);
    } catch (error) {
      console.error('❌ Failed to send alert email:', error.message);
    }
  }

  /**
   * Clear sent alerts cache (useful for testing or after handling alerts)
   */
  clearAlertCache() {
    this.sentAlerts.clear();
  }
}

module.exports = new EmailAlertService();
