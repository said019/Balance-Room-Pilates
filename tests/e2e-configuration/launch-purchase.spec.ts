import {test,expect,origin,LoginPage} from './fixtures';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='/Users/saidromero/Balance Room/.audit-20260919/evidence/brand-20260924/';
mkdirSync(out,{recursive:true});
test('updated photos and admin opening setup render on mobile',async({page,fixture:f})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/');
 for(const name of ['train','race','elevate']){const img=page.locator(`img[src*="alt-${name}-20260924"]`).first();await img.scrollIntoViewIfNeeded();await expect(img).toBeVisible();await expect.poll(()=>img.evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);}
 await page.screenshot({path:out+'landing-mobile.png',fullPage:true});
 await new LoginPage(page).login(f.email('admin'),f.password,'/admin/settings/operations');
 await expect(page.getByRole('heading',{name:'Semana de apertura · 21 al 23 de octubre'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Publicar sesión',exact:true})).toHaveCount(12);
 await expect(page.getByRole('button',{name:'Publicar sesión',exact:true}).first()).toBeDisabled();
 await expect(page.getByLabel('Texto completo')).not.toBeEmpty();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:out+'operations-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:900}); await page.goto(origin+'/admin/settings/operations'); await expect(page.getByLabel('Texto completo')).not.toBeEmpty(); await page.screenshot({path:out+'operations-desktop.png',fullPage:true});
 expect(errors).toEqual([]);
});
test('each purchase needs unchecked consent and creates exact SQL snapshot',async({page,fixture:f})=>{
 await new LoginPage(page).login(f.email('client'),f.password,'/app/checkout');
 await page.getByRole('button').filter({hasText:'QA 8 clases'}).click();
 await page.getByLabel('Pago en el studio',{exact:false}).click();
 await page.getByRole('button',{name:'Continuar',exact:false}).click();
 const checkbox=page.getByRole('checkbox',{name:'He leído la declaración y confirmo mi aceptación para esta compra.'});
 await expect(checkbox).not.toBeChecked();
 await expect(page.getByRole('button',{name:'Confirmar orden',exact:false})).toBeDisabled();
 await checkbox.check();
 await page.screenshot({path:out+'purchase-consent-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Confirmar orden',exact:false}).click();
 await expect(page).toHaveURL(/\/app\/orders\/[a-f0-9-]+$/);
 await expect(page.getByText('Declaración aceptada en esta compra')).toBeVisible();
 const rows=(await f.pool.query('SELECT a.version,a.body,a.accepted_at,o.user_id FROM order_health_acceptances a JOIN orders o ON o.id=a.order_id WHERE o.user_id=$1',[f.ids.client])).rows;
 expect(rows).toHaveLength(1);expect(rows[0].body.length).toBeGreaterThan(30);
 await page.goto(origin+'/app/checkout');await page.getByRole('button').filter({hasText:'QA 8 clases'}).click();await page.getByLabel('Pago en el studio',{exact:false}).click();await page.getByRole('button',{name:'Continuar',exact:false}).click();await expect(checkbox).not.toBeChecked();
 writeFileSync(out+'purchase-browser.json',JSON.stringify({snapshotCount:rows.length,version:rows[0].version,userMatches:rows[0].user_id===f.ids.client,freshAcceptanceRequired:true},null,2));
});
