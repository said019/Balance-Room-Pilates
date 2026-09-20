import {test,expect,origin,LoginPage} from './fixtures';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../../../../evidence/pwa/',import.meta.url));mkdirSync(out,{recursive:true});
test('all mounted admin/member routes: real auth roles, console, network and mobile width inventory',async({browser,request,fixture:f})=>{
 test.setTimeout(180000);
 const booked=await request.post(origin+'/api/bookings',{headers:{Authorization:`Bearer ${f.tokens.client}`},data:{classId:f.ids.first}});expect(booked.status()).toBe(201);
 const booking=(await f.pool.query('SELECT id FROM bookings WHERE class_id=$1 AND user_id=$2',[f.ids.first,f.ids.client])).rows[0].id;
 const orderR=await request.post(origin+'/api/orders',{headers:{Authorization:`Bearer ${f.tokens.client}`},data:{plan_id:f.ids.plan,payment_method:'cash'}});
 const order=orderR.ok()?(await orderR.json()).id:null;
 const source=readFileSync(new URL('../../src/App.tsx',import.meta.url),'utf8');
 const routes=[...new Set([...source.matchAll(/<Route path="([^"]+)"/g)].map(m=>m[1]))].filter(p=>p.startsWith('/admin')||p.startsWith('/app')||p.startsWith('/coach')).filter(p=>!p.includes('*'));
 const results:any[]=[];
 for(const role of ['admin','client','instructor']){
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'es-MX',timezoneId:'America/Mexico_City',serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort('blockedbyclient'));
  await context.addInitScript(token=>localStorage.setItem('altitud2707_token',token),f.tokens[role]);
  const page=await context.newPage();let errors:string[]=[],failed:any[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push({path:new URL(r.url()).pathname,status:r.status()});});
  for(const route of routes.filter(p=>role==='admin'?p.startsWith('/admin'):role==='instructor'?p.startsWith('/coach'):p.startsWith('/app'))){
   if(route.includes(':orderId')&&!order){results.push({role,route,skipped:'No order fixture: HTTP '+orderR.status()});continue;}
   const path=route.replace(':userId',f.ids.client).replace(':bookingId',booking).replace(':classId',f.ids.first).replace(':orderId',order||'').replace(':id',route.includes('instructors')?f.ids.coach:f.ids.client);
   errors=[];failed=[];await page.goto(origin+path);await page.waitForLoadState('networkidle');
   const state=await page.evaluate(()=>({url:location.pathname,title:document.querySelector('h1')?.textContent||document.querySelector('h2')?.textContent,text:document.body.innerText.slice(0,250),width:document.documentElement.scrollWidth,viewport:innerWidth,inputs:[...document.querySelectorAll('input,select,textarea')].map(el=>getComputedStyle(el).fontSize)}));
   results.push({role,route,path,...state,errors:[...errors],failed:[...failed]});
   if(errors.length||failed.length||state.width>state.viewport+1)await page.screenshot({path:out+'route-'+role+'-'+path.replaceAll('/','_')+'.png',fullPage:true});
  }
  await context.close();
 }
 writeFileSync(out+'route-inventory.json',JSON.stringify(results,null,2));
 // Every failure is recorded for root-cause correction; the report never equates document 200 with pass.
 expect(results.filter(r=>r.errors?.length)).toEqual([]);
 expect(results.filter(r=>r.failed?.some((x:any)=>x.status>=500))).toEqual([]);
 expect(results.filter(r=>r.width>r.viewport+1)).toEqual([]);
 if(order)await f.pool.query('DELETE FROM orders WHERE id=$1',[order]);
});
test('coach opens own assigned classes, rejects another coach and checks in without another debit',async({page,request,fixture:f})=>{
 const bookingR=await request.post(origin+'/api/bookings',{headers:{Authorization:`Bearer ${f.tokens.client}`},data:{classId:f.ids.first}});expect(bookingR.status()).toBe(201);
 await f.pool.query("UPDATE classes SET date=((now()+interval '5 minutes') AT TIME ZONE 'America/Mexico_City')::date,start_time=((now()+interval '5 minutes') AT TIME ZONE 'America/Mexico_City')::time,end_time=((now()+interval '55 minutes') AT TIME ZONE 'America/Mexico_City')::time WHERE id=$1",[f.ids.first]);
 await new LoginPage(page).login(f.email('instructor'),f.password,'/coach');
 const list=page.getByRole('region',{name:'Mis sesiones asignadas'});await expect(list).toBeVisible();
 await expect(list.getByRole('button')).toHaveCount(3);
 await list.getByRole('button').filter({hasText:f.today}).click();
 await expect(page.getByText('QA client',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Registrar asistencia'}).click();await expect(page.getByText('Asistencia registrada',{exact:true})).toBeVisible();
 const row=(await f.pool.query('SELECT status,credits_debited FROM bookings WHERE class_id=$1 AND user_id=$2',[f.ids.first,f.ids.client])).rows[0];expect(row.status).toBe('checked_in');expect(row.credits_debited).toBe(1);expect((await f.pool.query('SELECT classes_remaining FROM memberships WHERE id=$1',[f.ids.membership])).rows[0].classes_remaining).toBe(7);
 const denied=await request.get(origin+`/api/instructors/${f.ids.coach}/classes/${f.ids.otherClass}/attendees`,{headers:{Authorization:`Bearer ${f.tokens.instructor}`}});expect(denied.status()).toBe(404); // The scoped API conceals another coach's class, rather than exposing its existence.
 writeFileSync(out+'coach-invariants.json',JSON.stringify({row,credits:7,otherCoachAccess:denied.status()},null,2));await page.screenshot({path:out+'coach-390.png',fullPage:true});
});
