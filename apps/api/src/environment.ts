export const hostedTest = () => process.env.GAME_ENV === 'hosted-test';

export function validateHostedTest(env: NodeJS.ProcessEnv = process.env) {
 if(env.GAME_ENV !== 'hosted-test')throw new Error('Hosted test mode must be explicitly enabled.');
 if(!/^[a-f0-9-]{36}$/i.test(env.HOSTED_TEST_SITE_ID || ''))throw new Error('A dedicated test database identity is required.');
 if(env.HOSTED_TEST_PLATFORM==='vercel'){
  if(env.VERCEL!=='1'||!/^prj_[a-zA-Z0-9]+$/.test(env.HOSTED_TEST_PROJECT_ID||'')||env.VERCEL_PROJECT_ID!==env.HOSTED_TEST_PROJECT_ID)throw new Error('Hosted test must be bound to its dedicated Vercel project.');
 }else if(env.HOSTED_TEST_PLATFORM&&env.HOSTED_TEST_PLATFORM!=='netlify'||env.SITE_ID!==env.HOSTED_TEST_SITE_ID)throw new Error('Hosted test must be bound to its dedicated Netlify project.');
 if(env.HOSTED_TEST_PROFILE !== 'stage-paying30-v2')throw new Error('The hosted test profile must be explicitly selected.');
 const url = new URL(env.DATABASE_URL || 'postgres://invalid/');
 if(!['postgres:','postgresql:'].includes(url.protocol) || ['localhost','127.0.0.1','invalid'].includes(url.hostname) || !['require','verify-full','verify-ca'].includes(url.searchParams.get('sslmode') || ''))throw new Error('Hosted testing requires its dedicated TLS PostgreSQL database.');
}

export function stagingEnabled() {
 if(hostedTest()){validateHostedTest();return true;}
 if(process.env.GAME_ENV!=='staging')return false;
 const url=new URL(process.env.DATABASE_URL||'postgres://invalid/');
 if(!['127.0.0.1','localhost'].includes(url.hostname)||url.pathname!=='/new_game_staging'||url.username!=='new_game_stage')throw new Error('Staging requires its dedicated local database and role.');
 if(process.env.NODE_ENV==='production')throw new Error('Experimental staging cannot run in production mode.');
 return true;
}
