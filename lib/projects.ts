import {getAccessPolicy} from './access';
import {userAccess,projectRole,hasArea,hasProduct} from './access-model';
import {env} from 'cloudflare:workers';
import {applyProjectAction,member,textField,type Project} from './project-model';

export class ProjectError extends Error {
 constructor(message:string,public status=400){super(message);}
}
export function projectDatabase(){return (env as any).DB as D1Database;}
function refreshProposals(p:Project,policy:Awaited<ReturnType<typeof getAccessPolicy>>){p.proposals=p.proposals.map(q=>q.state==='Pending'&&q.decisions.some(d=>projectRole(userAccess(policy,d.author),p)!==d.role)?{...q,state:'Superseded'}:q);return p;}
function projectView(p:Project,policy:Awaited<ReturnType<typeof getAccessPolicy>>){return {...refreshProposals(structuredClone(p),policy),members:policy.users.flatMap(a=>{const role=projectRole(a,p);return role?[{email:a.email,role:role as Project['members'][number]['role']}]:[]})};}
export async function listProjects(email:string,d=projectDatabase()){
 const policy=await getAccessPolicy(d),a=userAccess(policy,email);
 const rows=await d.prepare('SELECT data FROM planning_projects').all<{data:string}>();
 return rows.results.map(r=>JSON.parse(r.data) as Project).filter(p=>!!projectRole(a,p)).map(p=>projectView(p,policy));
}
export async function getRawProject(id:string,d=projectDatabase()){
 const row=await d.prepare('SELECT data,version FROM planning_projects WHERE id=?').bind(textField(id,100)).first<{data:string;version:number}>();
 if(!row)throw new ProjectError('Project not found or unavailable.',404);return JSON.parse(row.data) as Project;
}
export async function getProject(id:string,email:string,d=projectDatabase()){
 const p=await getRawProject(id,d),policy=await getAccessPolicy(d);
 if(!projectRole(userAccess(policy,email),p))throw new ProjectError('Project not found or unavailable.',404);
 return projectView(p,policy);
}
export async function saveProjectAction(b:any,email:string,d=projectDatabase()){
 email=email.toLowerCase();const policy=await getAccessPolicy(d),access=userAccess(policy,email);
 if(b.action==='create'){
  if(!hasArea(access,'Projects')||!access.createProjects)throw new ProjectError('You do not have permission to create projects.',403);
  const name=textField(b.name,180);if(name.length<3)throw new ProjectError('Enter a project name with at least 3 characters.');
  const now=new Date().toISOString();
  const p:Project={id:crypto.randomUUID(),name,description:textField(b.description||''),created:now,createdBy:email,updated:now,updatedBy:email,version:1,members:[{email,role:'Admin'}],items:[],proposals:[],history:[{id:crypto.randomUUID(),itemId:'',author:email,text:'Project created.',created:now}]};
  await d.prepare('INSERT INTO planning_projects(id,version,data) VALUES(?,?,?)').bind(p.id,1,JSON.stringify(p)).run();return p;
 }
 const p=await getRawProject(b.id,d);const role=projectRole(access,p);if(!role)throw new ProjectError('Project not found or unavailable.',404);
 if(b.action==='members')throw new ProjectError('Manage project roles in Users & Access.',403);
 if(b.action==='item'||b.action==='import'){for(const i of (b.action==='import'?b.items:[b.item])||[])if(!hasProduct(access,i.product))throw new ProjectError('Access to the scope product is required.',403);}
 if(!Number.isInteger(b.version)||b.version!==p.version)throw new ProjectError('This project changed. Read it again before saving.',409);
 const oldVersion=p.version;
 refreshProposals(p,policy);applyProjectAction(p,b,email,undefined,role);p.version++;
 const result=await d.prepare('UPDATE planning_projects SET data=?,version=? WHERE id=? AND version=?').bind(JSON.stringify(p),p.version,p.id,oldVersion).run();
 if(!result.meta.changes)throw new ProjectError('Another update was saved first. Read the project and retry.',409);
 return projectView(p,policy);
}
