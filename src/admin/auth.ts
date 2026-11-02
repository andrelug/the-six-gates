import { createHash, timingSafeEqual } from 'node:crypto';

const hash = (s: string) => createHash('sha256').update(s).digest();

/** True when the Authorization header is Basic auth whose password is ADMIN_PASSWORD (the user name is ignored). */
export function autorizado(authorization: string | null): boolean {
  const senha = process.env.ADMIN_PASSWORD;
  if (!senha || !authorization?.startsWith('Basic ')) return false;
  const credencial = Buffer.from(authorization.slice(6), 'base64').toString();
  const i = credencial.indexOf(':');
  // hashing first makes both sides the same length, so the compare leaks nothing about the password
  return i >= 0 && timingSafeEqual(hash(credencial.slice(i + 1)), hash(senha));
}
