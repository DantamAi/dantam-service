import {getDb} from '@/db';
import {catalogOptions} from '@/db/schema';
import {modules} from './modules';
export const defaultProducts=['Clinic App','Lab App','CRM App'];
export type Catalog={products:string[];modulesByProduct:Record<string,string[]>};
export function optionName(value:unknown){if(typeof value!=='string')throw new Error('Enter a name.');const name=value.trim().replace(/\s+/g,' ');if(name.length<2||name.length>80||/[\x00-\x1f\x7f]/.test(value))throw new Error('Use 2–80 characters without control characters.');return name;}
export async function getCatalog():Promise<Catalog>{
 const rows=await getDb().select().from(catalogOptions);
 const products=[...defaultProducts,...rows.filter(r=>r.kind==='product').map(r=>r.name).sort()];
 const modulesByProduct:Record<string,string[]>={};
 for(const product of products)modulesByProduct[product]=[...(product==='Clinic App'?modules:['Other']),...rows.filter(r=>r.kind==='module'&&r.product===product).map(r=>r.name).sort()];
 return {products,modulesByProduct};
}
export async function addCatalogOption(kind:string,productValue:unknown,nameValue:unknown,author:string){
 if(!['product','module'].includes(kind))throw new Error('Choose product or module.');
 const name=optionName(nameValue),catalog=await getCatalog();
 const product=kind==='module'?catalog.products.find(p=>p.toLowerCase()===String(productValue).toLowerCase()):'';
 if(product===undefined)throw new Error('Select an existing product first.');
 const options=kind==='product'?catalog.products:catalog.modulesByProduct[product];
 const existing=options.find(n=>n.toLowerCase()===name.toLowerCase());
 if(existing)return {name:existing,catalog,added:false};
 await getDb().insert(catalogOptions).values({key:JSON.stringify([kind,product.toLowerCase(),name.toLowerCase()]),kind,product,name,author,created:new Date().toISOString()}).onConflictDoNothing();
 const saved=await getCatalog();const canonical=(kind==='product'?saved.products:saved.modulesByProduct[product]).find(n=>n.toLowerCase()===name.toLowerCase());
 return {name:canonical,catalog:saved,added:true};
}
