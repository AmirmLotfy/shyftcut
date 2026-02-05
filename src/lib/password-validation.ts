/**
 * Password validation aligned with Supabase "strong password" settings.
 * Use this for signup, set-password, and change-password flows.
 * Rules: min 8 chars, at least one digit, one uppercase, one lowercase, one symbol.
 * Allowed symbols: !@#$%^&*()_+-=[]{};':"|<>?,./~
 */

export const PASSWORD_MIN_LENGTH = 8;

const HAS_DIGIT = /\d/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_SYMBOL = /[!@#$%^&*()_+\-=[\]{};':"|<>?,./~\\]/;

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: 'auth.passwordMinLength' };
  }
  if (!HAS_DIGIT.test(password)) {
    return { valid: false, message: 'auth.passwordNeedsDigit' };
  }
  if (!HAS_LOWERCASE.test(password)) {
    return { valid: false, message: 'auth.passwordNeedsLowercase' };
  }
  if (!HAS_UPPERCASE.test(password)) {
    return { valid: false, message: 'auth.passwordNeedsUppercase' };
  }
  if (!HAS_SYMBOL.test(password)) {
    return { valid: false, message: 'auth.passwordNeedsSymbol' };
  }
  return { valid: true };
}
