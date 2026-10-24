import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve('react/jsx-runtime')))).toString('base64');
const themeUrl=compile(readFileSync('lib/theme.ts','utf8'));
const {themeInitScript}=await import(themeUrl);
for(const [saved,systemDark,expected] of [['dark',false,'dark'],['light',true,'light'],[null,true,'dark'],['invalid',false,'light'],['blocked',true,'dark']]){
 const document={documentElement:{dataset:{},style:{}}};vm.runInNewContext(themeInitScript,{document,localStorage:{getItem(){if(saved==='blocked')throw Error('Unavailable');return saved;}},window:{matchMedia:()=>({matches:systemDark})}});assert.equal(document.documentElement.dataset.theme,expected);assert.equal(document.documentElement.style.colorScheme,expected);
}
const {ThemeProvider,ThemeToggle}=await import(compile(readFileSync('app/theme-provider.tsx','utf8').replace("'react'",JSON.stringify(import.meta.resolve('react'))).replace("'lucide-react'",JSON.stringify(import.meta.resolve('lucide-react'))).replace("'@/lib/theme'",JSON.stringify(themeUrl))));
assert.ok(renderToStaticMarkup(createElement(ThemeProvider,null,createElement(ThemeToggle))).includes('Switch to dark theme'));
const {BrandLogo}=await import(compile(readFileSync('app/brand.tsx','utf8')));const brand=renderToStaticMarkup(createElement(BrandLogo));assert.ok(brand.includes('DANTAM'));assert.ok(brand.includes('INTELLIGENCE SYSTEM'));assert.ok(existsSync('public/dantam-mascot.png'));
const luminance=s=>s.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,n)=>a+v*[.2126,.7152,.0722][n],0);
const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
for(const [a,b] of [['142035','ffffff'],['64718a','ffffff'],['edf0fb','191f30'],['a5afc4','191f30'],['ffffff','5b58ff'],['aaa7ff','191f30'],['aeb7d0','0b1023']])assert.ok(ratio(a,b)>=4.5,`Contrast ${a}/${b}: ${ratio(a,b)}`);
console.log('Theme checks passed: saved/system preference, blocked storage fallback, first-paint colors, accessible toggle markup, shared brand and primary text contrast.');
