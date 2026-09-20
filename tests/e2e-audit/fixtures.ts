import {test as base,expect,type Page} from '@playwright/test';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
const requireBackend=createRequire(new URL('../../../backend/package.json',import.meta.url));
const bcrypt=requireBackend('bcryptjs');
export const origin='http://127.0.0.1:3520';
const u=new URL(process.env.DATABASE_URL||'');
if(u.hostname!=='127.0.0.1'||u.port!=='54350'||u.pathname!=='/altitud_2707'||u.username!=='altitud_2707_app')throw new Error('Disposable PWA database only');
export type Fixture={pool:pg.Pool;ids:Record<string,string>;email:(role:string)=>string;password:string;date:string;today:string;tokens:Record<string,string>};
export class LoginPage {constructor(readonly page:Page){} async login(email:string,password:string,destination:string){await this.page.goto(`${origin}/login?returnUrl=${encodeURIComponent(destination)}`);await this.page.getByLabel('Correo electrónico').fill(email);await this.page.getByLabel('Contraseña',{exact:true}).fill(password);await this.page.getByRole('button',{name:'Entrar a mi cuenta'}).click();await expect(this.page).toHaveURL(origin+destination);}}
export class MemberPage {constructor(readonly page:Page){}async bookTomorrow(classId:string){await this.page.goto(origin+'/app/book');await this.page.locator('.member-day-picker button').nth(1).click();await this.page.locator(`[data-class-id="${classId}"]`).getByRole('button',{name:'Reservar',exact:true}).click();await this.page.getByRole('button',{name:'Confirmar reserva',exact:true}).click();await expect(this.page.getByText('Tu lugar está listo.',{exact:true})).toBeVisible();}}
export const test=base.extend<{fixture:Fixture}>({
 fixture:async({request},use)=>{
 const pool=new pg.Pool({connectionString:u.href,max:3});const ids=Object.fromEntries(['admin','client','other','instructor','reception','coach','coachOther','classType','plan','membership','membershipOther','first','second','full','checkinClass','otherClass'].map(k=>[k,randomUUID()]));
 const tag='qa-'+randomUUID().slice(0,8),password='SyntheticPwa123!',email=(role:string)=>`${tag}-${role}@example.invalid`;
 const hash=await bcrypt.hash(password,4),tokens:Record<string,string>={};
 const {rows:[dates]}=await pool.query("SELECT (now() AT TIME ZONE 'America/Mexico_City')::date::text AS today,((now() AT TIME ZONE 'America/Mexico_City')::date+1)::text AS tomorrow");
 const previousBank=(await pool.query("SELECT value FROM system_settings WHERE key='bank_info'")).rows[0];
 try {
  await pool.query("INSERT INTO system_settings(key,value) VALUES('bank_info',$1::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",[JSON.stringify({bank_name:'QA NO TRANSFERIR',account_holder:'QA datos sintéticos',account_number:'00000000000',clabe:'000000000000000000'})]);
  for(const [n,role] of ['admin','client','other','instructor','reception'].entries())await pool.query('INSERT INTO users(id,email,password_hash,phone,display_name,role) VALUES($1,$2,$3,$4,$5,$6)',[ids[role],email(role),hash,'+529'+String(BigInt('0x'+ids[role].replaceAll('-','').slice(0,10))%1000000000n).padStart(9,'0'),`QA ${role}`,role==='other'?'client':role]);
  await pool.query("INSERT INTO instructors(id,user_id,display_name) VALUES($1,$2,'QA coach'),($3,$4,'QA other coach')",[ids.coach,ids.instructor,ids.coachOther,ids.admin]);
  await pool.query("INSERT INTO class_types(id,name,max_capacity) VALUES($1,'QA TRAIN',12)",[ids.classType]);
  await pool.query("INSERT INTO plans(id,name,price,duration_days,class_limit) VALUES($1,'QA 8 clases',1099,30,8)",[ids.plan]);
  for(const who of ['client','other'])await pool.query("INSERT INTO memberships(id,user_id,plan_id,status,classes_remaining,start_date,end_date) VALUES($1,$2,$3,'active',8,$4::date,$4::date+30)",[ids[who==='client'?'membership':'membershipOther'],ids[who],ids.plan,dates.today]);
  for(const [key,time,capacity] of [['first','18:00',12],['second','19:00',12],['full','20:00',1]] as const)await pool.query('INSERT INTO classes(id,class_type_id,instructor_id,date,start_time,end_time,max_capacity) VALUES($1,$2,$3,$4,$5,$5::time+interval\'50 minutes\',$6)',[ids[key],ids.classType,ids.coach,dates.tomorrow,time,capacity]);
  await pool.query("INSERT INTO classes(id,class_type_id,instructor_id,date,start_time,end_time,max_capacity) VALUES($1,$2,$3,$4,'17:00','17:50',12)",[ids.otherClass,ids.classType,ids.coachOther,dates.tomorrow]);
  for(const role of ['admin','client','other','instructor','reception']){const r=await request.post(origin+'/api/auth/login',{data:{email:email(role),password}});expect(r.status()).toBe(200);tokens[role]=(await r.json()).token;}
  const occupied=await request.post(origin+'/api/bookings',{headers:{Authorization:`Bearer ${tokens.other}`},data:{classId:ids.full}});expect(occupied.status()).toBe(201);
  await use({pool,ids,email,password,date:dates.tomorrow,today:dates.today,tokens});
 }finally{
  if(previousBank)await pool.query("UPDATE system_settings SET value=$1::jsonb WHERE key='bank_info'",[JSON.stringify(previousBank.value)]);else await pool.query("DELETE FROM system_settings WHERE key='bank_info'");
  // IDs owned by this fixture only; no broad production cleanup.
  await pool.query('DELETE FROM notification_admin_actions WHERE actor_id=ANY($1::uuid[]) OR notification_id IN (SELECT id FROM notification_outbox WHERE user_id=ANY($1::uuid[]))',[[ids.admin,ids.client,ids.other,ids.instructor,ids.reception]]);
  await pool.query('DELETE FROM notification_outbox WHERE user_id=ANY($1::uuid[])',[[ids.admin,ids.client,ids.other,ids.instructor,ids.reception]]);
  await pool.query('DELETE FROM membership_credit_adjustments WHERE membership_id IN (SELECT id FROM memberships WHERE user_id=ANY($1::uuid[]))',[[ids.client,ids.other]]);
  await pool.query('DELETE FROM admin_actions WHERE admin_user_id=$1',[ids.admin]);
  await pool.query('DELETE FROM financial_notification_outbox WHERE membership_id IN (SELECT id FROM memberships WHERE user_id=ANY($1::uuid[]))',[[ids.client,ids.other]]);
  await pool.query('DELETE FROM payments WHERE user_id=ANY($1::uuid[])',[[ids.client,ids.other]]);
  await pool.query('DELETE FROM booking_credit_ledger WHERE booking_id IN (SELECT id FROM bookings WHERE user_id=ANY($1::uuid[]))',[[ids.client,ids.other]]);
  await pool.query('DELETE FROM bookings WHERE user_id=ANY($1::uuid[])',[[ids.client,ids.other]]);
  await pool.query('DELETE FROM classes WHERE class_type_id=$1',[ids.classType]);
  await pool.query('DELETE FROM orders WHERE user_id=ANY($1::uuid[])',[[ids.client,ids.other]]);
  await pool.query('DELETE FROM memberships WHERE user_id=ANY($1::uuid[])',[[ids.client,ids.other]]);
  await pool.query('DELETE FROM instructors WHERE id=ANY($1::uuid[])',[[ids.coach,ids.coachOther]]);
  await pool.query('DELETE FROM media_assets WHERE owner_id=ANY($1::uuid[])',[[ids.client,ids.other]]);
  await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[[ids.admin,ids.client,ids.other,ids.instructor,ids.reception]]);
  await pool.query('DELETE FROM plans WHERE id=$1',[ids.plan]);await pool.query('DELETE FROM class_types WHERE id=$1',[ids.classType]);await pool.end();
 }
 },
 context:async({browser},use)=>{const context=await browser.newContext({viewport:{width:390,height:844},locale:'es-MX',timezoneId:'America/Mexico_City',reducedMotion:'reduce',serviceWorkers:'block'});await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort('blockedbyclient'));await use(context);await context.close();},
});
export {expect};
