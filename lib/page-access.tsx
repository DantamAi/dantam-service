import {logoutToLoginPath} from './auth-paths';
import {redirect} from 'next/navigation';
import {getAccess} from './access';
import {hasArea,requireAdmin} from './access-model';
export async function requireArea(email:string,area:'Support'|'Projects'){
 const a=await getAccess(email);if(hasArea(a,area))return a;
 if(a.enabled&&a.workspaceAdmin)redirect('/access');
 if(hasArea(a,area==='Support'?'Projects':'Support'))redirect(area==='Support'?'/projects':'/');
 return null;
}
export function NoWorkspaceAccess(){return <main className="content"><section className="planning-card"><h1>Workspace access required</h1><p>Your account has no access to this workspace area. Ask a workspace administrator to enable the required areas, products and project roles in Users & Access.</p><div className="no-access-actions"><a href="/login" className="secondary" target="_top">Log in / account options</a><a href={logoutToLoginPath('/')} className="secondary" target="_top">Log out / switch account</a></div></section></main>;}
