import type {Metadata} from 'next';
import './globals.css';
import './brand-theme.css';
import {ThemeProvider} from './theme-provider';
import {themeInitScript} from '@/lib/theme';
import {getChatGPTUser} from './chatgpt-auth';
import {SessionProvider} from './account-menu';
export const metadata:Metadata={title:'Dantam Service Desk',description:'One connected workspace for service, projects and delivery.',icons:{icon:'/dantam-mascot.png',apple:'/dantam-mascot.png'}};
export default async function Layout({children}:{children:React.ReactNode}){const user=await getChatGPTUser();return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:themeInitScript}}/></head><body><ThemeProvider><SessionProvider user={user?{email:user.email,displayName:user.displayName}:null}>{children}</SessionProvider></ThemeProvider></body></html>;}
