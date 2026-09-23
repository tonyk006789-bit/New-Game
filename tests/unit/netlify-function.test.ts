import {afterEach,expect,test,vi} from 'vitest';
import handler from '../../netlify/functions/game-api';

afterEach(()=>vi.unstubAllEnvs());
test('an unconfigured function returns uncached JSON instead of connecting or serving the app shell',async()=>{
 vi.stubEnv('GAME_ENV','production');
 const response=await handler(new Request('https://test.example/v1/me'),{});
 expect(response.status).toBe(503);
 expect(response.headers.get('cache-control')).toBe('no-store');
 expect(await response.json()).toMatchObject({code:'API_NOT_CONFIGURED'});
});
test('missing managed database configuration fails closed without exposing connection details',async()=>{
 vi.stubEnv('GAME_ENV','hosted-test');vi.stubEnv('NETLIFY_DB_URL','');
 const response=await handler(new Request('https://test.example/v1/me'),{});
 expect(response.status).toBe(503);
 expect(await response.json()).toEqual({code:'SERVICE_UNAVAILABLE',message:'The account service is starting. Please retry shortly.'});
});
