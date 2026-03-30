const db = require('../../config/database');

class EmailTemplate {
  static async findByType(type) {
    const result = await db.query(
      'SELECT * FROM email_templates WHERE type = $1',
      [type]
    );
    return result.rows[0] || null;
  }

  /** Referral HTML email row (CMS). Supports legacy type Referral_Invite. */
  static async findReferralInviteRow() {
    return (
      (await this.findByType('REFERRAL_INVITE')) ||
      (await this.findByType('Referral_Invite')) ||
      null
    );
  }

  /** Referral WhatsApp / plain-text row (CMS). Supports legacy Referral_WhatsApp. */
  static async findReferralWhatsAppRow() {
    return (
      (await this.findByType('REFERRAL_WHATSAPP')) ||
      (await this.findByType('Referral_WhatsApp')) ||
      null
    );
  }

  /** Institute referral HTML email (CMS). */
  static async findReferralInstituteInviteRow() {
    return (
      (await this.findByType('REFERRAL_INSTITUTE_INVITE')) ||
      (await this.findByType('Referral_Institute_Invite')) ||
      null
    );
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM email_templates WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll() {
    const result = await db.query(
      'SELECT id, type, subject, body_html, created_at, updated_at FROM email_templates ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async create(type, subject, bodyHtml) {
    const result = await db.query(
      `INSERT INTO email_templates (type, subject, body_html) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [type, subject, bodyHtml]
    );
    return result.rows[0];
  }

  static async update(id, subject, bodyHtml) {
    const result = await db.query(
      `UPDATE email_templates 
       SET subject = $1, body_html = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [subject, bodyHtml, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM email_templates WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Replace template variables with actual values
   * @param {string} template - HTML template string
   * @param {object} variables - Object with variable values
   * @returns {string} - Template with replaced variables
   */
  /**
   * Plain-text message for WhatsApp (and multipart email text/*) — stored as body_html in CMS row type Referral_WhatsApp.
   * Placeholders: {{platformName}} {{userName}} {{referralCode}} {{shareUrl}} {{signUpLink}}
   */
  static getReferralWhatsAppDefaultTemplate() {
    return {
      subject: 'WhatsApp share — not used as email subject',
      body_html:
        'Join me on {{platformName}}!\n\n' +
        'Use my referral code *{{referralCode}}* when signing up:\n' +
        '{{shareUrl}}',
    };
  }

  /**
   * Shared variable map for referral invite email, WhatsApp text, and dashboard previews.
   */
  static buildReferralVariables(user, referralCode) {
    const platformName = 'Unitracko';
    const baseUrl =
      process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/login?ref=${encodeURIComponent(referralCode)}`;
    let userName = 'A friend';
    if (user) {
      userName =
        user.name ||
        [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        (user.email ? user.email.split('@')[0] : '') ||
        'A friend';
    }
    return {
      userName,
      referralCode,
      signUpLink: shareUrl,
      shareUrl,
      platformName,
      year: String(new Date().getFullYear()),
    };
  }

  /**
   * Variables for institute-sent referral emails (CMS type REFERRAL_INSTITUTE_INVITE).
   * institute row must include institute_name and referral_code.
   */
  static buildInstituteReferralVariables(institute) {
    const platformName = 'Unitracko';
    const baseUrl =
      process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const referralCode = institute.referral_code || '';
    const shareUrl = `${baseUrl}/login?ref=${encodeURIComponent(referralCode)}`;
    return {
      instituteName: institute.institute_name || 'Our institute',
      referralCode,
      signUpLink: shareUrl,
      shareUrl,
      platformName,
      year: String(new Date().getFullYear()),
    };
  }

  static getReferralInstituteInviteDefaultTemplate() {
    return {
      subject: '{{instituteName}} — Join {{platformName}} with our referral code',
      body_html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0edf6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0edf6;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(52,16,80,0.12);">
        <tr><td style="background:linear-gradient(135deg,#140E27 0%,#341050 50%,#9705F9 100%);padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);">Partner invite</p>
          <h1 style="margin:8px 0 0;font-size:26px;font-weight:800;color:#fff;">{{platformName}}</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#140E27;">Hello,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#4a4565;line-height:1.65;">
            <strong style="color:#341050;">{{instituteName}}</strong> invites you to join <strong>{{platformName}}</strong> &mdash; plan exams, track applications, and simplify admissions.
          </p>
          <div style="background:#faf5ff;border:2px dashed #9705F9;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9705F9;">Referral code</p>
            <p style="margin:0;font-size:28px;font-weight:900;letter-spacing:6px;color:#340F50;font-family:monospace;">{{referralCode}}</p>
          </div>
          <div style="text-align:center;">
            <a href="{{signUpLink}}" style="display:inline-block;background:linear-gradient(135deg,#140E27,#9705F9);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px;">Create account</a>
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#faf5ff;border-top:1px solid #ede9f6;text-align:center;">
          <p style="margin:0;font-size:11px;color:#a09abf;">&copy; {{year}} {{platformName}}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    };
  }

  static getReferralInviteDefaultTemplate() {
    return {
      subject: '{{userName}} invited you to join {{platformName}} — referral code inside',
      body_html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited</title>
</head>
<body style="margin:0;padding:0;background-color:#f0edf6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0edf6;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(52,16,80,0.15);">

          <!-- ═══ HERO HEADER ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#140E27 0%,#341050 35%,#9705F9 70%,#DB0078 100%);padding:0;">
              <!-- Top accent bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 48px 36px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.55);font-weight:700;">You&rsquo;re Invited</p>
                    <h1 style="margin:0;font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-1px;line-height:1.1;">{{platformName}}</h1>
                    <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.75);font-style:italic;">College Admissions &mdash; Simplified</p>
                  </td>
                </tr>
                <!-- Wave bottom -->
                <tr>
                  <td style="font-size:0;line-height:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="height:8px;background:#9705F9;"></td>
                        <td width="34%" style="height:8px;background:#B903B8;"></td>
                        <td width="33%" style="height:8px;background:#DB0078;"></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ BODY ═══ -->
          <tr>
            <td style="padding:44px 48px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#140E27;line-height:1.3;">
                Hey there! 👋
              </p>
              <p style="margin:0 0 28px;font-size:16px;color:#4a4565;line-height:1.75;">
                Your friend <strong style="color:#341050;">{{userName}}</strong> thinks you'd love <strong style="color:#341050;">{{platformName}}</strong> &mdash; the smartest way to navigate college admissions, find the right exams, and track your entire application journey in one place.
              </p>

              <!-- Divider -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td width="40%" style="border-top:1px solid #ede9f6;"></td>
                  <td width="20%" align="center" style="padding:0 12px;font-size:12px;color:#9b89c4;font-weight:600;white-space:nowrap;">USE THIS CODE</td>
                  <td width="40%" style="border-top:1px solid #ede9f6;"></td>
                </tr>
              </table>

              <!-- Code card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#faf5ff 0%,#f3e8ff 100%);border:2px dashed #9705F9;border-radius:16px;padding:28px 24px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#9705F9;">Referral Code</p>
                    <p style="margin:0 0 14px;font-size:42px;font-weight:900;letter-spacing:10px;color:#340F50;font-family:'Courier New',Courier,monospace;line-height:1;">&nbsp;{{referralCode}}&nbsp;</p>
                    <p style="margin:0;font-size:13px;color:#7c6e9e;">This code is pre-filled when you use the link below</p>
                  </td>
                </tr>
              </table>

              <!-- Body text -->
              <p style="margin:0 0 32px;font-size:15px;color:#4a4565;line-height:1.75;">
                Join thousands of students who&rsquo;ve already simplified their admissions journey. It&rsquo;s free to sign up and takes less than 2 minutes.
              </p>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                <tr>
                  <td style="border-radius:12px;overflow:hidden;">
                    <a href="{{signUpLink}}" target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#140E27 0%,#341050 35%,#9705F9 70%,#DB0078 100%);color:#ffffff;text-decoration:none;padding:18px 48px;font-size:17px;font-weight:800;letter-spacing:0.3px;border-radius:12px;">
                      Create My Free Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background:#faf5ff;border-top:1px solid #ede9f6;padding:24px 48px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#341050;">{{platformName}}</p>
              <p style="margin:0;font-size:12px;color:#a09abf;line-height:1.6;">
                You received this invite because {{userName}} shared their referral code with you.<br>
                &copy; {{year}} {{platformName}}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    };
  }

  static replaceVariables(template, variables = {}) {
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });
    return result;
  }
}

module.exports = EmailTemplate;

