import type {Project,ScopeItem} from './project-model';
// Relational rows are the live read model. Legacy JSON is kept solely as a compatible
// snapshot during cutover/rollback; every new write updates both in one transaction.
type Row=Record<string,any>;
const itemFields=['id','title','description','acceptance','exclusions','product','module','owner','start','end','estimate','tickets','source','status','revision','approvedRevision','created','createdBy','updated','updatedBy'];
const rootFields=['id','name','description','version','created','updated','createdBy','updatedBy'];
const snake=(s:string)=>s.replace(/[A-Z]/g,c=>'_'+c.toLowerCase());
const pick=(value:Row,fields:string[])=>Object.fromEntries(fields.map(k=>[snake(k),value[k]??null]));
const decode=(value:Row,fields:string[])=>Object.fromEntries(fields.filter(k=>value[snake(k)]!==null&&value[snake(k)]!==undefined).map(k=>[k,value[snake(k)]]));
const tables=['project_scope_items','project_members','project_scope_dependencies','project_history','project_scope_revisions','project_proposals','project_required_approvals','project_approval_decisions','project_attachments'];
function encode(p:Project){
 const records:Record<string,Row[]>=Object.fromEntries(tables.map(t=>[t,[]]));
 p.items.forEach((i,position)=>{records.project_scope_items.push({project_id:p.id,...pick(i,itemFields),position});i.dependencies.forEach((id,position)=>records.project_scope_dependencies.push({project_id:p.id,item_id:i.id,depends_on_id:id,position}));});
 p.members.forEach((m,position)=>records.project_members.push({project_id:p.id,...m,position}));
 p.history.forEach((h,position)=>{records.project_history.push({project_id:p.id,...pick(h,['id','itemId','author','text','created']),position});if(h.snapshot)records.project_scope_revisions.push({project_id:p.id,event_id:h.id,...pick(h.snapshot,itemFields),dependencies_json:JSON.stringify(h.snapshot.dependencies)});});
 p.proposals.forEach((q,position)=>{records.project_proposals.push({project_id:p.id,...pick(q,['id','itemId','from','to','revision','reason','author','created','state','appealOf']),position});q.required.forEach((role,position)=>records.project_required_approvals.push({project_id:p.id,proposal_id:q.id,role,position}));q.decisions.forEach((decision,position)=>records.project_approval_decisions.push({project_id:p.id,proposal_id:q.id,...decision,position}));});
 (p.attachments||[]).forEach((a,position)=>records.project_attachments.push({project_id:p.id,...pick(a,['id','itemId','name','mime','size','caption','author','created','objectKey']),position}));
 return records;
}
export async function writeStoredProject(p:Project,d:D1Database,expectedVersion?:number,migrating=false){
 const token=crypto.randomUUID(),root={...pick(p,rootFields),legacy_version:p.version,write_token:token},columns=Object.keys(root),quoted=columns.map(k=>'"'+k+'"').join(','),values=Object.values(root);
 let first:D1PreparedStatement;
 if(expectedVersion===undefined){first=d.prepare(`INSERT OR IGNORE INTO projects (${quoted}) VALUES (${columns.map(()=>'?').join(',')})`).bind(...values);}
 else{
  // Checking the compatibility snapshot too detects a write from the previous Worker
  // during deployment. No stale normalized edit can overwrite that newer write.
  first=d.prepare(`UPDATE projects SET ${columns.filter(c=>c!=='id').map(c=>'"'+c+'"=?').join(',')} WHERE id=? AND version=? AND legacy_version=? AND EXISTS(SELECT 1 FROM planning_projects WHERE id=? AND version=?)`).bind(...columns.filter(c=>c!=='id').map(c=>root[c as keyof typeof root]),p.id,expectedVersion,expectedVersion,p.id,migrating?p.version:expectedVersion);
 }
 const gate='EXISTS(SELECT 1 FROM projects WHERE id=? AND write_token=?)',queries=[first];
 // All child changes use the unique successful-write token. A losing CAS cannot
 // delete or replace any child rows, even when another writer chose the same version.
 for(const table of ['project_approval_decisions','project_required_approvals','project_proposals','project_scope_dependencies','project_scope_revisions','project_history','project_attachments','project_members','project_scope_items'])queries.push(d.prepare(`DELETE FROM ${table} WHERE project_id=? AND ${gate}`).bind(p.id,p.id,token));
 for(const [table,rows] of Object.entries(encode(p))){
  if(!rows.length)continue;const cols=Object.keys(rows[0]),size=Math.max(1,Math.floor(88/cols.length));
  for(let start=0;start<rows.length;start+=size){const group=rows.slice(start,start+size);queries.push(d.prepare(`INSERT INTO ${table} (${cols.map(c=>'"'+c+'"').join(',')}) SELECT ${cols.map((_,i)=>'column'+(i+1)).join(',')} FROM (VALUES ${group.map(()=>`(${cols.map(()=>'?').join(',')})`).join(',')}) WHERE ${gate}`).bind(...group.flatMap(r=>cols.map(c=>r[c])),p.id,token));}
 }
 if(!migrating)queries.push(d.prepare(`INSERT INTO planning_projects(id,version,data) SELECT ?,?,? WHERE ${gate} ON CONFLICT(id) DO UPDATE SET version=excluded.version,data=excluded.data`).bind(p.id,p.version,JSON.stringify(p),p.id,token));
 const result=await d.batch(queries);return !!result[0].meta.changes;
}
/** Idempotent data backfill outside schema migrations, including deployment overlap. */
export async function migrateLegacyProjects(d:D1Database){
 for(let attempt=0;attempt<4;attempt++){
  const pending=await d.prepare('SELECT l.id,l.version,l.data,p.version AS stored_version,p.legacy_version FROM planning_projects l LEFT JOIN projects p ON p.id=l.id WHERE p.id IS NULL OR l.version>p.legacy_version').all<Row>();
  if(!pending.results.length)return;
  for(const row of pending.results){const p=JSON.parse(row.data) as Project;if(p.id!==row.id||p.version!==row.version)throw Error('Project snapshot identity/version mismatch. Migration stopped without changing the source record.');if(row.stored_version!==null&&row.stored_version!==row.legacy_version)throw Error('Project storage versions disagree. Migration stopped.');await writeStoredProject(p,d,row.stored_version===null?undefined:row.stored_version,true);}
 }
 throw Error('Projects changed during storage migration. Retry the request.');
}
export async function readStoredProjects(d:D1Database,id?:string):Promise<Project[]>{
 await migrateLegacyProjects(d);
 const queries=[d.prepare('SELECT * FROM projects'+(id?' WHERE id=?':'')+' ORDER BY created,id'),...tables.map(t=>d.prepare('SELECT * FROM '+t+(id?' WHERE project_id=?':'')+(['project_scope_revisions'].includes(t)?'':' ORDER BY position')))];
 const results=await d.batch(id?queries.map(q=>q.bind(id)):queries);
 const [roots,...related]=results.map(r=>r.results as Row[]),data=Object.fromEntries(tables.map((t,i)=>[t,related[i]]));
 return roots.map(root=>{
  const p=decode(root,rootFields) as Project;
  const rows=(table:string)=>data[table].filter(r=>r.project_id===p.id);
  p.items=rows('project_scope_items').map(r=>({...decode(r,itemFields),dependencies:rows('project_scope_dependencies').filter(d=>d.item_id===r.id).map(d=>d.depends_on_id)}) as ScopeItem);
  p.members=rows('project_members').map(r=>({email:r.email,role:r.role}));
  p.history=rows('project_history').map(r=>{const h=decode(r,['id','itemId','author','text','created']) as Project['history'][number],snapshot=rows('project_scope_revisions').find(s=>s.event_id===r.id);if(snapshot)h.snapshot={...decode(snapshot,itemFields),dependencies:JSON.parse(snapshot.dependencies_json)} as ScopeItem;return h;});
  p.proposals=rows('project_proposals').map(r=>({...decode(r,['id','itemId','from','to','revision','reason','author','created','state','appealOf']),required:rows('project_required_approvals').filter(a=>a.proposal_id===r.id).map(a=>a.role),decisions:rows('project_approval_decisions').filter(a=>a.proposal_id===r.id).map(a=>decode(a,['role','author','decision','reason','created']))}) as Project['proposals'][number]);
  p.attachments=rows('project_attachments').map(r=>decode(r,['id','itemId','name','mime','size','caption','author','created','objectKey']) as NonNullable<Project['attachments']>[number]);
  return p;
 });
}
