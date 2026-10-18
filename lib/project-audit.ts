import type {Project,ScopeItem} from './project-model';
/** Prefer immutable stamps, then documented creation events. Never infer a creator from an edit. */
export function recordAudit(p:Project,item?:ScopeItem){
 const record=item||p;
 const history=p.history.filter(h=>!item||h.itemId===item.id).slice().sort((a,b)=>Date.parse(a.created)-Date.parse(b.created));
 const creation=history.find(h=>item?h.text.startsWith('Added scope: '):h.itemId===''&&h.text==='Project created.');
 const latest=history.at(-1);
 const latestIsNewer=latest&&(!record.updated||Date.parse(latest.created)>Date.parse(record.updated));
 return {created:record.created||creation?.created||'',createdBy:record.createdBy||creation?.author||'Not recorded',updated:latestIsNewer?latest.created:record.updated||latest?.created||'',updatedBy:latestIsNewer?latest.author:record.updatedBy||latest?.author||'Not recorded'};
}
export function recordAge(created:string,now=Date.now()){
 const ms=now-Date.parse(created);if(!created||!Number.isFinite(ms))return 'Not recorded';
 const minutes=Math.max(0,Math.floor(ms/60000));if(minutes<1)return 'Just created';if(minutes<60)return minutes+'m';if(minutes<1440)return Math.floor(minutes/60)+'h '+minutes%60+'m';return Math.floor(minutes/1440)+'d '+Math.floor(minutes%1440/60)+'h';
}
export function projectTimestamp(value:string){return value?new Date(value).toLocaleString('en-AU',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}):'Not recorded';}
