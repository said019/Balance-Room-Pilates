import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { Plugin } from 'vite';
const media=/\.(?:ico|png|jpe?g|webp|gif|avif|svg|mp4|webm|mov)$/i;
const walk=(root:string):string[]=>readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(root,entry.name)):[path.join(root,entry.name)]);
const escape=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
/** Production URLs resolve DB catalogue. Originals and fonts are never removed. */
export function driveMediaPlugin(apiBase='/api'):Plugin {
 let root='';let out='';let keys:string[]=[];
 const prefix=apiBase.replace(/\/$/,'')+'/media/path';
 const replace=(source:string)=>{
  // Handles dynamic brand templates. Font URLs are deliberately excluded.
  let result=source.replace(/(["'`(])\/brand\/(?!fonts\/)/g,`$1${prefix}/brand/`);
  for(const key of keys)result=result.replace(new RegExp(`(["'\\x60(=\\s])${escape(key)}(?=["'\\x60)?#\\s>]|$)`,'g'),`$1${prefix}${key}`);
  return result;
 };
 return {name:'drive-media-catalog',apply:'build',enforce:'pre',
  configResolved(config){root=config.root;out=path.resolve(root,config.build.outDir);const publicRoot=path.join(root,'public');keys=walk(publicRoot).filter(file=>media.test(file)).map(file=>'/'+path.relative(publicRoot,file).split(path.sep).join('/'));},
  transform(source,id){if(/\.[jt]sx?$/.test(id)&&!id.includes('node_modules'))return replace(source);},
  transformIndexHtml(html){return replace(html);},
  closeBundle(){
   const publicRoot=path.join(root,'public');
   const manifest=keys.map(key=>{const bytes=readFileSync(path.join(publicRoot,key.slice(1)));return {asset_key:key,sha256:createHash('sha256').update(bytes).digest('hex'),byte_size:bytes.length};});
   writeFileSync(path.join(out,'media-migration-manifest.json'),JSON.stringify(manifest,null,2));
   for(const file of walk(out)) {
    if(media.test(file)){rmSync(file);continue;}
    if(!/\.(?:html|css|js|json|webmanifest)$/i.test(file)||file.endsWith('media-migration-manifest.json'))continue;
    let text=replace(readFileSync(file,'utf8'));
    if(file.endsWith(path.join('brand','icons','index.html')))text=text.replace(/(["'`])(assets|svg)\//g,`$1${prefix}/brand/icons/$2/`);
    writeFileSync(file,text);
   }
  }
 };
}
