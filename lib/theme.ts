export type Theme='light'|'dark';
export const themeStorageKey='dantam-theme';
// Run before paint; local preference wins, otherwise follow the device setting.
export const themeInitScript="(()=>{let t;try{t=localStorage.getItem('dantam-theme')}catch{}if(t!=='light'&&t!=='dark')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t})()";
