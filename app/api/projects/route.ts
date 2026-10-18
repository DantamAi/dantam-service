import {getChatGPTUser} from '@/app/chatgpt-auth';
import {listProjects,getProject,saveProjectAction,ProjectError} from '@/lib/projects';
export const dynamic='force-dynamic';
const json=(v:any,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){const u=await getChatGPTUser();if(!u)return json({error:'Sign in to access projects.'},401);try{const id=new URL(req.url).searchParams.get('id');return json(id?await getProject(id,u.email):{projects:await listProjects(u.email),user:u.email.toLowerCase()});}catch(e){return json({error:(e as Error).message},400);}}
export async function POST(req:Request){const u=await getChatGPTUser();if(!u)return json({error:'Sign in to update projects.'},401);if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Invalid origin.'},403);try{const raw=await req.text();if(raw.length>2000000)throw Error('Request exceeds the 2 MB limit.');return json(await saveProjectAction(JSON.parse(raw),u.email));}catch(e){return json({error:(e as Error).message},e instanceof ProjectError?e.status:400);}}
