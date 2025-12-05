/**
 * Generate a random OTP code
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP code
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Calculate OTP expiry time
 * @param {number} minutes - Minutes until expiry (default: 10)
 * @returns {Date} - Expiry date
 */
const getOTPExpiry = (minutes = 10) => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
};

module.exports = {
  generateOTP,
  getOTPExpiry
};

