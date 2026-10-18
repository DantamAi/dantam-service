import {requireArea,NoWorkspaceAccess} from '@/lib/page-access';
import {requireChatGPTUser} from '../chatgpt-auth';
import Projects from './projects';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireChatGPTUser('/projects');if(!await requireArea(u.email,'Projects'))return <NoWorkspaceAccess/>;return <Projects/>;}
