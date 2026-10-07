import 'reflect-metadata';
import { Controller, Get, Post, Module, Body, Req, Res, Param, Query, HttpException, type ExceptionFilter, Catch, type ArgumentsHost } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { catalog } from '@new-game/contracts';
import { mathStatus } from '@new-game/game-math';
import { type Request, type Response, actorFor, login, verify, sessionCookie } from './auth.js';
import { transaction, fail } from './store.js';
import { accounts, createAccount, history, me, report, auditHistory, manageAccount } from './accounts.js';
import { adjust, transfer, reverse, redeem } from './ledger.js';
import { practiceHistory, practiceRound, reefRoom, reefShot, reefTables, reefLeave } from './practice.js';
import { environment, stagingRound, stagingHistory, stagingStats, stagingWins, recoverStagingRound } from './staging.js';
import {dailyWheelStatus,spinDailyWheel} from './daily-wheel.js';
import {operatorDashboard,operatorAccounts,operatorRecords,operatorReceipt,operatorSettings} from './operator.js';
import {operatorRounds,operatorTotals} from './operator-reports.js';
import {operatorDevices,manageDevice} from './device.js';
import {operatorApiSettings,updateOperatorApi,operatorApiDocumentation,operatorIntegration} from './operator-api.js';
import {blackjackCurrent,blackjackAction,settleExpiredBlackjack} from './blackjack.js';
import {changePassword} from './password.js';
@Catch()
class Errors implements ExceptionFilter { catch(error:unknown,host:ArgumentsHost){
 const res=host.switchToHttp().getResponse();
 if(error instanceof HttpException)res.status(error.getStatus()).json(error.getResponse());
 else {console.error('Request failed:', error instanceof Error ? error.message : 'unknown error');res.status(503).json({code:'SERVICE_UNAVAILABLE',message:'The service could not finish. Retry using the same request ID.'});}
} }
@Controller('v1')
class ArcadeController {
 @Get('blackjack') blackjack(@Req() req:Request){return blackjackCurrent(req);}
 @Post('blackjack') blackjackPlay(@Req() req:Request,@Body() body:unknown){return blackjackAction(req,body);}
 @Get('daily-wheel') wheel(@Req() req:Request){return dailyWheelStatus(req);}
 @Post('daily-wheel/spin') wheelSpin(@Req() req:Request,@Body() body:unknown){return spinDailyWheel(req,body);}
 @Post('auth/password') password(@Req() req:Request,@Res({passthrough:true}) res:Response,@Body() body:unknown){return changePassword(req,res,body);}
 @Get('environment') environment(){return environment();}
 @Post('staging/:id/rounds') staging(@Req() req:Request,@Param('id') id:string,@Body() body:unknown){return stagingRound(req,id,body);}
 @Get('staging/history') stagingHistory(@Req() req:Request){return stagingHistory(req);}
 @Get('staging/stats') stagingStats(@Req() req:Request){return stagingStats(req);}
 @Get('staging/wins') stagingWins(@Req() req:Request){return stagingWins(req);}
 @Post('staging/recover') recover(@Req() req:Request,@Body() body:unknown){return recoverStagingRound(req,body);}
 @Get('health') health(){return {status:'ok',stage:'accounts-ledger-practice',creditStakedPlayEnabled:false};}
 @Get('games') games(){return catalog.map(game=>({...game,...mathStatus[game.id],creditStakedPlayEnabled:false}));}
 @Post('auth/login') login(@Req() req:Request,@Res({passthrough:true}) res:Response,@Body() body:unknown){return login(req,res,body);}
 @Post('auth/verify') verify(@Req() req:Request,@Body() body:unknown){return verify(req,body);}
 @Post('auth/logout') async logout(@Req() req:Request,@Res({passthrough:true}) res:Response){await transaction(async db=>{const actor=await actorFor(db,req,true);await db.query('UPDATE sessions SET revoked_at=now() WHERE token_hash=$1',[actor.token_hash]);});res.setHeader('Set-Cookie',sessionCookie('',0));return {loggedOut:true};}
 @Get('me') me(@Req() req:Request){return me(req);}
 @Get('history') history(@Req() req:Request,@Query('accountId') id?:string){return history(req,id);}
 @Get('operator/dashboard') dashboard(@Req() req:Request){return operatorDashboard(req);}
 @Get('operator/accounts') operatorAccounts(@Req() req:Request,@Query() query:unknown){return operatorAccounts(req,query);}
 @Get('operator/records') records(@Req() req:Request,@Query() query:unknown){return operatorRecords(req,query);}
 @Get('operator/receipts/:id') receipt(@Req() req:Request,@Param('id') id:string){return operatorReceipt(req,id);}
 @Get('integration/:endpoint') integration(@Req() req:Request,@Param('endpoint') endpoint:string,@Query() query:unknown){return operatorIntegration(req,endpoint,query);}
 @Get('operator/rounds') gameRecords(@Req() req:Request,@Query() query:unknown){return operatorRounds(req,query);}
 @Get('operator/totals') totals(@Req() req:Request,@Query() query:unknown){return operatorTotals(req,query);}
 @Get('operator/devices') devices(@Req() req:Request,@Query() query:unknown){return operatorDevices(req,query);}
 @Post('operator/devices') device(@Req() req:Request,@Body() body:unknown){return manageDevice(req,body);}
 @Get('operator/api') apiSettings(@Req() req:Request){return operatorApiSettings(req);}
 @Post('operator/api') apiConfigure(@Req() req:Request,@Body() body:unknown){return updateOperatorApi(req,body);}
 @Get('operator/api/documentation') async apiDocumentation(@Req() req:Request){await operatorApiSettings(req);return {text:operatorApiDocumentation,operatorIntegration};}
 @Get('operator/settings') settings(@Req() req:Request){return operatorSettings(req);}
 @Post('operator/redeems') redeem(@Req() req:Request,@Body() body:unknown){return redeem(req,body);}
 @Get('admin/accounts') accounts(@Req() req:Request){return accounts(req);}
 @Post('admin/accounts') create(@Req() req:Request,@Body() body:unknown){return createAccount(req,body);}
 @Get('admin/report') report(@Req() req:Request){return report(req);}
 @Get('admin/audit') audit(@Req() req:Request){return auditHistory(req);}
 @Post('admin/accounts/:id/manage') manage(@Req() req:Request,@Param('id') id:string,@Body() body:unknown){return manageAccount(req,id,body);}
 @Post('admin/credit-adjustments') adjustments(@Req() req:Request,@Body() body:unknown){return adjust(req,body);}
 @Post('admin/reversals') reversal(@Req() req:Request,@Body() body:unknown){return reverse(req,body);}
 @Post('credit-transfers') transfers(@Req() req:Request,@Body() body:unknown){return transfer(req,body);}
 @Post('games/:id/rounds') rounds(){return fail(409,'GAME_MATH_NOT_APPROVED','Credit-staked play awaits approved rules. No credits were charged.');}
 @Post('practice/:id/rounds') practice(@Req() req:Request,@Param('id') id:string,@Body() body:unknown){return practiceRound(req,id,body);}
 @Get('practice/history') practiceHistory(@Req() req:Request){return practiceHistory(req);}
 @Post('practice/reef/join') join(@Req() req:Request,@Body() body:unknown){return reefRoom(req,true,body??{});}
 @Get('practice/reef/tables') tables(@Req() req:Request){return reefTables(req);}
 @Post('practice/reef/leave') leave(@Req() req:Request,@Body() body:unknown){return reefLeave(req,body);}
 @Get('practice/reef/room') room(@Req() req:Request){return reefRoom(req);}
 @Post('practice/reef/shots') shot(@Req() req:Request,@Body() body:unknown){return reefShot(req,body);}
}
@Module({controllers:[ArcadeController]}) class ArcadeModule {}
export async function createApi(){const app=await NestFactory.create(ArcadeModule,{logger:false});app.useGlobalFilters(new Errors());app.use(async (req:{path?:string},_res:unknown,next:()=>void)=>{try{if(['/v1/me','/v1/blackjack','/v1/health'].includes(req.path||''))await settleExpiredBlackjack();}catch{/* The authenticated action still reports database failures. */}next();});app.use((_req:unknown,res:Response,next:()=>void)=>{res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');next();});return app;}
