/**
 * Inserts default Referral_Invite (HTML email) and Referral_WhatsApp (plain share text) rows
 * if missing, so they appear under Admin → Email Templates and can be edited.
 *
 * Run: cd backend && npm run seed:referral-templates
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const EmailTemplate = require('../src/models/taxonomy/EmailTemplate');
const db = require('../src/config/database');

async function main() {
  console.log('📧 Seeding referral email templates…\n');

  try {
    const inviteDefault = EmailTemplate.getReferralInviteDefaultTemplate();
    let invite = await EmailTemplate.findReferralInviteRow();
    if (!invite) {
      invite = await EmailTemplate.create(
        'REFERRAL_INVITE',
        inviteDefault.subject,
        inviteDefault.body_html
      );
      console.log('✅ Created REFERRAL_INVITE (id %s)', invite.id);
    } else {
      console.log('⏭️  Referral invite template already exists: %s (id %s)', invite.type, invite.id);
    }

    const waDefault = EmailTemplate.getReferralWhatsAppDefaultTemplate();
    let wa = await EmailTemplate.findReferralWhatsAppRow();
    if (!wa) {
      wa = await EmailTemplate.create(
        'REFERRAL_WHATSAPP',
        waDefault.subject,
        waDefault.body_html
      );
      console.log('✅ Created REFERRAL_WHATSAPP (id %s)', wa.id);
    } else {
      console.log('⏭️  Referral WhatsApp template already exists: %s (id %s)', wa.type, wa.id);
    }

    const instDefault = EmailTemplate.getReferralInstituteInviteDefaultTemplate();
    let instT = await EmailTemplate.findReferralInstituteInviteRow();
    if (!instT) {
      instT = await EmailTemplate.create(
        'REFERRAL_INSTITUTE_INVITE',
        instDefault.subject,
        instDefault.body_html
      );
      console.log('✅ Created REFERRAL_INSTITUTE_INVITE (id %s)', instT.id);
    } else {
      console.log('⏭️  Institute referral template already exists: %s (id %s)', instT.type, instT.id);
    }

    console.log('\n✨ Done. Edit them under Admin → Email Templates.');
  } catch (err) {
    console.error('❌', err.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
}

main();
