import assert from 'node:assert/strict';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
import {drizzle} from 'drizzle-orm/sqlite-proxy';
import {readFileSync,readdirSync} from 'node:fs';
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const {localDay,deadline,matchesDeadline}=await import(compile(readFileSync('lib/deadlines.ts','utf8')));
const originalTZ=process.env.TZ;
for(const tz of ['UTC','Asia/Kolkata','America/New_York','Australia/Sydney']){
 process.env.TZ=tz;
 for(const now of [new Date(2026,9,18,0,0).getTime(),new Date(2026,9,18,23,59).getTime()]){
  assert.equal(localDay(now),'2026-10-18');
  assert.equal(deadline('2026-10-18','New',now).kind,'today');
  assert.deepEqual(deadline('2026-10-17','In progress',now),{kind:'overdue',label:'Overdue · 1d',daysLate:1});
  assert.equal(deadline('2026-10-19','Planned',now).kind,'upcoming');
  assert.equal(deadline('','Draft',now).kind,'missing');
  for(const s of ['Resolved','Closed','Completed','Cancelled'])assert.equal(matchesDeadline('2026-10-17',s,'Overdue',now),false);
  for(const s of ['New','Triage','Backlog','Planned','In progress','Ready for QA','Blocked','Draft','Review','Approved','QA','On hold'])assert.equal(matchesDeadline('2026-10-17',s,'Overdue',now),true);
  assert.equal(matchesDeadline('','New','Date not set',now),true);
  assert.equal(matchesDeadline('2026-10-18','New','Due today',now),true);
  assert.equal(matchesDeadline('2026-10-19','New','Upcoming',now),true);
  assert.equal(matchesDeadline('','New','Overdue',now),false);
 }
}
process.env.TZ='America/New_York';assert.equal(deadline('2026-03-07','New',new Date(2026,2,9).getTime()).daysLate,2); // DST calendar days
if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ;
// Exercise actual persistence, validation, audit events, and optimistic concurrency.
const modulesUrl=compile(readFileSync('lib/modules.ts','utf8'));
const modelUrl=compile(readFileSync('lib/model.ts','utf8').replaceAll("'./modules'",JSON.stringify(modulesUrl)));
const {blank,validateDeliveryDate,validateTicket}=await import(modelUrl);
assert.throws(()=>validateDeliveryDate('',true),/delivery date/);
for(const due of ['2026-02-30','2026-13-01','2026-02-29','2026-1-03','tomorrow'])assert.throws(()=>validateTicket({...blank,title:'Valid title',description:'Long description',due}),/delivery date/);
validateDeliveryDate('2028-02-29',true);
const schemaUrl=compile(readFileSync('db/schema.ts','utf8').replace("'drizzle-orm/sqlite-core'",JSON.stringify(import.meta.resolve('drizzle-orm/sqlite-core'))));
const schema=await import(schemaUrl),sql=new DatabaseSync(':memory:');
for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+f,'utf8'));
globalThis.__deadlineDb=drizzle(async(query,params,method)=>{const stmt=sql.prepare(query);if(method==='run'){stmt.run(...params);return {rows:[]};}stmt.setReturnArrays(true);return {rows:stmt.all(...params)};},{schema});
const insightsUrl=compile(readFileSync('lib/ticket-insights.ts','utf8'));
let source=readFileSync('lib/tickets.ts','utf8').replace("'./ticket-insights'",JSON.stringify(insightsUrl)).replace("import {getCatalog} from './catalog';","const getCatalog=async()=>({products:['Clinic App'],modulesByProduct:{'Clinic App':['Case Sheet']}});").replace("import {listEvidence} from './evidence';","const listEvidence=async()=>[];").replace("'./modules'",JSON.stringify(modulesUrl)).replace("import {getDb} from '@/db';","const getDb=()=>globalThis.__deadlineDb;").replace("'@/db/schema'",JSON.stringify(schemaUrl)).replace("'drizzle-orm'",JSON.stringify(import.meta.resolve('drizzle-orm'))).replace("'./model'",JSON.stringify(modelUrl)).replace("import {qaImport} from './seed';","const qaImport=[];");
const tickets=await import(compile(source));
const input={...blank,title:'Delivery date audit',description:'Verify date changes persist'};
await assert.rejects(()=>tickets.createTicket(input,'Reporter'),/delivery date/);
let saved=await tickets.createTicket({...input,due:'2026-11-01'},'Reporter');
let detail=await tickets.detail(saved.id);assert.equal(detail.ticket.createdBy,'Reporter');assert.match(detail.events[0].action,/Delivery date: 2026-11-01/);
saved=await tickets.updateTicket({id:saved.id,version:saved.version,due:'2026-11-05'},'Planner');
detail=await tickets.detail(saved.id);assert.ok(detail.events.some(e=>e.action==='Delivery date: 2026-11-01 → 2026-11-05'&&e.author==='Planner'));assert.equal(detail.ticket.due,'2026-11-05');
await assert.rejects(()=>tickets.updateTicket({id:saved.id,version:saved.version,due:''},'Planner'),/delivery date/);
await assert.rejects(()=>tickets.updateTicket({id:saved.id,version:1,due:'2026-11-09'},'Planner'),/changed/);
// Legacy records remain undated and editable until a real commitment is assigned.
sql.prepare('UPDATE tickets SET due=? WHERE id=?').run('',saved.id);
saved=await tickets.updateTicket({id:saved.id,version:saved.version,title:'Legacy ticket still editable'},'Planner');assert.equal(saved.due,'');
saved=await tickets.updateTicket({id:saved.id,version:saved.version,due:'2026-11-06'},'Planner');
assert.ok((await tickets.detail(saved.id)).events.some(e=>e.action==='Delivery date: Date not set → 2026-11-06'));
sql.close();delete globalThis.__deadlineDb;
console.log('Deadlines passed: calendar-day boundaries in four timezones, DST, completed exclusions, filters, required/real dates, audited rescheduling, preserved legacy dates and stale-write protection.');

const {applyProjectAction}=await import(compile(readFileSync('lib/project-model.ts','utf8')));
const p={id:'p1',name:'Project dates',description:'',created:'2026-10-01',updated:'2026-10-01',version:1,members:[{email:'planner@example.test',role:'Admin'}],items:[],proposals:[],history:[]};
const scope={title:'Dated deliverable',description:'Description',acceptance:'Accepted',exclusions:'',product:'Clinic App',module:'Appointments',owner:'',start:'2026-11-01',end:'2026-11-05',estimate:'',dependencies:[],tickets:'',source:''};
applyProjectAction(p,{action:'item',item:scope},'planner@example.test');
applyProjectAction(p,{action:'item',item:{...p.items[0],start:'2026-11-02',end:'2026-11-07'}},'planner@example.test');
assert.ok(p.history.some(e=>e.text.includes('Start date: 2026-11-01 → 2026-11-02')&&e.text.includes('Finish date: 2026-11-05 → 2026-11-07')));
assert.ok(p.history.some(e=>e.snapshot?.end==='2026-11-05'));
console.log('Project schedule changes record both old/new dates and preserve revision snapshots.');
