import { createHash } from 'node:crypto';

/** Deterministic hash used to store refresh tokens so they can be looked up without exposing the raw value. */
export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
