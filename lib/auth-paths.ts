/** Sites owns the auth routes. Links must navigate the top-level page. */
export function safeRelativeReturnPath(value:unknown):string{
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//'))return '/';
 let url:URL;try{url=new URL(value,'https://app.local');}catch{return '/';}
 if(url.origin!=='https://app.local'||['/signin-with-chatgpt','/signout-with-chatgpt','/callback'].includes(url.pathname))return '/';
 return url.pathname+url.search+url.hash;
}
export function chatGPTSignInPath(returnTo:string){return '/signin-with-chatgpt?return_to='+encodeURIComponent(safeRelativeReturnPath(returnTo));}
export function chatGPTSignOutPath(returnTo='/'){return '/signout-with-chatgpt?return_to='+encodeURIComponent(safeRelativeReturnPath(returnTo));}
export function loginPagePath(returnTo='/'){const safe=safeRelativeReturnPath(returnTo);return '/login?returnTo='+encodeURIComponent(new URL(safe,'https://app.local').pathname==='/login'?'/':safe);}
export function logoutToLoginPath(returnTo='/'){return chatGPTSignOutPath(loginPagePath(returnTo));}
