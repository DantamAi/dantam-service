import ts from 'typescript';
import {readFileSync} from 'node:fs';
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
export const storageUrl=compile(readFileSync('lib/project-storage.ts','utf8'));
export async function installProjectStorage(db){
 const prepare=db.prepare.bind(db);db.prepare=(sql)=>Object.assign(prepare(sql),{__sql:sql});
 db.batch=async statements=>{await prepare('BEGIN').run();try{const results=[];for(const s of statements)results.push(/^\s*SELECT/i.test(s.__sql)?{...(await s.all()),meta:{changes:0}}:{...(await s.run()),results:[]});await prepare('COMMIT').run();return results;}catch(e){await prepare('ROLLBACK').run();throw e;}};
 for(const sql of readFileSync('drizzle/0005_jittery_penance.sql','utf8').split('--> statement-breakpoint'))if(sql.trim())await prepare(sql).run();
}
