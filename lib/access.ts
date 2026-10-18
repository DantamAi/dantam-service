import {env} from 'cloudflare:workers';
import {getCatalog} from './catalog';
import {supportActions,projectProducts,requireAdmin,userAccess,changeUser,type AccessPolicy} from './access-model';
const db=()=> (env as any).DB as D1Database;
// These are the two users already granted site access at rollout. This does not invite anyone to the Site.
const initialUsers=[{email:'gorle.sub@gmail.com',workspaceAdmin:true},{email:'agorle.au@gmail.com',workspaceAdmin:false}];
export async function getAccessPolicy(d=db()):Promise<AccessPolicy>{
 let row=await d.prepare('SELECT data FROM workspace_access WHERE id=?').bind('workspace').first<{data:string}>();
 if(!row){const policy:AccessPolicy={version:1,users:initialUsers.map(u=>({...u,enabled:true,areas:['Support','Projects'],products:['*'],supportActions:[...supportActions],createProjects:true,projectRoles:{}})),history:[{id:crypto.randomUUID(),author:'System',created:new Date().toISOString(),text:'Access controls enabled. Existing site users retained their current access; the site owner manages workspace access.'}]};await d.prepare('INSERT OR IGNORE INTO workspace_access(id,version,data) VALUES(?,?,?)').bind('workspace',1,JSON.stringify(policy)).run();row=await d.prepare('SELECT data FROM workspace_access WHERE id=?').bind('workspace').first<{data:string}>();}
 if(!row)throw Error('Access settings unavailable.');return JSON.parse(row.data);
}
export async function getAccess(email:string,d=db()){return userAccess(await getAccessPolicy(d),email);}
export async function accessRoster(email:string,d=db()){
 const policy=await getAccessPolicy(d);requireAdmin(userAccess(policy,email));
 const rows=await d.prepare('SELECT data FROM planning_projects').all<{data:string}>();
 const projects=rows.results.map(r=>JSON.parse(r.data)).map(p=>({id:p.id,name:p.name,products:projectProducts(p),members:p.members}));
 return {policy,projects,catalog:await getCatalog()};
}
export async function setUserAccess(input:any,version:number,email:string,d=db()){
 const policy=await getAccessPolicy(d);requireAdmin(userAccess(policy,email));
 if(!Number.isInteger(version)||version!==policy.version)throw Error('Access settings changed. Refresh before saving.');
 const rows=await d.prepare('SELECT id FROM planning_projects').all<{id:string}>();
 const updated=changeUser(policy,input,email,(await getCatalog()).products,rows.results.map(r=>r.id));
 if(updated===policy)return policy;
 const result=await d.prepare('UPDATE workspace_access SET data=?,version=? WHERE id=? AND version=?').bind(JSON.stringify(updated),updated.version,'workspace',version).run();
 if(!result.meta.changes)throw Error('Another access update was saved first. Refresh and retry.');return updated;
}
