import {getChatGPTUser} from '@/app/chatgpt-auth';
import {addProjectEvidence,readProjectEvidence} from '@/lib/project-evidence';
import {ProjectError} from '@/lib/projects';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Sign in to attach project files.'},{status:401});
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Invalid origin.'},{status:403});
 if(Number(req.headers.get('content-length'))>12*1024*1024)return Response.json({error:'Upload is too large.'},{status:413});
 try{const form=await req.formData(),file=form.get('file');if(!file||typeof file==='string')throw Error('Choose a file to upload.');if(file.size>10*1024*1024)throw Error('Choose a file no larger than 10 MB.');
 return Response.json(await addProjectEvidence(String(form.get('projectId')||''),Number(form.get('version')),String(form.get('itemId')||''),file.name,new Uint8Array(await file.arrayBuffer()),String(form.get('caption')||''),user.email),{status:201});
 }catch(e){return Response.json({error:(e as Error).message},{status:e instanceof ProjectError?e.status:400});}
}
export async function GET(req:Request){
 const user=await getChatGPTUser();if(!user)return new Response('Sign in to view project files.',{status:401});
 const q=new URL(req.url).searchParams;
 try{const {meta,object}=await readProjectEvidence(q.get('projectId')||'',q.get('id')||'',user.email);const inline=meta.mime.startsWith('image/')&&q.get('download')!=='1';
 return new Response(object.body,{headers:{'Content-Type':meta.mime,'Content-Length':String(meta.size),'Content-Disposition':(inline?'inline':'attachment')+'; filename="'+meta.name.replace(/"/g,'_')+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'",'Cross-Origin-Resource-Policy':'same-origin'}});
 }catch(e){return new Response((e as Error).message,{status:e instanceof ProjectError?e.status:400});}
}
