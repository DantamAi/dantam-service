import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const src=ts.transpileModule(readFileSync('lib/auth-paths.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {safeRelativeReturnPath:safe,chatGPTSignInPath:login,chatGPTSignOutPath:logout,loginPagePath,logoutToLoginPath}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
for(const bad of ['https://other.test/','//other.test/','javascript:alert(1)','/\\other.test','/signin-with-chatgpt','/signout-with-chatgpt','/callback?code=anything',null,42])assert.equal(safe(bad),'/');
for(const path of ['/','/projects','/access','/projects?view=gantt#scope']){
 assert.equal(new URL(login(path),'https://app.local').searchParams.get('return_to'),path);
 const signout=new URL(logoutToLoginPath(path),'https://app.local');assert.equal(signout.pathname,'/signout-with-chatgpt');
 const destination=new URL(signout.searchParams.get('return_to'),'https://app.local');assert.equal(destination.pathname,'/login');assert.equal(destination.searchParams.get('returnTo'),path);
}
assert.equal(loginPagePath('/login?returnTo=/login'),'/login?returnTo=%2F');assert.equal(new URL(logout('https://other.test'),'https://app.local').searchParams.get('return_to'),'/');
console.log('Auth links use platform routes, retain workspace destinations and reject external/reserved return paths.');
