// Deadlines are calendar dates in the viewer's local timezone, inclusive through that day.
export const deadlineFilters=['All dates','Overdue','Due today','Upcoming','Date not set'] as const;
export type DeadlineFilter=typeof deadlineFilters[number];
export function localDay(now:number){const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function deadline(date:string,status:string,now:number){
 const complete=['Resolved','Closed','Completed','Cancelled'].includes(status);
 if(complete)return {kind:'complete',label:'Completed',daysLate:0};
 if(!date)return {kind:'missing',label:'Date not set',daysLate:0};
 const today=localDay(now);
 if(date<today){const daysLate=Math.round((Date.parse(today)-Date.parse(date))/86400000);return {kind:'overdue',label:`Overdue · ${daysLate}d`,daysLate};}
 if(date===today)return {kind:'today',label:'Due today',daysLate:0};
 return {kind:'upcoming',label:'Upcoming',daysLate:0};
}
export function matchesDeadline(date:string,status:string,filter:string,now:number){const k=deadline(date,status,now).kind;return filter==='All dates'||(filter==='Overdue'&&k==='overdue')||(filter==='Due today'&&k==='today')||(filter==='Upcoming'&&k==='upcoming')||(filter==='Date not set'&&!date);}
