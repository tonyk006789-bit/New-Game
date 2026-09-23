import {getConnectionString} from '@netlify/database';

let handler:Promise<typeof import('../../apps/api/src/hosted-handler').hostedHandler> | undefined;
export default async (request:Request,context:{ip?:string})=>{
 if(process.env.GAME_ENV!=='hosted-test')return Response.json({code:'API_NOT_CONFIGURED',message:'Online sign-in is not connected yet.'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  if(!handler){
   process.env.DATABASE_URL=getConnectionString();
   handler=import('../../apps/api/src/hosted-handler').then(module=>module.hostedHandler).catch(error=>{handler=undefined;throw error;});
  }
  return await (await handler)(request,context);
 }catch{
  return Response.json({code:'SERVICE_UNAVAILABLE',message:'The account service is starting. Please retry shortly.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
};
