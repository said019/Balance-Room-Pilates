import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { Plugin } from 'vite';
const media=/\.(?:png|jpe?g|webp|gif|avif|svg|mp4|webm|mov)$/i;
const walk=(root:string):string[]=>readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(root,entry.name)):[path.join(root,entry.name)]);
/** Production URLs resolve the DB catalogue. Source originals are never removed. */
export function driveMediaPlugin(apiBase='/api'):Plugin {
 let root='';let out='';
 const prefix=apiBase.replace(/\/$/,'')+'/media/path';
 const replace=(source:string)=>source.replace(/(["'`])\/brand\/(?!fonts\/)/g,`$1${prefix}/brand/`);
 return {name:'drive-media-catalog',apply:'build',enforce:'pre',
  configResolved(config){root=config.root;out=path.resolve(root,config.build.outDir);},
  transform(source,id){if(/\.[jt]sx?$/.test(id)&&!id.includes('node_modules'))return replace(source);},
  transformIndexHtml(html){return replace(html);},
  closeBundle(){
   const publicRoot=path.join(root,'public');
   const manifest=walk(publicRoot).filter(file=>media.test(file)).map(file=>({asset_key:'/'+path.relative(publicRoot,file).split(path.sep).join('/'),sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),byte_size:readFileSync(file).length}));
   writeFileSync(path.join(out,'media-migration-manifest.json'),JSON.stringify(manifest,null,2));
   for(const file of walk(out)) {
    if(media.test(file)){rmSync(file);continue;}
    if(file.endsWith('.json')&&!file.endsWith('media-migration-manifest.json'))writeFileSync(file,replace(readFileSync(file,'utf8')));
   }
  }
 };
}
