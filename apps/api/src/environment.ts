export function stagingEnabled() {
 if(process.env.GAME_ENV!=='staging')return false;
 const url=new URL(process.env.DATABASE_URL||'postgres://invalid/');
 if(!['127.0.0.1','localhost'].includes(url.hostname)||url.pathname!=='/new_game_staging'||url.username!=='new_game_stage')throw new Error('Staging requires its dedicated local database and role.');
 if(process.env.NODE_ENV==='production')throw new Error('Experimental staging cannot run in production mode.');
 return true;
}
