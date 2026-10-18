import {env} from 'cloudflare:workers';
import {getDb} from '@/db';
import {attachments,events,tickets} from '@/db/schema';
import {eq,desc} from 'drizzle-orm';
import {validateEvidence} from './attachment-validation';
export {MAX_EVIDENCE,validateEvidence} from './attachment-validation';
export function evidenceView(a:typeof attachments.$inferSelect){return {id:a.id,ticketId:a.ticketId,name:a.name,mime:a.mime,size:a.size,caption:a.caption,author:a.author,created:a.created,url:'/api/attachments?id='+a.id,downloadUrl:'/api/attachments?id='+a.id+'&download=1'};}
export async function listEvidence(ticketId:number){return (await getDb().select().from(attachments).where(eq(attachments.ticketId,ticketId)).orderBy(desc(attachments.created))).map(evidenceView);}
export async function addEvidence(ticketId:number,name:string,bytes:Uint8Array,caption:string,author:string){
 if(!Number.isInteger(ticketId)||ticketId<1)throw new Error('A saved ticket is required.');
 if(typeof caption!=='string'||caption.length>1500)throw new Error('Caption must be shorter than1500 characters.');
 const db=getDb();if(!(await db.select({id:tickets.id}).from(tickets).where(eq(tickets.id,ticketId)))[0])throw new Error('Ticket not found.');
 const mime=validateEvidence(name,bytes);if(!env.BUCKET)throw new Error('Attachment storage is unavailable.');
 const id=crypto.randomUUID(),now=new Date().toISOString(),key='ticket-evidence/'+ticketId+'/'+id;
 const safeName=name.replace(/[^a-zA-Z0-9._() -]/g,'_').slice(0,180)||'evidence';
 await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});
 try{const [a]=await db.insert(attachments).values({id,ticketId,objectKey:key,name:safeName,mime,size:bytes.length,caption:caption.trim(),author,created:now}).returning();await db.insert(events).values({ticketId,action:'Evidence attached: '+safeName+(caption?' — '+caption.trim():''),author,created:now});return evidenceView(a);}catch(e){await env.BUCKET.delete(key);throw e;}
}
export async function readEvidence(id:string){const [a]=await getDb().select().from(attachments).where(eq(attachments.id,id));if(!a||!env.BUCKET)return null;const object=await env.BUCKET.get(a.objectKey);return object?{meta:a,object}:null;}
