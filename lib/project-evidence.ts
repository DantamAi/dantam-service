import {writeStoredProject} from './project-storage';
import {getAccess} from './access';
import {projectRole} from './access-model';
import {env} from 'cloudflare:workers';
import {getProject,getRawProject,projectDatabase,ProjectError} from './projects';
import {member,textField,type ProjectAttachment} from './project-model';
import {validateEvidence} from './attachment-validation';
export function projectEvidenceView(projectId:string,a:ProjectAttachment){return {id:a.id,itemId:a.itemId,name:a.name,mime:a.mime,size:a.size,caption:a.caption,author:a.author,created:a.created,url:'/api/project-attachments?projectId='+encodeURIComponent(projectId)+'&id='+encodeURIComponent(a.id),downloadUrl:'/api/project-attachments?projectId='+encodeURIComponent(projectId)+'&id='+encodeURIComponent(a.id)+'&download=1'};}
export async function addProjectEvidence(projectId:string,version:number,itemId:string,name:string,bytes:Uint8Array,caption:string,email:string,d=projectDatabase(),bucket=(env as any).BUCKET as R2Bucket){
 await getProject(projectId,email,d);const p=await getRawProject(projectId,d);
 const role=projectRole(await getAccess(email,d),p);
 if(!role||role==='Viewer')throw new ProjectError('Viewers cannot attach files.',403);
 if(!Number.isInteger(version)||version!==p.version)throw new ProjectError('This project changed. Refresh before attaching a file.',409);
 if(itemId&&!p.items.some(i=>i.id===itemId))throw new ProjectError('Scope item not found.',404);
 if(!bucket)throw new ProjectError('Attachment storage is unavailable.',503);
 const mime=validateEvidence(name,bytes);caption=textField(caption,1500);
 const id=crypto.randomUUID(),now=new Date().toISOString(),objectKey='project-evidence/'+p.id+'/'+id;
 const safeName=name.replace(/[^a-zA-Z0-9._() -]/g,'_').slice(0,180)||'evidence';
 const a:ProjectAttachment={id,itemId,name:safeName,mime,size:bytes.length,caption,author:email.toLowerCase(),created:now,objectKey};
 await bucket.put(objectKey,bytes,{httpMetadata:{contentType:mime}});
 try{
  p.attachments=[...(p.attachments||[]),a];p.history.unshift({id:crypto.randomUUID(),itemId,author:a.author,text:'Attachment uploaded: '+safeName+(caption?' — '+caption:''),created:now});
  p.updated=now;p.updatedBy=a.author;const scope=p.items.find(i=>i.id===itemId);if(scope){scope.updated=now;scope.updatedBy=a.author;}
  p.version++;
  const saved=await writeStoredProject(p,d,version);
  if(!saved)throw new ProjectError('Another update was saved first. Refresh and retry.',409);
  return {attachment:projectEvidenceView(p.id,a),project:await getProject(p.id,email,d)};
 }catch(e){await bucket.delete(objectKey);throw e;}
}
export async function readProjectEvidence(projectId:string,id:string,email:string,d=projectDatabase(),bucket=(env as any).BUCKET as R2Bucket){
 const p=await getProject(projectId,email,d);const a=p.attachments?.find(a=>a.id===id);if(!a||!bucket)throw new ProjectError('Attachment not found.',404);
 const object=await bucket.get(a.objectKey);if(!object)throw new ProjectError('Attachment not found.',404);return {meta:a,object};
}
