import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('hex');
export async function passwordHash(password: string) {
 const salt = randomBytes(16).toString('hex');
 const key = await derive(password, salt, 64) as Buffer;
 return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function passwordMatches(password: string, stored: string | null) {
 const parts = (stored || '').split(':');
 const salt = parts[1] || 'invalid-account-fixed-timing-salt';
 const expected = Buffer.from(parts[2] || '0'.repeat(128), 'hex');
 const actual = await derive(password, salt, 64) as Buffer;
 return parts[0] === 'scrypt' && expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function totp(secret: string, time = Date.now()) {
 const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
 let bits = ''; for (const letter of secret) bits += alphabet.indexOf(letter).toString(2).padStart(5, '0');
 const key = Buffer.from(bits.match(/.{8}/g)!.map(byte => parseInt(byte, 2)));
 const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
 const hash = createHmac('sha1', key).update(counter).digest(); const offset = hash[19] & 15;
 return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
}
export function validTotp(secret: string | null, code: string) {
 return !!secret && /^\d{6}$/.test(code) && [-30000, 0, 30000].some(delta => timingSafeEqual(Buffer.from(totp(secret, Date.now() + delta)), Buffer.from(code)));
}
export function newTotpSecret() {
 const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
 return Array.from(randomBytes(32), byte => alphabet[byte % 32]).join('');
}
export function canonical(value: unknown): string {
 if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
 if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([key,item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
 return JSON.stringify(value);
}
