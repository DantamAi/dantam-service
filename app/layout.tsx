import type {Metadata} from 'next';
import './globals.css';
import {getChatGPTUser} from './chatgpt-auth';
import {SessionProvider} from './account-menu';
export const metadata:Metadata={title:'Dantam Service Desk',description:'One place for bugs, requirements and progress. Built for desktop and mobile.'};
export default async function Layout({children}:{children:React.ReactNode}){const user=await getChatGPTUser();return <html lang="en"><body><SessionProvider user={user?{email:user.email,displayName:user.displayName}:null}>{children}</SessionProvider></body></html>;}
