import {auditFacts} from './ticket-insights';
import {getCatalog} from './catalog';
import {listEvidence} from './evidence';
import {normalizeModule} from './modules';
import {getDb} from '@/db';
import {tickets,events} from '@/db/schema';
import {eq,desc,and} from 'drizzle-orm';
import {blank,validateTicket,validateDeliveryDate} from './model';
import {qaImport} from './seed';
// Derive activity from the audit trail so existing records and evidence uploads
// have truthful attribution without rewriting historical creation dates.
export function withLatestActivity<T extends {updated:string}>(ticket:T,activity:{author:string;created:string}|undefined){return {...ticket,updated:activity&&activity.created>ticket.updated?activity.created:ticket.updated,updatedBy:activity?.author||'Not recorded'};}
export async function listTickets(){
 const db=getDb();const records=await db.select().from(tickets);
 const activity=await db.select().from(events).orderBy(desc(events.created),desc(events.id));
 const latest=new Map<number,typeof activity[number]>();
 for(const event of activity)if(!latest.has(event.ticketId))latest.set(event.ticketId,event);
 return records.map(ticket=>({...withLatestActivity(ticket,latest.get(ticket.id)),...auditFacts(ticket,activity.filter(e=>e.ticketId===ticket.id))})).sort((a,b)=>b.updated.localeCompare(a.updated)||b.id-a.id);
}
export async function detail(id:number){const db=getDb();const [ticket]=await db.select().from(tickets).where(eq(tickets.id,id));if(!ticket)throw new Error('Ticket not found.');const history=await db.select().from(events).where(eq(events.ticketId,id)).orderBy(desc(events.created),desc(events.id));return {ticket:{...withLatestActivity(ticket,history[0]),...auditFacts(ticket,history)},attachments:await listEvidence(id),events:history};}
export async function createTicket(data:any,author:string){const db=getDb();const value=validateTicket({...blank,...data},await getCatalog());validateDeliveryDate(value.due,true);const now=new Date().toISOString();const [ticket]=await db.insert(tickets).values({...value,created:now,updated:now,version:1}).returning();await db.insert(events).values({ticketId:ticket.id,action:'Ticket created · Delivery date: '+value.due,author,created:now});return ticket;}
export async function updateTicket(data:any,author:string){const db=getDb();const {ticket:old}=await detail(Number(data.id));if(data.version!==old.version)throw new Error('This ticket changed. Reload it before saving to avoid overwriting another update.');const catalog=await getCatalog();const product=data.product??old.product;const selectedModule=data.module??old.module;const module=data.module===undefined&&product==='Clinic App'?normalizeModule(old.sourceId,selectedModule):selectedModule;const value=validateTicket({...old,...data,product,module},catalog);if(old.due)validateDeliveryDate(value.due,true);const changed=Object.keys(blank).filter(k=>(value as any)[k]!== (old as any)[k]);if(!changed.length)return old;const now=new Date().toISOString();const [ticket]=await db.update(tickets).set({...value,updated:now,version:old.version+1}).where(and(eq(tickets.id,old.id),eq(tickets.version,old.version))).returning();if(!ticket)throw new Error('Another update was saved first. Reload this ticket.');const changes=changed.map(k=>k==='status'?`Stage: ${old.status} → ${value.status}`:k==='product'?`Product: ${old.product} → ${value.product}`:k==='module'?`Module: ${old.module} → ${value.module}`:k==='due'?`Delivery date: ${old.due||'Date not set'} → ${value.due}`:k==='assignee'?`Owner: ${old.assignee||'Unassigned'} → ${value.assignee||'Unassigned'}`:`Updated ${k}`).join(' · ');await db.insert(events).values({ticketId:ticket.id,action:changes,author,created:now});return ticket;}
export async function commentTicket(id:number,text:string,author:string){if(typeof text!=='string'||!text.trim()||text.length>6000)throw new Error('Comment must contain1–6000 characters.');await detail(id);const db=getDb();await db.insert(events).values({ticketId:id,action:'Comment: '+text.trim(),author,created:new Date().toISOString()});return {ok:true};}
export async function importQA(author:string){const db=getDb();let added=0;for(const value of qaImport){const now=new Date().toISOString();const rows=await db.insert(tickets).values({...value,created:now,updated:now,version:1}).onConflictDoNothing({target:tickets.sourceId}).returning();if(rows[0]){added++;await db.insert(events).values({ticketId:rows[0].id,action:'Imported QA review summary ·17Oct2026 · source '+value.sourceId,author,created:now});}}return {added};}
