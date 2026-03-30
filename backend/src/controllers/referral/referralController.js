const QRCode = require('qrcode');
const Referral = require('../../models/referral/Referral');
const EmailTemplate = require('../../models/taxonomy/EmailTemplate');
const { sendReferralInviteEmail } = require('../../../utils/email/emailService');

const MAX_RECIPIENTS_PER_REQUEST = 10;

class ReferralController {
  /**
   * GET /api/referral/my-code
   * Returns the authenticated user's referral code, a QR-code data URL, and share URL.
   */
  static async getMyCode(req, res) {
    try {
      const userId = req.user.id;

      let referralCode = await Referral.getUserCode(userId);
      if (!referralCode) {
        referralCode = await Referral.generateAndSaveUserCode(userId);
      }

      const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const shareUrl = `${baseUrl}/login?ref=${encodeURIComponent(referralCode)}`;

      const vars = EmailTemplate.buildReferralVariables(req.user, referralCode);

      let inviteTpl = await EmailTemplate.findReferralInviteRow();
      if (!inviteTpl) inviteTpl = EmailTemplate.getReferralInviteDefaultTemplate();
      const emailSubject = EmailTemplate.replaceVariables(inviteTpl.subject, vars);

      const waTpl = await EmailTemplate.findReferralWhatsAppRow();
      const waBody =
        waTpl?.body_html || EmailTemplate.getReferralWhatsAppDefaultTemplate().body_html;
      const whatsappShareText = EmailTemplate.replaceVariables(waBody, vars);

      const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: { dark: '#341050', light: '#ffffff' },
      });

      res.json({
        success: true,
        data: {
          referralCode,
          qrCodeDataUrl,
          shareUrl,
          emailSubject,
          whatsappShareText,
        },
      });
    } catch (error) {
      console.error('Error fetching referral code:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve referral code' });
    }
  }

  /**
   * POST /api/referral/send-invite
   * Send referral invite emails to one or more recipients via nodemailer.
   * Body: { recipients: string[] }   (max 10 per request)
   */
  static async sendInvite(req, res) {
    try {
      const user = req.user;
      const { recipients } = req.body;

      // ── Validation ──────────────────────────────────────────────────────────
      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, message: 'Provide at least one recipient email' });
      }

      if (recipients.length > MAX_RECIPIENTS_PER_REQUEST) {
        return res.status(400).json({
          success: false,
          message: `You can send to at most ${MAX_RECIPIENTS_PER_REQUEST} recipients at once`,
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = recipients.filter((e) => !emailRegex.test(e));
      if (invalid.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid email address(es): ${invalid.join(', ')}`,
        });
      }

      // ── Get sender's referral code ───────────────────────────────────────────
      let referralCode = await Referral.getUserCode(user.id);
      if (!referralCode) {
        referralCode = await Referral.generateAndSaveUserCode(user.id);
      }

      // ── Sender display name ──────────────────────────────────────────────────
      const senderName =
        user.name ||
        [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        user.email.split('@')[0];

      // ── Send ─────────────────────────────────────────────────────────────────
      const { sent, failed } = await sendReferralInviteEmail(recipients, referralCode, senderName);

      res.json({
        success: true,
        data: { sent, failed },
        message:
          failed.length === 0
            ? `Invite${sent.length > 1 ? 's' : ''} sent successfully`
            : `Sent to ${sent.length}, failed for ${failed.length}`,
      });
    } catch (error) {
      console.error('Error sending referral invite:', error);
      res.status(500).json({ success: false, message: 'Failed to send invite' });
    }
  }

  /**
   * GET /api/referral/my-uses
   * Returns a list of users who signed up using the authenticated user's referral code.
   */
  static async getMyUses(req, res) {
    try {
      const userId = req.user.id;
      const uses = await Referral.getUsesForUser(userId);
      res.json({ success: true, data: { uses } });
    } catch (error) {
      console.error('Error fetching referral uses:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve referral uses' });
    }
  }
}

module.exports = ReferralController;
