import { test, expect, origin, evidenceArea } from './fixtures';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const out=fileURLToPath(new URL(`../../../../evidence/${evidenceArea}/analytics-browser/`,import.meta.url));
mkdirSync(out,{recursive:true});

// Real build, authenticated HTTP and SQL. The shared fixture guards the disposable 54350 database.
test('analytics report labels, inclusive Mexico periods and SQL agree on mobile and desktop',async({browser,request,fixture:f})=>{
 test.setTimeout(150000);
 const cancelledClass=randomUUID(),bookingIds=Array.from({length:6},()=>randomUUID());
 const date=(await f.pool.query("SELECT ($1::date-1)::text AS day",[f.today])).rows[0].day;
 const typeName='QA analytics '+f.ids.classType.slice(0,8),coachName='QA analytics coach '+f.ids.coach.slice(0,8);
 const rows:any[]=[];let invariants:any;
 try {
  await f.pool.query('UPDATE class_types SET name=$2 WHERE id=$1',[f.ids.classType,typeName]);
  await f.pool.query('UPDATE instructors SET display_name=$2 WHERE id=$1',[f.ids.coach,coachName]);
  await f.pool.query("UPDATE classes SET date=$2,status='scheduled',start_time='06:00',end_time='07:00',max_capacity=10 WHERE id=$1",[f.ids.first,date]);
  await f.pool.query("UPDATE classes SET date=$2,status='scheduled',start_time='06:00',end_time='07:00',max_capacity=20 WHERE id=$1",[f.ids.second,date]);
  await f.pool.query("INSERT INTO classes(id,class_type_id,instructor_id,date,start_time,end_time,max_capacity,status) VALUES($1,$2,$3,$4,'07:00','08:00',10,'scheduled')",[cancelledClass,f.ids.classType,f.ids.coach,date]);
  const statuses=['confirmed','checked_in','no_show','waitlist','cancelled','confirmed'];
  const people=[f.ids.client,f.ids.other,f.ids.admin,f.ids.instructor,f.ids.reception,f.ids.client];
  for(let i=0;i<6;i++)await f.pool.query('INSERT INTO bookings(id,user_id,class_id,status,is_free_booking) VALUES($1,$2,$3,$4,true)',[bookingIds[i],people[i],i===5?cancelledClass:f.ids.first,statuses[i]]);
  await f.pool.query("UPDATE classes SET status='completed' WHERE id=$1",[f.ids.first]);
  await f.pool.query("UPDATE classes SET status='cancelled' WHERE id=$1",[cancelledClass]);
  const report=await request.get(origin+`/api/reports/instructors?startDate=${date}&endDate=${f.today}`,{headers:{Authorization:`Bearer ${f.tokens.admin}`}});expect(report.status()).toBe(200);
  const coach=(await report.json()).find((r:any)=>r.id===f.ids.coach);
  expect(Number(coach.total_classes)).toBe(2);expect(Number(coach.completed_classes)).toBe(1);expect(Number(coach.total_students)).toBe(2);expect(Number(coach.avg_occupancy)).toBeCloseTo(100*2/30,8);
  const source=(await f.pool.query("SELECT c.id,c.status,c.max_capacity,count(b.id) FILTER(WHERE b.status IN ('confirmed','checked_in'))::int AS reserved FROM classes c LEFT JOIN bookings b ON b.class_id=c.id WHERE c.class_type_id=$1 AND c.date BETWEEN $2::date AND $3::date GROUP BY c.id ORDER BY c.status",[f.ids.classType,date,f.today])).rows;
  invariants={date,today:f.today,coach,source};
  for(const viewport of [{width:390,height:844},{width:1440,height:960}]){
   const context=await browser.newContext({viewport,locale:'es-MX',timezoneId:'Pacific/Kiritimati',serviceWorkers:'block',reducedMotion:'reduce'});
   await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort('blockedbyclient'));
   await context.addInitScript(token=>localStorage.setItem('altitud2707_token',token),f.tokens.admin);
   const page=await context.newPage();
   // At 23:30 Mexico the viewer calendar is already the following day; the report must stay on Mexico's date.
   await page.clock.setFixedTime(new Date(f.today+'T23:30:00-06:00'));
   let errors:string[]=[],failed:any[]=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400)failed.push({path:new URL(r.url()).pathname,status:r.status()});});
   for(const endpoint of ['classes','instructors','retention']){
    errors=[];failed=[];
    const received=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/reports/${endpoint}`);
    await page.goto(origin+`/admin/reports/${endpoint}`);const initialResponse=await received;await page.waitForLoadState('networkidle');
    if(endpoint==='classes'){
     await expect(page.getByText('Reservas por sesión, agrupadas por día de la semana',{exact:true})).toBeVisible();
     await expect(page.getByText('Ocupación por horario',{exact:true})).toBeVisible();
     await expect(page.getByText('asistentes en promedio',{exact:false})).toHaveCount(0);
    }else if(endpoint==='instructors'){
     await expect(page.getByText('Clases finalizadas y ocupación por coach. El conteo no calcula honorarios ni comisiones.',{exact:true})).toBeVisible();
     const card=page.locator('.bg-card').filter({has:page.getByRole('heading',{name:coachName,exact:true})});
     await expect(card.getByText('Finalizadas',{exact:true}).locator('..')).toHaveText('Finalizadas1');
     await expect(card.getByText('Reservas',{exact:true}).locator('..')).toHaveText('Reservas2');
    }else{
     await expect(page.getByText('Asistieron',{exact:true})).toBeVisible();
     await expect(page.getByText('Tasa de Renovación (90 días)',{exact:true})).toBeVisible();
    }
    for(const [days,label]of [[30,'Últimos 30 días'],[7,'Últimos 7 días'],[90,'Últimos 3 meses']] as const){
     let result=initialResponse;
     if(days!==30){const response=page.waitForResponse(r=>new URL(r.url()).pathname===`/api/reports/${endpoint}`);
      await page.getByRole('combobox',{name:'Periodo del reporte'}).click();await page.getByRole('option',{name:label,exact:true}).click();result=await response;}
     expect(result.status()).toBe(200);const url=new URL(result.url());
     const expectedStart=(await f.pool.query('SELECT ($1::date-$2::int+1)::text AS day',[f.today,days])).rows[0].day;
     expect(url.searchParams.get('startDate')).toBe(expectedStart);expect(url.searchParams.get('endDate')).toBe(f.today);
     const payload=await result.json();
     if(endpoint==='classes'){
      const type=payload.byType.find((r:any)=>r.name===typeName);expect(Number(type.total_classes)).toBe(2);expect(Number(type.total_bookings)).toBe(2);
      invariants.rawClassType=type;
      const expected=(await f.pool.query("SELECT count(b.id) FILTER(WHERE b.status IN ('confirmed','checked_in'))::int AS reserved FROM classes c LEFT JOIN bookings b ON c.id=b.class_id WHERE c.date BETWEEN $1::date AND $2::date AND c.status<>'cancelled'",[expectedStart,f.today])).rows[0].reserved;
      const capacity=(await f.pool.query("SELECT coalesce(sum(max_capacity),0)::int AS total FROM classes WHERE date BETWEEN $1::date AND $2::date AND status<>'cancelled'",[expectedStart,f.today])).rows[0].total;
      expect(payload.occupancyRate).toBe(capacity?Math.round(expected/capacity*100):0);
     }
     rows.push({width:viewport.width,endpoint,days,startDate:expectedStart,endDate:f.today,status:result.status()});
    }
    await page.waitForLoadState('networkidle');
    const dimensions=await page.evaluate(()=>({viewport:innerWidth,content:document.documentElement.scrollWidth,viewerDate:new Date().toLocaleDateString('en-CA'),headings:[...document.querySelectorAll('h1,h2,h3')].map(h=>h.textContent)}));
    expect(dimensions.content).toBeLessThanOrEqual(viewport.width+1);expect(errors).toEqual([]);expect(failed).toEqual([]);
    rows.push({width:viewport.width,endpoint,...dimensions,errors:[...errors],failed:[...failed]});
    await page.screenshot({path:out+`${endpoint}-${viewport.width}.png`,fullPage:true});
   }
   await context.close();
   // Screenshots use a normal clock so chart animations are not frozen by the date-boundary assertion.
   const captureContext=await browser.newContext({viewport,locale:'es-MX',timezoneId:'America/Mexico_City',serviceWorkers:'block',reducedMotion:'reduce'});
   await captureContext.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort('blockedbyclient'));
   await captureContext.addInitScript(token=>localStorage.setItem('altitud2707_token',token),f.tokens.admin);
   const capture=await captureContext.newPage();
   const captureErrors:string[]=[],captureFailed:any[]=[];
   capture.on('pageerror',e=>captureErrors.push(e.message));
   capture.on('response',r=>{if(r.status()>=400)captureFailed.push({path:new URL(r.url()).pathname,status:r.status()});});
   for(const endpoint of ['classes','instructors','retention']){
    await capture.goto(origin+`/admin/reports/${endpoint}`);await capture.waitForLoadState('networkidle');
    if(endpoint==='classes'){
     await expect.poll(()=>capture.locator('.recharts-bar-rectangle path').count(),{timeout:6000}).toBeGreaterThan(0);
     await expect.poll(()=>capture.locator('.recharts-pie-sector path').count(),{timeout:6000}).toBeGreaterThan(0);
     // Allow Recharts' 1500 ms JavaScript animation to finish before saving visual evidence.
     await capture.waitForTimeout(1600);
     rows.push({width:viewport.width,endpoint,normalClock:true,barPaths:await capture.locator('.recharts-bar-rectangle path').count(),pieSectors:await capture.locator('.recharts-pie-sector path').count()});
     const chartGeometry=await capture.locator('.recharts-bar-rectangle path,.recharts-pie-sector path').evaluateAll(paths=>paths.map(path=>({d:path.getAttribute('d'),box:path.getBoundingClientRect().toJSON(),fill:getComputedStyle(path).fill,opacity:getComputedStyle(path).opacity,visibility:getComputedStyle(path).visibility})));
     for(const shape of chartGeometry){expect(shape.box.width).toBeGreaterThan(0);expect(shape.box.height).toBeGreaterThan(0);expect(shape.visibility).toBe('visible');expect(Number(shape.opacity)).toBeGreaterThan(0);}
     rows.push({width:viewport.width,chartGeometry});
     await capture.screenshot({path:out+`classes-${viewport.width}-viewport.png`});
    }
    expect(captureErrors).toEqual([]);expect(captureFailed).toEqual([]);
    await capture.screenshot({path:out+`${endpoint}-${viewport.width}.png`,fullPage:true});
   }
   await captureContext.close();
  }
 }finally{
  writeFileSync(out+'results.json',JSON.stringify({invariants,results:rows},null,2));
  await f.pool.query('DELETE FROM bookings WHERE id=ANY($1::uuid[])',[bookingIds]);
  await f.pool.query('DELETE FROM classes WHERE id=$1',[cancelledClass]);
 }
});
