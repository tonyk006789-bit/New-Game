import {afterEach,describe,it,expect,vi} from 'vitest';
import {stagingEnabled,validateHostedTest} from '../../apps/api/src/environment';

const site='11111111-1111-4111-8111-111111111111';
const configured={GAME_ENV:'hosted-test',SITE_ID:site,HOSTED_TEST_SITE_ID:site,HOSTED_TEST_PROFILE:'stage-paying30-v2',DATABASE_URL:'postgresql://test:fixture@database.example/game?sslmode=require',NODE_ENV:'production'};
afterEach(()=>vi.unstubAllEnvs());
describe('hosted test isolation',()=>{
 it('requires explicit project, experiment and TLS configuration',()=>{
  expect(()=>validateHostedTest(configured)).not.toThrow();
  for(const change of [{GAME_ENV:'production'},{SITE_ID:'other'},{HOSTED_TEST_SITE_ID:''},{HOSTED_TEST_PROFILE:'production'},{DATABASE_URL:'postgresql://localhost/game?sslmode=require'},{DATABASE_URL:'postgresql://database.example/game'}])expect(()=>validateHostedTest({...configured,...change})).toThrow();
 });
 it('leaves the original local-only staging gate closed remotely',()=>{
  for(const [key,value]of Object.entries({...configured,GAME_ENV:'staging'}))vi.stubEnv(key,value);
  expect(()=>stagingEnabled()).toThrow(/dedicated local/);
 });
 it('does not enable production credit play',()=>{
  vi.stubEnv('GAME_ENV','production');expect(stagingEnabled()).toBe(false);
 });
});
