import { createHash } from 'crypto';

// In a production environment, you should use a proper password hashing library like bcrypt or Argon2
// This is a simplified version for demonstration purposes

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}
