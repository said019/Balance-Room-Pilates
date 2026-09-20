import {test,expect,origin,LoginPage} from './fixtures';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../../../../evidence/pwa/',import.meta.url));
test('L4 RG09: real build media proxy, manifest, missing assets and network-only API service worker',async({browser,request,fixture:f})=>{
 const manifestResponse=await request.get(origin+'/manifest.json');expect(manifestResponse.ok()).toBeTruthy();const manifest=await manifestResponse.json();expect(manifest.display).toBe('standalone');
 for(const icon of manifest.icons){expect(icon.src).toMatch(/^\/api\/media\/path\//);const iconResponse=await request.get(origin+icon.src);expect(iconResponse.status()).toBe(200);expect(iconResponse.headers()['content-type']).toContain('image/');}
 const missing=await request.get(origin+'/brand/not-a-real-file.png');expect(missing.status()).toBe(404);expect(missing.headers()['content-type']||'').not.toContain('text/html');
 const actual=readFileSync(new URL('../../dist/media-migration-manifest.json',import.meta.url),'utf8');const assets=JSON.parse(actual);const files=readdirSync(new URL('../../dist',import.meta.url),{recursive:true}).map(String);expect(files.filter(p=>/\.(png|jpe?g|webp|gif|ico|svg|mp4|mov)$/i.test(p))).toEqual([]);
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const page=await context.newPage();await page.goto(origin+'/');
 await expect.poll(async()=>{try{return await page.evaluate(()=>!!navigator.serviceWorker.controller);}catch{return false;}}).toBeTruthy();
 await page.evaluate(async()=>{await fetch('/api/schedules/public');});
 const cached=await page.evaluate(async()=>{const result:string[]=[];for(const name of await caches.keys())for(const r of await(await caches.open(name)).keys())result.push(r.url);return result;});expect(cached.filter(p=>new URL(p).pathname.startsWith('/api/'))).toEqual([]);
 await context.setOffline(true);const offline=await page.evaluate(async()=>{try{await fetch('/api/schedules/public');return 'cached';}catch{return 'network-error';}});expect(offline).toBe('network-error');await context.setOffline(false);
 writeFileSync(out+'pwa-build-evidence.json',JSON.stringify({manifest,manifestAssets:Array.isArray(assets)?assets.length:assets.assets?.length,missingAsset:missing.status(),mediaBinariesInDist:0,serviceWorkerControlled:true,cacheKeys:cached,offlineAPI:offline,limits:'Chromium browser context only; not installed iOS/Android PWA, not hardware camera, not real Drive account.'},null,2));await context.close();
});
test('A4 A6: anonymous and wrong-role routes never expose admin controls',async({page,fixture:f})=>{
 await page.goto(origin+'/admin/dashboard');await expect(page).toHaveURL(/\/login\?returnUrl=/);
 await new LoginPage(page).login(f.email('client'),f.password,'/app');await page.goto(origin+'/admin/dashboard');await expect(page).toHaveURL(origin+'/app');
 await page.evaluate(()=>{localStorage.clear();});await new LoginPage(page).login(f.email('instructor'),f.password,'/coach');await page.goto(origin+'/admin/dashboard');await expect(page).toHaveURL(origin+'/coach');
});
