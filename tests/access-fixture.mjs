import {installProjectStorage,storageUrl} from './project-storage-fixture.mjs';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
export const compileSource=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
export const moduleUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
export async function accessFixture(db,emails){
 await installProjectStorage(db);
 const accessModelUrl=moduleUrl(compileSource(readFileSync('lib/access-model.ts','utf8')));
 const {supportActions}=await import(accessModelUrl);
 const policy={version:1,users:emails.map((email,index)=>({email,enabled:true,workspaceAdmin:index===0,areas:['Support','Projects'],products:['*'],supportActions:[...supportActions],createProjects:true,projectRoles:{}})),history:[]};
 await db.prepare('CREATE TABLE IF NOT EXISTS workspace_access(id TEXT PRIMARY KEY,version INTEGER NOT NULL,data TEXT NOT NULL)').run();
 await db.prepare('INSERT OR REPLACE INTO workspace_access VALUES(?,?,?)').bind('workspace',1,JSON.stringify(policy)).run();
 const key='__accessTest'+Math.random().toString(36).slice(2);globalThis[key]={DB:db};
 let src=readFileSync('lib/access.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis['+JSON.stringify(key)+'];').replace("import {getCatalog} from './catalog';","const getCatalog=async()=>({products:['Clinic App','Lab App','CRM App'],modulesByProduct:{'Clinic App':['Other'],'Lab App':['Other'],'CRM App':['Other']}});").replace("'./access-model'",JSON.stringify(accessModelUrl)).replace("'./project-storage'",JSON.stringify(storageUrl));
 const accessUrl=moduleUrl(compileSource(src));
 return {accessModelUrl,accessUrl,policy,storageUrl,cleanup:()=>delete globalThis[key]};
}
