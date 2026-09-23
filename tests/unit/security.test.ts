import { describe,it,expect } from 'vitest';
import { passwordHash,passwordMatches,totp,canonical } from '../../apps/api/src/security';
describe('credential handling',()=>{
 it('uses the RFC 6238 SHA-1 vector with six displayed digits',()=>{expect(totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',59000)).toBe('287082');});
 it('salts passwords independently and rejects altered or missing credentials',async()=>{const first=await passwordHash('A long sample password'),second=await passwordHash('A long sample password');expect(first).not.toBe(second);expect(await passwordMatches('A long sample password',first)).toBe(true);expect(await passwordMatches('Altered sample password',first)).toBe(false);expect(await passwordMatches('A long sample password',null)).toBe(false);});
 it('normalizes property order for durable request fingerprints',()=>{expect(canonical({b:2,a:{y:4,x:3}})).toBe(canonical({a:{x:3,y:4},b:2}));expect(canonical({picks:[1,2]})).not.toBe(canonical({picks:[2,1]}));});
});
