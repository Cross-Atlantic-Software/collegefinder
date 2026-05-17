/**
 * Formatter — handles date conversion, capitalisation, and masking
 * so values from the DB are ready for portal form fields.
 */

const Formatter = {
  /**
   * Convert ISO date (YYYY-MM-DD) to the format the portal expects.
   * @param {string} isoDate  "2005-06-15"
   * @param {string} format   "DD/MM/YYYY", "MM-DD-YYYY", "YYYY-MM-DD", etc.
   * @returns {string}
   */
  formatDate(isoDate, format) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;

    const [year, month, day] = parts;

    switch (format) {
      case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
      case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
      case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
      case 'MM-DD-YYYY': return `${month}-${day}-${year}`;
      case 'YYYY-MM-DD': return isoDate;
      case 'YYYY/MM/DD': return `${year}/${month}/${day}`;
      default: return isoDate;
    }
  },

  /**
   * Split an ISO date into {day, month, year} for three-select date pickers.
   */
  splitDate(isoDate) {
    if (!isoDate) return { day: '', month: '', year: '' };
    const [year, month, day] = isoDate.split('-');
    return {
      day: parseInt(day, 10).toString(),
      month: parseInt(month, 10).toString(),
      year
    };
  },

  /**
   * Apply a mask pattern to a raw value. E.g. "123456789012" with mask
   * "XXXX-XXXX-XXXX" → "1234-5678-9012"
   */
  applyMask(value, maskPattern) {
    if (!value || !maskPattern) return value || '';
    let result = '';
    let vi = 0;
    for (let i = 0; i < maskPattern.length && vi < value.length; i++) {
      if (maskPattern[i] === 'X') {
        result += value[vi++];
      } else {
        result += maskPattern[i];
      }
    }
    return result;
  },

  /**
   * Uppercase the first letter of every word.
   */
  titleCase(str) {
    if (!str) return '';
    return str.replace(/\b\w/g, c => c.toUpperCase());
  },

  /**
   * Full uppercase.
   */
  upperCase(str) {
    return str ? str.toUpperCase() : '';
  },

  /**
   * Clean phone number: strip +91, spaces, dashes — return just digits.
   */
  cleanPhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+91')) cleaned = cleaned.slice(3);
    if (cleaned.startsWith('91') && cleaned.length > 10) cleaned = cleaned.slice(2);
    return cleaned;
  }
};

if (typeof window !== 'undefined') {
  window.ExamFillFormatter = Formatter;
}
