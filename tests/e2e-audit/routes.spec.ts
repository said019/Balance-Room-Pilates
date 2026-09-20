import {test,expect,origin,evidenceArea,LoginPage} from './fixtures';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL(`../../../../evidence/${evidenceArea}/`,import.meta.url));mkdirSync(out,{recursive:true});
const routeSource=readFileSync(new URL('../../src/App.tsx',import.meta.url),'utf8');
const mountedRoutes=[...new Set([...routeSource.matchAll(/<Route path="([^"]+)"/g)].map(m=>m[1]))].filter(p=>!p.includes('*'));
const routeGroups=['admin','client','instructor'].flatMap(role=>{
 const routes=mountedRoutes.filter(p=>role==='admin'?p.startsWith('/admin'):role==='instructor'?p.startsWith('/coach'):p.startsWith('/app'));
 return Array.from({length:Math.ceil(routes.length/12)},(_,index)=>({role,index,routes:routes.slice(index*12,(index+1)*12)}));
});
// Keep bounded chunks and checkpoint each visited route: total inventory cost is not a page-level SLO.
for(const group of routeGroups)test(`all mounted admin/member routes: ${group.role} block ${group.index+1}`,async({browser,request,fixture:f})=>{
 test.setTimeout(180000);
 const booked=await request.post(origin+'/api/bookings',{headers:{Authorization:`Bearer ${f.tokens.client}`},data:{classId:f.ids.first}});expect(booked.status()).toBe(201);
 const booking=(await f.pool.query('SELECT id FROM bookings WHERE class_id=$1 AND user_id=$2',[f.ids.first,f.ids.client])).rows[0].id;
 const orderR=await request.post(origin+'/api/orders',{headers:{Authorization:`Bearer ${f.tokens.client}`},data:{plan_id:f.ids.plan,payment_method:'cash'}});expect(orderR.status()).toBe(201);
 const order=(await orderR.json()).id;
 const results:any[]=[];const partial=out+`route-inventory-${group.role}-${group.index+1}.json`;
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'es-MX',timezoneId:'America/Mexico_City',serviceWorkers:'block'});
 try {
  await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort('blockedbyclient'));
  await context.addInitScript(token=>localStorage.setItem('altitud2707_token',token),f.tokens[group.role]);
  const page=await context.newPage();let errors:string[]=[],failed:any[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push({path:new URL(r.url()).pathname,status:r.status()});});
  for(const route of group.routes){
   const path=route.replace(':userId',f.ids.client).replace(':bookingId',booking).replace(':classId',f.ids.first).replace(':orderId',order).replace(':id',route.includes('instructors')?f.ids.coach:f.ids.client);
   errors=[];failed=[];const started=Date.now();await page.goto(origin+path);await page.waitForLoadState('networkidle');
   const state=await page.evaluate(()=>({url:location.pathname,title:document.querySelector('h1')?.textContent||document.querySelector('h2')?.textContent,text:document.body.innerText.slice(0,250),width:document.documentElement.scrollWidth,viewport:innerWidth,inputs:[...document.querySelectorAll('input,select,textarea')].map(el=>getComputedStyle(el).fontSize)}));
   results.push({role:group.role,route,path,...state,observedLoadMs:Date.now()-started,errors:[...errors],failed:[...failed]});
   writeFileSync(partial,JSON.stringify({expectedRoutes:group.routes,results},null,2));
   if(errors.length||failed.length||state.width>state.viewport+1)await page.screenshot({path:out+'route-'+group.role+'-'+path.replaceAll('/','_')+'.png',fullPage:true});
  }
  expect(results).toHaveLength(group.routes.length);
  expect(results.filter(r=>r.errors?.length)).toEqual([]);
  expect(results.filter(r=>r.failed?.length)).toEqual([]);
  expect(results.filter(r=>r.width>r.viewport+1)).toEqual([]);
 }finally{
  writeFileSync(partial,JSON.stringify({expectedRoutes:group.routes,results},null,2));
  await context.close();await f.pool.query('DELETE FROM orders WHERE id=$1',[order]);
 }
});
test('J1 J3 F3 I7: coach opens own assigned classes, rejects another coach and checks in without another debit',async({page,request,fixture:f})=>{
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
