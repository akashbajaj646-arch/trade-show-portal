// lib/auth.ts
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'tradeshow2026';

export function checkAdminAuth(password: string): boolean {
  return password === ADMIN_PASSWORD;
}