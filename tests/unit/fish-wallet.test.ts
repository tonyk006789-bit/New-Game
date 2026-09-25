import {describe,it,expect} from 'vitest';
import {FishWalletPresentation} from '../../apps/player/src/fish-wallet';
const wallet=(available:string,version:string)=>({available,version});
describe('overlapping catch presentation',()=>{
 it('reveals each win before the balance, despite responses arriving out of order',()=>{
  const view=new FishWalletPresentation(wallet('1000','1'));
  view.accept(wallet('1050','3'),wallet('1025','4'),'0',0);
  expect(view.advance(1000).available).toBe('1000');
  view.accept(wallet('1000','1'),wallet('1050','3'),'75',1000);
  expect(view.advance(1899).available).toBe('1000');
  expect(view.advance(1900)).toEqual(wallet('1025','4'));
 });
 it('advances consecutive receipts while later shots remain in flight',()=>{
  const view=new FishWalletPresentation(wallet('1000','1'));
  view.accept(wallet('1000','1'),wallet('975','2'),'0',100);
  view.accept(wallet('975','2'),wallet('1025','4'),'75',200);
  expect(view.advance(300).available).toBe('975');
  expect(view.advance(1100).available).toBe('1025');
  view.accept(wallet('1000','1'),wallet('975','2'),'0',1200);
  expect(view.advance(2000).available).toBe('1025');
 });
 it('does not leak polled balances, and bridges external adjustments only after all shots and wins finish',()=>{
  const view=new FishWalletPresentation(wallet('1000','1'));
  view.accept(wallet('1100','2'),wallet('1150','4'),'75',100);
  expect(view.reconcile(wallet('1150','4'),500,true).available).toBe('1000');
  expect(view.reconcile(wallet('1150','4'),1000,false).available).toBe('1000');
  expect(view.reconcile(wallet('1150','4'),1000,true).available).toBe('1150');
 });
});
