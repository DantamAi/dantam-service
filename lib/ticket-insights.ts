export type AuditEvent={id:number;ticketId:number;action:string;author:string;created:string};
export function auditFacts(ticket:{status:string},events:AuditEvent[]){
 const ordered=[...events].sort((a,b)=>a.created.localeCompare(b.created)||a.id-b.id);
 const creator=ordered.find(e=>e.action==='Ticket created'||e.action.startsWith('Ticket created · '));
 const imported=ordered.find(e=>e.action.startsWith('Imported '));
 let resolved:AuditEvent|undefined,closed:AuditEvent|undefined,reopenedCount=0;
 const done=(s:string)=>s==='Resolved'||s==='Closed';
 for(const event of ordered){const change=event.action.match(/(?:^| · )Stage: (.+?) → (.+?)(?: · |$)/);if(!change)continue;const [,from,to]=change;
  if(done(from)&&!done(to)){reopenedCount++;resolved=undefined;closed=undefined;}
  if(to==='Resolved'&&!done(from))resolved=event;
  if(to==='Closed'){closed=event;if(!done(from))resolved=event;}
 }
 return {createdBy:creator?.author||'Not recorded',importedBy:imported?.author||'',resolvedBy:done(ticket.status)?resolved?.author||closed?.author||'Not recorded':'',resolvedAt:done(ticket.status)?resolved?.created||closed?.created||'':'',closedBy:ticket.status==='Closed'?closed?.author||'Not recorded':'',closedAt:ticket.status==='Closed'?closed?.created||'':'',reopenedCount,contributors:[...new Set(ordered.map(e=>e.author))]};
}
export function ageSummary(values:number[]){const valid=values.filter(Number.isFinite);if(!valid.length)return {count:0,avg:null,min:null,max:null};return {count:valid.length,avg:valid.reduce((a,b)=>a+b,0)/valid.length,min:Math.min(...valid),max:Math.max(...valid)};}
export function elapsedHours(start:string,end:number){const n=Date.parse(start);return Number.isFinite(n)?Math.max(0,(end-n)/3600000):NaN;}
export function durationLabel(hours:number|null){if(hours===null||!Number.isFinite(hours))return '—';const minutes=Math.max(0,Math.round(hours*60));if(minutes<60)return `${minutes}m`;if(minutes<1440)return `${Math.floor(minutes/60)}h ${minutes%60}m`;return `${Math.floor(minutes/1440)}d ${Math.floor(minutes%1440/60)}h`;}
