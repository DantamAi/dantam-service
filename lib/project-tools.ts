import {getProject,listProjects,saveProjectAction} from './projects';
import {scopeStages} from './project-model';
const str={type:'string'};
const projectRef={id:{type:'string',description:'Exact project ID from list_projects or get_project.'},version:{type:'integer',description:'Current project version from get_project; read again after every write.'}};
const itemProperties={title:{type:'string',maxLength:180},description:str,acceptance:str,exclusions:str,product:str,module:str,owner:str,start:{type:'string',description:'YYYY-MM-DD or empty when unconfirmed.'},end:{type:'string',description:'YYYY-MM-DD or empty when unconfirmed.'},estimate:str,dependencies:{type:'array',items:{type:'string'}},tickets:str,source:{type:'string',description:'Source document or historical reference; retain original IDs and unconfirmed status.'}};
export const projectToolDefinitions=[
 {name:'list_projects',description:'List only projects the signed-in caller belongs to, including IDs, versions, roles and item counts.',inputSchema:{type:'object',properties:{query:str},additionalProperties:false}},
 {name:'get_project',description:'Read a member-accessible project, scope, proposals and revision history. Read before editing.',inputSchema:{type:'object',properties:{id:projectRef.id},required:['id'],additionalProperties:false}},
 {name:'create_project',description:'Create a project with the signed-in caller as administrator. Prefer the existing project when one already exists.',inputSchema:{type:'object',properties:{name:str,description:str},required:['name'],additionalProperties:false}},
 {name:'update_project',description:'Administrator-only edit of project name or description. Does not grant access, approve scope or change stages.',inputSchema:{type:'object',properties:{...projectRef,name:str,description:str},required:['id','version'],additionalProperties:false}},
 {name:'add_scope_items',description:'Add 1–200 new scope items as Draft only. Requires project membership and write permission. Dates, owners and estimates may be left unconfirmed. Read current scope first to avoid duplicates.',inputSchema:{type:'object',properties:{...projectRef,items:{type:'array',minItems:1,maxItems:200,items:{type:'object',properties:itemProperties,required:['title','description','acceptance'],additionalProperties:false}}},required:['id','version','items'],additionalProperties:false}},
 {name:'update_scope_item',description:'Revise an existing Draft or Review scope item; preserve prior revision. Approved scope must first be reopened through lead approval. Only supplied fields change.',inputSchema:{type:'object',properties:{...projectRef,itemId:str,changes:{type:'object',properties:itemProperties,additionalProperties:false}},required:['id','version','itemId','changes'],additionalProperties:false}},
 {name:'add_project_comment',description:'Append a project or scope discussion entry, attributed to the signed-in caller.',inputSchema:{type:'object',properties:{...projectRef,itemId:str,text:str},required:['id','version','text'],additionalProperties:false}},
 {name:'propose_scope_status',description:'Propose a scope stage change or appeal a rejected proposal. Server enforces existing tech/business lead gates, approved revisions and dependencies; this does not bypass approvals.',inputSchema:{type:'object',properties:{...projectRef,itemId:str,to:{type:'string',enum:[...scopeStages]},reason:str,appealOf:str},required:['id','version','itemId','to','reason'],additionalProperties:false}},
 {name:'decide_scope_proposal',description:'Record an approval or rejection by the signed-in required lead. Proposers cannot approve their own requests; administrators cannot substitute for leads.',inputSchema:{type:'object',properties:{...projectRef,proposalId:str,decision:{type:'string',enum:['Approve','Reject']},reason:str},required:['id','version','proposalId','decision','reason'],additionalProperties:false}}
];
const defaults={description:'',acceptance:'',exclusions:'',product:'CRM App',module:'',owner:'',start:'',end:'',estimate:'',dependencies:[],tickets:'',source:''};
const allowedItemFields=new Set(Object.keys(itemProperties));
function cleanItem(input:any){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid scope fields.');if(Object.keys(input).some(k=>!allowedItemFields.has(k)))throw Error('Only documented scope fields can be supplied. Use a proposal for status changes.');return input;}
export async function callProjectTool(name:string,a:any,email:string){
 if(name==='list_projects')return (await listProjects(email)).filter(p=>!a.query||(p.name+' '+p.description).toLowerCase().includes(String(a.query).toLowerCase())).map(p=>({id:p.id,name:p.name,description:p.description,version:p.version,role:p.members.find(m=>m.email===email.toLowerCase())?.role,itemCount:p.items.length,updated:p.updated}));
 if(name==='get_project')return getProject(a.id,email);
 if(name==='create_project')return saveProjectAction({action:'create',name:a.name,description:a.description},email);
 const base={id:a.id,version:a.version};
 switch(name){
  case 'update_project':return saveProjectAction({...base,action:'metadata',name:a.name,description:a.description},email);
  case 'add_scope_items':{
   if(!Array.isArray(a.items)||!a.items.length||a.items.length>200)throw Error('Add 1–200 scope items.');
   const p=await getProject(a.id,email);const titles=new Set(p.items.map(i=>i.title.toLowerCase()));
   const items=a.items.map((v:any)=>{const input=cleanItem(v);const key=typeof input.title==='string'?input.title.trim().toLowerCase():'';if(titles.has(key))throw Error('Scope title already exists; read the project before adding duplicates.');titles.add(key);return {...defaults,...input};});
   return saveProjectAction({...base,action:'import',items},email);
  }
  case 'update_scope_item':{const p=await getProject(a.id,email);const old=p.items.find(i=>i.id===a.itemId);if(!old)throw Error('Scope item not found.');return saveProjectAction({...base,action:'item',item:{...old,...cleanItem(a.changes)}},email);}
  case 'add_project_comment':return saveProjectAction({...base,action:'comment',itemId:a.itemId,text:a.text},email);
  case 'propose_scope_status':return saveProjectAction({...base,action:'propose',itemId:a.itemId,to:a.to,reason:a.reason,appealOf:a.appealOf},email);
  case 'decide_scope_proposal':return saveProjectAction({...base,action:'decision',proposalId:a.proposalId,decision:a.decision,reason:a.reason},email);
  default:throw Error('Unknown project tool.');
 }
}
