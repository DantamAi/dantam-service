export const MAX_EVIDENCE=10*1024*1024;
export function validateEvidence(name:string,bytes:Uint8Array){
 if(!bytes.length||bytes.length>MAX_EVIDENCE)throw new Error('Choose a non-empty file no larger than10MB.');
 const ext=name.toLowerCase().split('.').pop();let mime='';
 const starts=(a:number[])=>a.every((v,i)=>bytes[i]===v);
 if(ext==='png'&&starts([137,80,78,71,13,10,26,10]))mime='image/png';
 if(['jpg','jpeg'].includes(ext||'')&&starts([255,216,255]))mime='image/jpeg';
 if(ext==='webp'&&new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')mime='image/webp';
 if(ext==='pdf'&&new TextDecoder().decode(bytes.slice(0,5))==='%PDF-')mime='application/pdf';
 if(ext==='txt'||ext==='csv'){const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text))throw new Error('Use a UTF-8 text file.');mime=ext==='txt'?'text/plain':'text/csv';}
 if(!mime)throw new Error('Supported files: PNG, JPG, WebP, PDF, TXT and CSV. File content must match its extension.');
 return mime;
}
