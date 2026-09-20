import {test,expect,origin,LoginPage} from './fixtures';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL('../../../../evidence/brandcleanup/',import.meta.url));
mkdirSync(out,{recursive:true});
const retiredPrice=/\$(?:100|190|500|649|1,099|1,299|1,399|1,599)(?:\D|$)/;
async function overflow(page:any){expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth)).toBe(false);}

test('live catalog: empty/error states never invent or regenerate plans',async({page,fixture:f})=>{
 const states=(await f.pool.query('SELECT id,is_active FROM plans ORDER BY id')).rows;
 const membershipBefore=(await f.pool.query('SELECT * FROM memberships WHERE id=$1',[f.ids.membership])).rows[0];
 const methods:string[]=[];page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/plans'))methods.push(r.method())});
 try{
  await f.pool.query('UPDATE plans SET is_active=false WHERE is_active');
  const countBefore=Number((await f.pool.query('SELECT count(*) FROM plans')).rows[0].count);
  for(const route of ['/','/pricing']){
   await page.goto(origin+route);await expect(page.getByText('Los paquetes se publicarán aquí cuando el studio los habilite.')).toBeVisible();
   await expect(page.locator('body')).not.toContainText(retiredPrice);await overflow(page);
  }
  await page.screenshot({path:out+'catalog-empty-390.png',fullPage:true});
  await new LoginPage(page).login(f.email('client'),f.password,'/app/checkout');
  await expect(page.getByText(/Los paquetes se habilitarán aquí cuando estén disponibles/)).toBeVisible();
  await expect(page.locator('body')).not.toContainText(retiredPrice);
  await expect(page.getByRole('button',{name:/Crear orden/})).toHaveCount(0);
  await page.route('**/api/plans',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Falla sintética del catálogo'})}));
  await page.goto(origin+'/pricing');await expect(page.getByText('No pudimos cargar los paquetes disponibles.')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(retiredPrice);
  await page.screenshot({path:out+'catalog-error-390.png',fullPage:true});
  await page.unroute('**/api/plans');await page.getByRole('button',{name:'Volver a intentar'}).click();
  await expect(page.getByText('Los paquetes se publicarán aquí cuando el studio los habilite.')).toBeVisible();
  const countAfter=Number((await f.pool.query('SELECT count(*) FROM plans')).rows[0].count);
  expect(countAfter).toBe(countBefore);expect(methods.every(m=>m==='GET')).toBe(true);
  expect((await f.pool.query('SELECT * FROM memberships WHERE id=$1',[f.ids.membership])).rows[0]).toEqual(membershipBefore);
  writeFileSync(out+'catalog-empty-error.json',JSON.stringify({countBefore,countAfter,planMethods:methods,membershipUnchanged:true,errorWasSynthetic503:true},null,2));
 }finally{for(const row of states)await f.pool.query('UPDATE plans SET is_active=$2 WHERE id=$1',[row.id,row.is_active]);}
});

test('catalog review uses current DB price, editor and history-safe deactivation; retired cannot reactivate',async({page,request,fixture:f})=>{
 const states=(await f.pool.query('SELECT id,is_active FROM plans ORDER BY id')).rows;
 const errors:string[]=[],failures:any[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push({url:new URL(r.url()).pathname,status:r.status()})});
 const customName='Ritmo del studio · catálogo de prueba';
 try{
  await f.pool.query('UPDATE plans SET is_active=false WHERE id<>$1',[f.ids.plan]);
  await f.pool.query('UPDATE plans SET name=$2,price=987,duration_days=27,class_limit=7 WHERE id=$1',[f.ids.plan,customName]);
  await f.pool.query("INSERT INTO catalog_plan_review(plan_id,status,reason,snapshot) VALUES($1,'pending','Origen de fixture no confirmado',$2::jsonb)",[f.ids.plan,JSON.stringify({name:'Nombre previo',price:750})]);
  const memberBefore=(await f.pool.query('SELECT * FROM memberships WHERE id=$1',[f.ids.membership])).rows[0];
  for(const route of ['/','/pricing']){
   await page.goto(origin+route);await expect(page.getByRole('heading',{name:customName}).or(page.getByRole('rowheader',{name:new RegExp(customName)}))).toBeVisible();await expect(page.locator('body')).toContainText('$987');await overflow(page);
  }
  await new LoginPage(page).login(f.email('client'),f.password,'/app/checkout');
  await expect(page.getByText(customName,{exact:true})).toBeVisible();await expect(page.locator('body')).toContainText('$987');await expect(page.locator('body')).toContainText('27 días');
  await page.evaluate(()=>localStorage.clear());await new LoginPage(page).login(f.email('admin'),f.password,'/admin/plans');
  const review=page.getByRole('region',{name:'Planes por revisar'});
  await expect(review.getByText(customName,{exact:true})).toBeVisible();await expect(review).toContainText('$987');await expect(review).toContainText('27 días');await expect(review).not.toContainText('Nombre previo');
  for(const width of [390,1440]){await page.setViewportSize({width,height:900});await overflow(page);await page.screenshot({path:out+`catalog-review-${width}.png`,fullPage:true});}
  await review.getByRole('button',{name:'Revisar '+customName}).click();const dialog=page.getByRole('dialog');
  await expect(dialog.getByLabel('Nombre',{exact:true})).toHaveValue(customName);await expect(dialog.getByLabel('Precio (MXN)',{exact:true})).toHaveValue('987');
  await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();
  expect((await f.pool.query('SELECT * FROM memberships WHERE id=$1',[f.ids.membership])).rows[0]).toEqual(memberBefore);
  await page.getByRole('button',{name:'Acciones de '+customName}).click();page.once('dialog',d=>d.accept());
  await page.getByRole('menuitem',{name:'Desactivar',exact:true}).click();await expect(review.getByText('Inactivo',{exact:true})).toBeVisible();
  expect((await f.pool.query('SELECT is_active FROM plans WHERE id=$1',[f.ids.plan])).rows[0].is_active).toBe(false);
  expect((await f.pool.query('SELECT * FROM memberships WHERE id=$1',[f.ids.membership])).rows[0]).toEqual(memberBefore);
  expect((await f.pool.query('SELECT status FROM catalog_plan_review WHERE plan_id=$1',[f.ids.plan])).rows[0].status).toBe('pending');
  await page.goto(origin+'/pricing');await expect(page.getByText('Los paquetes se publicarán aquí cuando el studio los habilite.')).toBeVisible();
  await page.evaluate(()=>localStorage.clear());await new LoginPage(page).login(f.email('client'),f.password,'/app/checkout');await expect(page.getByText(/Los paquetes se habilitarán aquí cuando estén disponibles/)).toBeVisible();
  for(const role of ['client','reception']){const response=await request.get(origin+'/api/plans/catalog-review',{headers:{Authorization:`Bearer ${f.tokens[role]}`}});expect(response.status()).toBe(403)}
  expect((await request.get(origin+'/api/plans/catalog-review')).status()).toBe(401);
  // A separately marked local fixture exercises the retirement boundary without attributing origin from price.
  await f.pool.query("UPDATE catalog_plan_review SET status='retired' WHERE plan_id=$1",[f.ids.plan]);
  await page.evaluate(()=>localStorage.clear());await new LoginPage(page).login(f.email('admin'),f.password,'/admin/plans');await expect(page.getByRole('region',{name:'Planes por revisar'})).toHaveCount(0);
  await page.getByRole('button',{name:'Acciones de '+customName}).click();const rejected=page.waitForResponse(r=>r.url().endsWith('/plans/'+f.ids.plan)&&r.request().method()==='PUT');await page.getByRole('menuitem',{name:'Reactivar',exact:true}).click();expect((await rejected).status()).toBe(409);
  await expect(page.getByRole('status').filter({hasText:/no puede volver a venderse/})).toBeVisible();
  expect((await f.pool.query('SELECT is_active FROM plans WHERE id=$1',[f.ids.plan])).rows[0].is_active).toBe(false);
  expect((await f.pool.query('SELECT * FROM memberships WHERE id=$1',[f.ids.membership])).rows[0]).toEqual(memberBefore);
  expect(errors).toEqual([]);expect(failures).toEqual([{url:'/api/plans/'+f.ids.plan,status:409}]);
  writeFileSync(out+'catalog-current-history.json',JSON.stringify({current:{name:customName,price:987,durationDays:27},pendingUsesCurrentPlan:true,editorUsesCurrentPlan:true,deactivatedInDB:true,membershipUnchanged:true,retiredReactivationStatus:409,errors,expectedFailures:failures,unauthorized:[401,403,403]},null,2));
 }finally{await f.pool.query('DELETE FROM catalog_plan_review WHERE plan_id=$1',[f.ids.plan]);for(const row of states)await f.pool.query('UPDATE plans SET is_active=$2 WHERE id=$1',[row.id,row.is_active]);}
});
