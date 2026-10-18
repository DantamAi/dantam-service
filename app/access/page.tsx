import {requireChatGPTUser} from '../chatgpt-auth';
import {getAccess} from '@/lib/access';
import {NoWorkspaceAccess} from '@/lib/page-access';
import AccessManager from './users';
export const dynamic='force-dynamic';
export default async function Page(){const u=await requireChatGPTUser('/access');const a=await getAccess(u.email);if(!a.enabled||!a.workspaceAdmin)return <NoWorkspaceAccess/>;return <AccessManager/>;}
