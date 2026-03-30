const crypto = require('crypto');

const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excludes I/O/0/1 for readability
const MAX_RETRIES = 10;

/**
 * Generate a random uppercase alphanumeric string of given length.
 */
function randomAlphanumeric(length) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return result;
}

/**
 * Student referral code: 8 uppercase alphanumeric characters.
 */
function generateStudentCode() {
  return randomAlphanumeric(8);
}

/**
 * Institution referral code: sanitised name prefix (up to 5 chars) + hyphen + 5 random chars.
 * e.g. FITJE-8BN3K
 */
function generateInstitutionCode(instituteName) {
  const prefix = (instituteName || 'INST')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 5) || 'INST';
  return `${prefix}-${randomAlphanumeric(5)}`;
}

/**
 * Retry wrapper: keeps generating until isUniqueFn resolves true, up to MAX_RETRIES.
 * @param {() => string} generateFn
 * @param {(code: string) => Promise<boolean>} isUniqueFn
 * @returns {Promise<string>}
 */
async function generateUniqueCode(generateFn, isUniqueFn) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateFn();
    const unique = await isUniqueFn(code);
    if (unique) return code;
  }
  throw new Error(`Failed to generate a unique referral code after ${MAX_RETRIES} attempts`);
}

module.exports = {
  generateStudentCode,
  generateInstitutionCode,
  generateUniqueCode,
};
