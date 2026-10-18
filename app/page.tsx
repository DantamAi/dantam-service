import {requireArea,NoWorkspaceAccess} from '@/lib/page-access';
import Desk from './desk';
import {requireChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireChatGPTUser('/');if(!await requireArea(u.email,'Support'))return <NoWorkspaceAccess/>;return <Desk/>;}
