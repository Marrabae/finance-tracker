import { createHash, randomBytes } from 'node:crypto';

export const TOKEN_PREFIX = 'ft_';
/** How much of the token is stored in the clear, purely so Settings can label a row. */
const DISPLAY_PREFIX_LENGTH = 11;

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Mint a new token. The plaintext is returned to the caller once and never persisted —
 * only `hash` (for lookups) and `prefix` (for display) go into the database.
 */
export function generateApiToken(): { token: string; hash: string; prefix: string } {
  const token = TOKEN_PREFIX + randomBytes(32).toString('base64url');
  return { token, hash: hashApiToken(token), prefix: token.slice(0, DISPLAY_PREFIX_LENGTH) };
}
