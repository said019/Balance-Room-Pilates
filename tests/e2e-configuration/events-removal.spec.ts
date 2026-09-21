import {test,expect,origin,LoginPage} from './fixtures';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {format,isSameWeek,parseISO} from 'date-fns';
import {es} from 'date-fns/locale';
const out=fileURLToPath(new URL('../../../../evidence/remove-events/',import.meta.url));mkdirSync(out,{recursive:true});
function observe(page:any){const eventRequests:string[]=[],errors:string[]=[],failures:any[]=[];page.on('request',(r:any)=>{const p=new URL(r.url()).pathname;if(/^\/api\/events(?:\/|$)/.test(p))eventRequests.push(p)});page.on('pageerror',(e:any)=>errors.push(e.message));page.on('response',(r:any)=>{if(r.status()>=400)failures.push({path:new URL(r.url()).pathname,status:r.status()})});return {eventRequests,errors,failures};}
async function noEvents(page:any){await page.waitForLoadState('networkidle');await expect(page.locator('a[href*="/events"]')).toHaveCount(0);await expect(page.getByRole('link',{name:/eventos/i})).toHaveCount(0);await expect(page.getByRole('button',{name:/eventos/i})).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);}
async function financialSnapshot(f:any){return {memberships:(await f.pool.query('SELECT id,status,classes_remaining,end_date FROM memberships WHERE user_id=ANY($1::uuid[]) ORDER BY id',[[f.ids.client,f.ids.other]])).rows,bookings:(await f.pool.query('SELECT id,class_id,status,credits_debited,credits_refunded FROM bookings WHERE user_id=ANY($1::uuid[]) ORDER BY id',[[f.ids.client,f.ids.other]])).rows,totals:(await f.pool.query('SELECT (SELECT count(*)::int FROM payments) AS payments,(SELECT count(*)::int FROM orders) AS orders,(SELECT count(*)::int FROM booking_credit_ledger) AS ledger')).rows[0]};}
test('admin dashboard and calendar remove events UI/queries; legacy event URLs keep regular classes and history',async({page,fixture:f})=>{
 const observed=observe(page),before=await financialSnapshot(f),visited:string[]=[];
 await new LoginPage(page).login(f.email('admin'),f.password,'/admin/dashboard');await noEvents(page);await expect(page.getByRole('heading',{name:'Resumen de hoy'})).toBeVisible();await expect(page.getByText('Eventos pendientes')).toHaveCount(0);visited.push('/admin/dashboard');await page.screenshot({path:out+'dashboard-390.png',fullPage:true});
 for(const legacy of ['/admin/events','/admin/events/old-event']){await page.goto(origin+legacy);await expect(page).toHaveURL(origin+'/admin/calendar');await noEvents(page);visited.push(legacy);}
 // The calendar displays Sunday–Saturday, so tomorrow requires the next week only across that boundary.
 if(!isSameWeek(parseISO(f.today),parseISO(f.date),{weekStartsOn:0})){await page.getByRole('button',{name:'Semana siguiente',exact:true}).click();await page.waitForLoadState('networkidle');}
 await page.getByRole('button',{name:format(parseISO(f.date),"EEEE d 'de' MMMM",{locale:es}),exact:true}).click();
 await expect(page.getByRole('button').filter({hasText:'18:00'}).filter({hasText:'QA TRAIN'})).toBeVisible();await page.screenshot({path:out+'calendar-390.png',fullPage:true});
 await page.setViewportSize({width:1440,height:900});await page.goto(origin+'/admin/calendar');await noEvents(page);await page.screenshot({path:out+'calendar-1440.png',fullPage:true});
 const after=await financialSnapshot(f);expect(after).toEqual(before);expect(observed).toEqual({eventRequests:[],errors:[],failures:[]});writeFileSync(out+'admin-navigation.json',JSON.stringify({visited,observed,before,after,regularClassVisible:true,historyUnchanged:true},null,2));
});
test('member and preview event URLs redirect to their home without event links or API requests',async({page,fixture:f})=>{
 const observed=observe(page),before=await financialSnapshot(f),visited:string[]=[];
 await new LoginPage(page).login(f.email('client'),f.password,'/app');await noEvents(page);visited.push('/app');
 for(const legacy of ['/app/events','/app/events/old-event']){await page.goto(origin+legacy);await expect(page).toHaveURL(origin+'/app');await noEvents(page);visited.push(legacy);}
 await page.screenshot({path:out+'member-390.png',fullPage:true});await page.evaluate(()=>localStorage.clear());
 for(const legacy of ['/app/preview/events','/app/preview/events/old-event']){await page.goto(origin+legacy);await expect(page).toHaveURL(origin+'/app/preview');await noEvents(page);visited.push(legacy);}
 const after=await financialSnapshot(f);expect(after).toEqual(before);expect(observed).toEqual({eventRequests:[],errors:[],failures:[]});writeFileSync(out+'member-navigation.json',JSON.stringify({visited,observed,before,after,historyUnchanged:true,previewAnonymous:true},null,2));
});
