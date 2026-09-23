// Dedicated ignored key for the disposable test tunnel; never read user SSH keys.
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
mkdirSync('.local/staging',{recursive:true});
if(!existsSync('.local/staging/pinggy-key')){
 const result=spawnSync('C:/Windows/System32/OpenSSH/ssh-keygen.exe',['-t','ed25519','-f','.local/staging/pinggy-key','-N','','-C','new-game-test-tunnel'],{stdio:'ignore'});
 if(result.status!==0)throw new Error('Dedicated test tunnel key generation failed.');
}
