import type {Project,ScopeItem,Proposal} from './project-model';
import {deadline,localDay} from './deadlines';
import {recordAudit} from './project-audit';
export type ScopeRow={project:Project;item:ScopeItem};
export type ProjectFilters={product:string;projectId:string;module:string;owner:string;status:string;dateField:'start'|'end';from:string;to:string;quick:string;approval:string};
export const emptyProjectFilters:ProjectFilters={product:'',projectId:'',module:'',owner:'',status:'',dateField:'end',from:'',to:'',quick:'All work',approval:'All approvals'};
export const normalizeOwner=(s:string)=>s.trim().toLowerCase();
export const isActive=(i:ScopeItem)=>!['Completed','Cancelled'].includes(i.status);
export const rowKey=(r:ScopeRow)=>JSON.stringify([r.project.id,r.item.id]);
export function flattenScope(projects:Project[]):ScopeRow[]{return projects.flatMap(project=>project.items.map(item=>({project,item})));}
export function weekDates(now:number){const d=new Date(now);d.setDate(d.getDate()-((d.getDay()+6)%7));const start=localDay(d.getTime());d.setDate(d.getDate()+6);return {start,end:localDay(d.getTime())};}
export function dueThisWeek(i:ScopeItem,now:number){const w=weekDates(now);return isActive(i)&&!!i.end&&i.end>=w.start&&i.end<=w.end;}
export function pendingFor({project,item}:ScopeRow){return project.proposals.filter(q=>q.itemId===item.id&&q.state==='Pending'&&q.revision===item.revision&&q.from===item.status);}
export function outstandingRoles(q:Proposal){return q.required.filter(role=>!q.decisions.some(d=>d.role===role&&d.decision==='Approve'));}
export function canReview(project:Project,q:Proposal,user:string){const email=normalizeOwner(user),role=project.members.find(m=>normalizeOwner(m.email)===email)?.role;return !!email&&normalizeOwner(q.author)!==email&&!!role&&outstandingRoles(q).includes(role);}
function matchesApproval(row:ScopeRow,filter:string,user:string){const pending=pendingFor(row);return filter==='All approvals'||pending.some(q=>filter==='Pending approval'||(filter==='Awaiting my approval'?canReview(row.project,q,user):outstandingRoles(q).includes(filter.replace('Awaiting ',''))));}
export function filterScope(rows:ScopeRow[],f:ProjectFilters,user:string,now:number){return rows.filter(r=>{const i=r.item,d=i[f.dateField];return (!f.product||i.product===f.product)&&(!f.projectId||r.project.id===f.projectId)&&(!f.module||i.module===f.module)&&(!f.owner||(f.owner==='__unassigned'?!i.owner.trim():normalizeOwner(i.owner)===normalizeOwner(f.owner)))&&(!f.status||i.status===f.status)&&(!f.from||!!d&&d>=f.from)&&(!f.to||!!d&&d<=f.to)&&matchesApproval(r,f.approval,user)&&(f.quick==='All work'||(f.quick==='Overdue'&&deadline(i.end,i.status,now).kind==='overdue')||(f.quick==='Due this week'&&dueThisWeek(i,now))||(f.quick==='My work'&&!!user&&isActive(i)&&normalizeOwner(i.owner)===normalizeOwner(user))||(f.quick==='Unassigned'&&isActive(i)&&!i.owner.trim())||(f.quick==='Date not set'&&isActive(i)&&(!i.start||!i.end)));});}
export function selectedProjects(projects:Project[],rows:ScopeRow[],f:ProjectFilters){const hasItemFilter=!!(f.product||f.module||f.owner||f.status||f.from||f.to||f.quick!=='All work'||f.approval!=='All approvals');return projects.filter(p=>(!f.projectId||p.id===f.projectId)&&(!hasItemFilter||rows.some(r=>r.project.id===p.id)));}
export function completion(items:ScopeItem[]){const eligible=items.filter(i=>i.status!=='Cancelled'),completed=eligible.filter(i=>i.status==='Completed').length;return {completed,total:eligible.length,percent:eligible.length?Math.round(completed/eligible.length*1000)/10:null};}
export function approvalRows(rows:ScopeRow[],user:string,now:number){return rows.flatMap(r=>pendingFor(r).map(proposal=>({...r,proposal,roles:outstandingRoles(proposal),canReview:canReview(r.project,proposal,user),hours:Math.max(0,(now-Date.parse(proposal.created))/3600000)}))).sort((a,b)=>Date.parse(a.proposal.created)-Date.parse(b.proposal.created));}
export function projectHealth(project:Project,rows:ScopeRow[],now:number,approvalDays=3,staleDays=7){
 const items=rows.filter(r=>r.project.id===project.id).map(r=>r.item),active=items.filter(isActive),progress=completion(items);
 const overdue=active.filter(i=>deadline(i.end,i.status,now).kind==='overdue');
 const unscheduled=active.filter(i=>!i.start||!i.end),unassigned=active.filter(i=>!i.owner.trim()),onHold=active.filter(i=>i.status==='On hold');
 const pending=approvalRows(rows.filter(r=>r.project.id===project.id),'',now),waiting=pending.filter(a=>a.hours>=approvalDays*24);
 const missingLeads=[...new Set(pending.flatMap(a=>a.roles.filter(role=>!project.members.some(m=>m.role===role&&normalizeOwner(m.email)!==normalizeOwner(a.proposal.author)))))];
 const stale=active.filter(i=>{const u=Date.parse(recordAudit(project,i).updated);return Number.isFinite(u)&&now-u>=staleDays*86400000;});
 const reasons=[overdue.length?`${overdue.length} overdue`:null,onHold.length?`${onHold.length} on hold`:null,missingLeads.length?'Independent lead needed':null,waiting.length?`${waiting.length} approvals waiting ≥${approvalDays}d`:null,unscheduled.length?`${unscheduled.length} missing dates`:null,unassigned.length?`${unassigned.length} unassigned`:null,stale.length?`${stale.length} inactive ≥${staleDays}d`:null].filter((v):v is string=>!!v);
 const label=!items.length?'No scope':!active.length?(progress.total?'Completed':'No active scope'):overdue.length?'At risk':reasons.length?'Needs attention':'On track';
 const scheduled=items.filter(i=>i.status!=='Cancelled'),starts=scheduled.map(i=>i.start).filter(Boolean).sort(),ends=scheduled.map(i=>i.end).filter(Boolean).sort();
 return {items,active,progress,overdue,unscheduled,unassigned,pending,waiting,stale,reasons,label,start:starts[0]||'',end:ends.at(-1)||''};
}
export function workload(rows:ScopeRow[],now:number){const names=new Map<string,string>();for(const {item} of rows)if(isActive(item)){const key=normalizeOwner(item.owner)||'__unassigned';if(!names.has(key))names.set(key,item.owner.trim()||'Unassigned');}return [...names].map(([key,name])=>{const assigned=rows.filter(r=>isActive(r.item)&&(normalizeOwner(r.item.owner)||'__unassigned')===key);return {key,name,rows:assigned,overdue:assigned.filter(r=>deadline(r.item.end,r.item.status,now).kind==='overdue'),week:assigned.filter(r=>dueThisWeek(r.item,now)),onHold:assigned.filter(r=>r.item.status==='On hold')};}).sort((a,b)=>b.overdue.length-a.overdue.length||b.rows.length-a.rows.length||a.name.localeCompare(b.name));}
