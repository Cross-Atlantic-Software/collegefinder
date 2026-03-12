/**
 * Password strength validation and recommendations for admin users
 * Requirements: min 8 chars, uppercase, lowercase, number, special character
 */

export interface PasswordCheck {
  met: boolean;
  label: string;
}

export function checkPasswordStrength(password: string): PasswordCheck[] {
  return [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /\d/.test(password), label: 'One number' },
    { met: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password), label: 'One special character (!@#$%^&* etc.)' },
  ];
}

export function isPasswordStrong(password: string): boolean {
  return checkPasswordStrength(password).every((c) => c.met);
}

export const PASSWORD_REQUIREMENTS = [
  'At least 8 characters',
  'One uppercase letter',
  'One lowercase letter',
  'One number',
  'One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)',
];

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz';
const NUMBERS = '23456789';
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generate a random strong password (12 chars) meeting all requirements
 */
export function generateStrongPassword(length = 12): string {
  const chars = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL;
  const getRandom = (str: string) => str[Math.floor(Math.random() * str.length)];

  // Ensure at least one of each required type
  let password = [
    getRandom(UPPERCASE),
    getRandom(LOWERCASE),
    getRandom(NUMBERS),
    getRandom(SPECIAL),
  ];

  // Fill remaining with random chars
  for (let i = password.length; i < length; i++) {
    password.push(getRandom(chars));
  }

  // Shuffle
  return password.join('').split('').sort(() => Math.random() - 0.5).join('');
}
