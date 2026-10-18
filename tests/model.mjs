import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const moduleSource=ts.transpileModule(readFileSync('lib/modules.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const moduleUrl='data:text/javascript;base64,'+Buffer.from(moduleSource).toString('base64');
const source=ts.transpileModule(readFileSync('lib/model.ts','utf8').replaceAll("'./modules'",JSON.stringify(moduleUrl)),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {blank,stages,validateTicket}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const valid={...blank,title:'Grouped teeth mapping is lost',description:'Progress one of three quantities to Opted.'};
assert.equal(validateTicket(valid).status,'New');
for(const status of stages)assert.equal(validateTicket({...valid,status}).status,status);
for(const patch of [{title:'bad'},{description:''},{status:'Invented'},{type:'Unknown'},{priority:'Urgent'},{module:'Unknown'},{due:'tomorrow'}])assert.throws(()=>validateTicket({...valid,...patch}));
assert.equal(validateTicket({...valid,assignee:'  Rahul  '}).assignee,'Rahul');
assert.throws(()=>validateTicket({...valid,actual:'x'.repeat(12001)}));
console.log('Ticket validation passed: valid stages, invalid inputs, trimming, length bounds.');

const {reviewedModules,normalizeModule,modules}=await import(moduleUrl);
assert.equal(Object.keys(reviewedModules).length,30);
for(const [id,module] of Object.entries(reviewedModules)){assert.ok(modules.includes(module));assert.equal(normalizeModule(id,'User experience'),module);}
assert.equal(normalizeModule('QA-03','Prescription'),'Prescription');
assert.equal(normalizeModule(null,'Billing'),'Invoice');
console.log('All30 reviewed module mappings, legacy compatibility and manual override preservation passed.');

const ageSource=ts.transpileModule(readFileSync('lib/ticket-age.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {ticketAge}=await import('data:text/javascript;base64,'+Buffer.from(ageSource).toString('base64'));
const start=Date.parse('2026-10-17T04:18:00Z');
for(const [minutes,expected] of [[0,'<1m'],[59,'59m'],[60,'1h 0m'],[1439,'23h 59m'],[1440,'1d 0h'],[2940,'2d 1h'],[-5,'<1m']])assert.equal(ticketAge(new Date(start).toISOString(),start+minutes*60000),expected);
assert.equal(ticketAge('unknown',start),'Not recorded');
console.log('Ticket age boundaries, future-clock handling and missing dates passed.');
