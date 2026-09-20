import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {driveMediaPlugin} from './drive-media';
const root=mkdtempSync(path.join(tmpdir(),'altitud-media-plugin-'));
try {
 for(const folder of ['public/images','public/brand/fonts','dist/images','dist/brand/fonts'])mkdirSync(path.join(root,folder),{recursive:true});
 for(const dir of ['public','dist']){
  writeFileSync(path.join(root,dir,'favicon.ico'),Buffer.from([0,0,1,0]));
  writeFileSync(path.join(root,dir,'images/cover.png'),Buffer.from([137,80,78,71]));
  writeFileSync(path.join(root,dir,'brand/fonts/font.ttf'),'font-unchanged');
 }
 writeFileSync(path.join(root,'dist/sw.js'),"const PRECACHE=['/favicon.ico','/images/cover.png','/brand/fonts/font.ttf'];");
 writeFileSync(path.join(root,'dist/site.css'),"a{background:url(/images/cover.png)}b{background:url('/favicon.ico')}@font-face{src:url('/brand/fonts/font.ttf')}");
 writeFileSync(path.join(root,'dist/index.html'),'<img src="/images/cover.png"><link rel="icon" href="/favicon.ico">');
 const plugin=driveMediaPlugin('/api') as any;plugin.configResolved({root,build:{outDir:'dist'}});plugin.closeBundle();
 assert.equal(readdirSync(path.join(root,'dist')).includes('favicon.ico'),false,'ICO must not ship locally');
 for(const file of ['sw.js','site.css','index.html']){
  const body=readFileSync(path.join(root,'dist',file),'utf8');assert.ok(body.includes('/api/media/path/'),'Every copied text surface must resolve Drive');
  assert.ok(!body.includes("'/favicon.ico'")&&!body.includes('"/favicon.ico"'));
  assert.ok(!body.includes('url(/images/cover.png)'));
 }
 assert.equal(readFileSync(path.join(root,'dist/brand/fonts/font.ttf'),'utf8'),'font-unchanged');
 assert.equal(JSON.parse(readFileSync(path.join(root,'dist/media-migration-manifest.json'),'utf8')).length,2);
 console.log('PASS root ICO, non-brand images, service worker, CSS, HTML, fonts unchanged');
}finally{rmSync(root,{recursive:true,force:true});}
