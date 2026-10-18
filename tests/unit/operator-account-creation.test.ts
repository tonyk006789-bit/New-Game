import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {effectScope,nextTick,type Ref} from 'vue';
import App from '../../apps/admin/src/App.vue';
import type {Account,Member,Page} from '../../apps/admin/src/api';

const service=vi.hoisted(()=>({api:vi.fn(),refreshAccount:vi.fn()}));
vi.mock('../../apps/admin/src/api',async original=>({...await original<typeof import('../../apps/admin/src/api')>(),...service}));
// Exercise the real component's submit handlers, without mounting browser DOM.
// Initial session loading is separate from the create -> list-refresh regression.
vi.mock('vue',async original=>({...await original<typeof import('vue')>(),onMounted:vi.fn(),useSSRContext:()=>({})}));
type State={
 current:Ref<Account|null>;view:Ref<string>;query:Ref<string>;status:Ref<string>;sort:Ref<string>;order:Ref<string>;page:Ref<number>;gotoPage:Ref<number>;
 members:Ref<Page<Member>>;newUsername:Ref<string>;newPassword:Ref<string>;confirmPassword:Ref<string>;createOpen:Ref<boolean>;createKey:Ref<string>;notice:Ref<string>;error:Ref<string>;
 openCreate:()=>void;create:()=>Promise<void>;search:()=>void;
};
const wallet={settled:'0',available:'0',reserved:'0',version:'0'};
const roles=[['MAIN_ADMIN','SUB_DISTRIBUTOR','Sub-contractors'],['SUB_DISTRIBUTOR','AGENT','Agents'],['AGENT','PLAYER','User Management']] as const;
let scope:ReturnType<typeof effectScope>;
let state:State;
let listed:Member;
async function prepare([parentRole,childRole,view]:typeof roles[number]){
 scope=effectScope();
 state=scope.run(()=>(App as unknown as {setup:(props:object,context:{expose:()=>void})=>State}).setup({},{expose(){}}))!;
 state.current.value={id:'parent-account',username:'parent1',displayName:'Parent',role:parentRole,csrf:'test',wallet};state.view.value=view;
 listed={id:'new-account',username:'child123',displayName:'child123',role:childRole,wallet,active:true,archived:false,branchEnabled:true,branch:'test',createdAt:'2026-10-18T12:00:00Z',canManage:true,canRedeem:true,canTransfer:true,canAdjust:parentRole==='MAIN_ADMIN',publicId:'123456',registeredIp:null,loginCount:'0',lastLogin:null,lastIp:null,manager:'parent1'};
 service.refreshAccount.mockResolvedValue(state.current.value);
 service.api.mockImplementation(async(path:string)=>{
  if(path==='admin/accounts')return {id:listed.id,username:listed.username};
  const query=new URL(path,'http://test/').searchParams;
  const visible=(!query.get('search')||query.get('search')===listed.username)&&query.get('page')==='1'&&query.get('status')==='ALL'&&query.get('role')===childRole&&query.get('sort')==='created'&&query.get('order')==='desc';
  return {items:visible?[listed]:[],total:visible?'1':'0',page:Number(query.get('page')),pageSize:20};
 });
 state.openCreate();state.newUsername.value='child123';state.newPassword.value='123456';state.confirmPassword.value='123456';await nextTick();
}
beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('window',{innerWidth:1280});});
afterEach(()=>{scope?.stop();vi.unstubAllGlobals();});

describe('created account appears in its creator’s list',()=>{
 for(const role of roles)it(`${role[0]} clears stale filters and pagination after a committed create`,async()=>{
  await prepare(role);state.query.value='someone-else';state.status.value='SUSPENDED';state.page.value=3;state.gotoPage.value=3;state.sort.value='username';state.order.value='asc';
  await state.create();
  expect(state.members.value.items.map(row=>row.id)).toEqual([listed.id]);
  expect(state.page.value).toBe(1);expect(state.gotoPage.value).toBe(1);expect(state.query.value).toBe('');expect(state.status.value).toBe('ALL');
  expect(state.createOpen.value).toBe(false);expect(state.newPassword.value).toBe('');expect(state.confirmPassword.value).toBe('');
  expect(service.api.mock.calls[0][1]).toMatchObject({parentId:'parent-account',username:'child123'});
  expect(service.api.mock.calls.filter(([path])=>path==='admin/accounts')).toHaveLength(1);
 });
 it('refreshes the new row without a separate wallet/session request',async()=>{
  await prepare(roles[0]);service.refreshAccount.mockRejectedValue(new Error('Unrelated wallet refresh failed'));
  await state.create();expect(state.members.value.items[0]?.id).toBe(listed.id);expect(service.refreshAccount).not.toHaveBeenCalled();
 });
 it('retains the committed success when listing fails and retries only the list',async()=>{
  await prepare(roles[1]);service.api.mockResolvedValueOnce({id:listed.id,username:listed.username}).mockRejectedValueOnce(new Error('Connection interrupted'));
  await state.create();expect(state.notice.value).toContain('Created child123');expect(state.createOpen.value).toBe(false);expect(state.error.value).toContain('Connection interrupted');
  state.search();await vi.waitFor(()=>expect(state.members.value.items[0]?.id).toBe(listed.id));
  expect(service.api.mock.calls.filter(([path])=>path==='admin/accounts')).toHaveLength(1);
 });
 it('keeps the form and retry key when creation itself fails',async()=>{
  await prepare(roles[2]);state.query.value='previous';state.page.value=2;const key=state.createKey.value;
  service.api.mockRejectedValueOnce(new Error('Save interrupted'));
  await state.create();expect(state.createOpen.value).toBe(true);expect(state.query.value).toBe('previous');expect(state.page.value).toBe(2);expect(state.createKey.value).toBe(key);expect(state.notice.value).not.toContain('Created');
  await state.create();expect(service.api.mock.calls[1][1].requestKey).toBe(key);expect(state.members.value.items[0]?.id).toBe(listed.id);
 });
 it('keeps pagination controls in sync when a search returns to page one',async()=>{
  await prepare(roles[2]);state.page.value=4;state.gotoPage.value=4;state.search();await vi.waitFor(()=>expect(state.members.value.items).toHaveLength(1));expect(state.gotoPage.value).toBe(1);
 });
});
