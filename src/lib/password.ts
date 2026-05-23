export type PasswordRequirements = {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  return Object.values(getPasswordRequirements(password)).every(Boolean);
}

export function validatePasswordMatch(
  password: string,
  confirm: string,
): { valid: true } | { valid: false; message: string } {
  if (password !== confirm) {
    return { valid: false, message: "Passwords do not match. Enter the same password in both fields." };
  }
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long." };
  }
  return { valid: true };
}
