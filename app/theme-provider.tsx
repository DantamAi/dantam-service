'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
import {themeStorageKey,type Theme} from '@/lib/theme';
const ThemeContext=createContext<{theme:Theme;toggle:()=>void}>({theme:'light',toggle:()=>{}});
export function ThemeProvider({children}:{children:React.ReactNode}){
 const [theme,setTheme]=useState<Theme>('light');
 useEffect(()=>{const media=window.matchMedia('(prefers-color-scheme: dark)');const apply=(value:Theme)=>{document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;setTheme(value);};const read=()=>{let saved:string|null=null;try{saved=localStorage.getItem(themeStorageKey);}catch{}apply(saved==='light'||saved==='dark'?saved:media.matches?'dark':'light');};read();const changed=(e:StorageEvent)=>{if(e.key===themeStorageKey||e.key===null)read();};media.addEventListener('change',read);window.addEventListener('storage',changed);return()=>{media.removeEventListener('change',read);window.removeEventListener('storage',changed);};},[]);
 function toggle(){const value=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;try{localStorage.setItem(themeStorageKey,value);}catch{}setTheme(value);}
 return <ThemeContext.Provider value={{theme,toggle}}>{children}</ThemeContext.Provider>;
}
export function ThemeToggle(){const {theme,toggle}=useContext(ThemeContext),label=theme==='dark'?'Switch to light theme':'Switch to dark theme';return <button type="button" className="icon-btn theme-toggle" onClick={toggle} aria-label={label} title={label}>{theme==='dark'?<Sun size={19}/>:<Moon size={19}/>}</button>;}
