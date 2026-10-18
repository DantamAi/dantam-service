'use client';
import {createContext,useContext} from 'react';
import {ChevronDown,LogIn,LogOut,UserRound,ArrowLeftRight} from 'lucide-react';
import {chatGPTSignInPath,loginPagePath,logoutToLoginPath} from '@/lib/auth-paths';
type Session={email:string;displayName:string}|null;
const SessionContext=createContext<Session>(null);
export function SessionProvider({user,children}:{user:Session;children:React.ReactNode}){return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;}
export default function AccountMenu({returnTo='/'}:{returnTo?:string}){
 const user=useContext(SessionContext);
 if(!user)return <a className="secondary account-login" href={chatGPTSignInPath(returnTo)} target="_top"><LogIn size={15}/>Log in</a>;
 return <details className="account-menu" onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary')?.focus();}}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))e.currentTarget.open=false;}}><summary aria-label="Account and sign-in options"><span className="avatar account-avatar">{user.displayName.slice(0,2).toUpperCase()}</span><span>Account</span><ChevronDown size={13}/></summary><div className="account-popover"><div className="account-identity"><small>Signed in as</small><strong>{user.displayName}</strong><span>{user.email}</span></div><a href={loginPagePath(returnTo)} target="_top"><UserRound size={15}/>Sign-in options</a><a href={logoutToLoginPath(returnTo)} target="_top"><ArrowLeftRight size={15}/>Switch account</a><a className="account-logout" href={logoutToLoginPath(returnTo)} target="_top"><LogOut size={15}/>Log out</a></div></details>;
}
