export const supportActions=['view','create','edit','assign','resolve','comment','attach','export','manageCatalog'] as const;
export const projectRoles=['None','Admin','Tech lead','Business lead','Contributor','Viewer'] as const;
export type SupportAction=typeof supportActions[number];
export type UserAccess={email:string;enabled:boolean;workspaceAdmin:boolean;areas:('Support'|'Projects')[];products:string[];supportActions:SupportAction[];createProjects:boolean;projectRoles:Record<string,typeof projectRoles[number]>};
export type AccessPolicy={version:number;users:UserAccess[];history:{id:string;author:string;created:string;text:string}[]};
export class AccessDenied extends Error {status=403;}
export const noAccess=(email:string):UserAccess=>({email:email.toLowerCase(),enabled:false,workspaceAdmin:false,areas:[],products:[],supportActions:[],createProjects:false,projectRoles:{}});
export function userAccess(p:AccessPolicy,email:string){return p.users.find(u=>u.email===email.toLowerCase())||noAccess(email);}
export function hasArea(a:UserAccess,area:'Support'|'Projects'){return a.enabled&&a.areas.includes(area);}
export function hasProduct(a:UserAccess,product:string){return a.enabled&&(a.products.includes('*')||a.products.includes(product));}
export function canSupport(a:UserAccess,action:SupportAction,product?:string){return hasArea(a,'Support')&&a.supportActions.includes('view')&&a.supportActions.includes(action)&&(!product||hasProduct(a,product));}
export function requireSupport(a:UserAccess,action:SupportAction,product?:string){if(!canSupport(a,action,product))throw new AccessDenied('You do not have permission for this support action or product.');}
export function requireAdmin(a:UserAccess){if(!a.enabled||!a.workspaceAdmin)throw new AccessDenied('Workspace administrator access is required.');}
export function projectProducts(p:{items:{product:string}[];history?:{snapshot?:{product?:string}}[]}){return [...new Set([...p.items.map(i=>i.product),...(p.history||[]).map(h=>h.snapshot?.product||'')].filter(Boolean))];}
export function projectRole(a:UserAccess,p:{id:string;members:{email:string;role:string}[];items:{product:string}[];history?:{snapshot?:{product?:string}}[]}){
 if(!hasArea(a,'Projects'))return null;
 if(projectProducts(p).some(product=>!hasProduct(a,product)))return null;
 const override=a.projectRoles[p.id];
 return override==='None'?null:override||p.members.find(m=>m.email===a.email)?.role||null;
}
export function validateUser(input:any,products:string[],projectIds:string[]):UserAccess{
 if(!input||typeof input.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())||input.email.length>254)throw Error('Enter a valid user email.');
 for(const key of ['enabled','workspaceAdmin','createProjects'])if(typeof input[key]!=='boolean')throw Error('Choose a valid '+key+' setting.');
 if(!Array.isArray(input.areas)||input.areas.some((s:any)=>!['Support','Projects'].includes(s)))throw Error('Choose supported workspace areas.');
 if(!Array.isArray(input.products)||input.products.some((s:any)=>s!=='*'&&!products.includes(s))||(input.products.includes('*')&&input.products.length!==1))throw Error('Choose valid products or All products.');
 if(!Array.isArray(input.supportActions)||input.supportActions.some((s:any)=>!supportActions.includes(s)))throw Error('Choose supported ticket actions.');
 if(input.areas.includes('Support')&&!input.supportActions.includes('view'))throw Error('Support access requires View.');
 if(!input.projectRoles||typeof input.projectRoles!=='object'||Array.isArray(input.projectRoles)||Object.entries(input.projectRoles).some(([id,role])=>!projectIds.includes(id)||!projectRoles.includes(role as any)))throw Error('Choose valid project roles.');
 return {email:input.email.trim().toLowerCase(),enabled:input.enabled,workspaceAdmin:input.workspaceAdmin,areas:[...new Set(input.areas)] as UserAccess['areas'],products:[...new Set(input.products)] as string[],supportActions:[...new Set(input.supportActions)] as SupportAction[],createProjects:input.createProjects,projectRoles:{...input.projectRoles}};
}
export function changeUser(p:AccessPolicy,input:any,actor:string,products:string[],projectIds:string[],now=new Date().toISOString()){
 requireAdmin(userAccess(p,actor));const user=validateUser(input,products,projectIds);
 const users=[...p.users.filter(u=>u.email!==user.email),user];
 if(!users.some(u=>u.enabled&&u.workspaceAdmin))throw Error('Retain at least one active workspace administrator.');
 const before=p.users.find(u=>u.email===user.email);
 const keys=(Object.keys(user) as (keyof UserAccess)[]).filter(k=>JSON.stringify(before?.[k])!==JSON.stringify(user[k]));
 if(!keys.length)return p;
 return {version:p.version+1,users,history:[{id:crypto.randomUUID(),author:actor,created:now,text:(before?'Updated':'Added')+' access for '+user.email+': '+keys.map(k=>k+' = '+JSON.stringify(user[k])).join('; ')},...p.history]};
}
