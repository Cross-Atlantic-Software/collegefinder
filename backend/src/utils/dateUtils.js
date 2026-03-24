/**
 * Calculate age in years from date of birth (timezone-safe, date-only).
 * @param {string|Date} dateOfBirth - DOB as "YYYY-MM-DD" string or Date
 * @returns {number|null} Age in years, or null if invalid/missing
 */
function calculateAgeFromDOB(dateOfBirth) {
  if (!dateOfBirth) return null;
  let yyyyMmDd;
  if (typeof dateOfBirth === 'string') {
    const match = dateOfBirth.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    yyyyMmDd = dateOfBirth.trim().slice(0, 10);
  } else if (dateOfBirth instanceof Date && !Number.isNaN(dateOfBirth.getTime())) {
    const y = dateOfBirth.getFullYear();
    const m = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
    const d = String(dateOfBirth.getDate()).padStart(2, '0');
    yyyyMmDd = `${y}-${m}-${d}`;
  } else {
    return null;
  }
  const [dobY, dobM, dobD] = yyyyMmDd.split('-').map(Number);
  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();
  let age = todayY - dobY;
  if (todayM < dobM || (todayM === dobM && todayD < dobD)) {
    age--;
  }
  return age >= 0 && age <= 120 ? age : null;
}

module.exports = { calculateAgeFromDOB };
