export const stages=['New','Triage','Backlog','Planned','In progress','Ready for QA','Blocked','Resolved','Closed'] as const;
export const priorities=['Critical','High','Medium','Low'] as const;
import {modules} from './modules';
export {modules} from './modules';
export type Ticket={id:number;title:string;type:string;status:string;priority:string;product:string;module:string;assignee:string;description:string;expected:string;actual:string;steps:string;sourceId:string|null;release:string;due:string;created:string;updated:string;updatedBy?:string;createdBy?:string;importedBy?:string;resolvedBy?:string;resolvedAt?:string;closedBy?:string;closedAt?:string;reopenedCount?:number;contributors?:string[];version:number};
export const blank={title:'',type:'Bug',status:'New',priority:'Medium',product:'Clinic App',module:'Case Sheet',assignee:'',description:'',expected:'',actual:'',steps:'',release:'',due:''};
export function validateDeliveryDate(date:string,required=false){if(!date){if(required)throw new Error('Set a delivery date for this ticket.');return;}if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Use a valid delivery date.');}
export function validateTicket(data:any,catalog?:{products:string[];modulesByProduct:Record<string,string[]>}){
 const result:any={}; for(const key of Object.keys(blank)){if(typeof data[key]!=='string')throw new Error('Please complete all ticket fields.'); result[key]=data[key].trim();}
 if(result.title.length<5||result.title.length>180)throw new Error('Title must be between 5 and 180 characters.');
 if(!['Bug','Requirement'].includes(result.type)||!stages.includes(result.status)||!priorities.includes(result.priority)||!(catalog?catalog.products.includes(result.product)&&catalog.modulesByProduct[result.product]?.includes(result.module):result.product==='Clinic App'&&modules.includes(result.module)))throw new Error('Select a valid type, stage, priority and module.');
 if(Object.values(result).some(v=>String(v).length>12000))throw new Error('A field exceeds 12,000 characters.');
 if(result.description.length<10)throw new Error('Add a description of at least 10 characters.');
 validateDeliveryDate(result.due);
 return result as typeof blank;
}
