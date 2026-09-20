import {test,expect,origin,evidenceArea,LoginPage} from './fixtures';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const out=fileURLToPath(new URL(`../../../../evidence/${evidenceArea}/`,import.meta.url));
test('I1 B1: an admin publishes and edits civil hours, landing and member DOM equal SQL',async({page,fixture:f})=>{
 let id:string|undefined;
 try{
 await new LoginPage(page).login(f.email('admin'),f.password,'/admin/classes/schedules');
 const editor=page.getByRole('region',{name:'Horario publicado'});
 await editor.getByRole('combobox',{name:'Día',exact:true}).selectOption('0');await editor.getByLabel('Hora de inicio').fill('12:17');await editor.getByLabel('Publicado',{exact:true}).check();
 const created=page.waitForResponse(r=>r.url().endsWith('/schedules/slots')&&r.request().method()==='POST');
 await editor.getByRole('button',{name:'Agregar horario'}).click();id=(await(await created).json()).id;
 await expect(editor.locator('li').filter({hasText:'12:17 PM'})).toBeVisible();
 const row=editor.locator('li').filter({hasText:'12:17 PM'});await row.getByRole('button',{name:'Editar',exact:true}).click();await editor.getByLabel('Hora de inicio').fill('12:18');await editor.getByRole('button',{name:'Guardar horario'}).click();await expect(editor.locator('li').filter({hasText:'12:18 PM'})).toBeVisible();
 const sql=(await f.pool.query("SELECT id,day_of_week,to_char(start_time,'HH24:MI') AS start_time FROM schedule_slots WHERE is_published ORDER BY id")).rows;
 const snapshots:any[]=[];
 for(const route of ['/','/app/profile/membership']){if(route.startsWith('/app')){await page.evaluate(()=>localStorage.clear());await new LoginPage(page).login(f.email('client'),f.password,route);}else await page.goto(origin+route);await expect(page.locator(`[data-slot-id="${id}"]`)).toHaveAttribute('data-time','12:18');const dom=await page.locator('[data-slot-id]').evaluateAll(nodes=>nodes.map(n=>({id:n.getAttribute('data-slot-id'),day_of_week:Number(n.getAttribute('data-day')),start_time:n.getAttribute('data-time')})).sort((a,b)=>a.id!.localeCompare(b.id!)));expect(dom).toEqual(sql);snapshots.push({route,dom});}
 writeFileSync(out+'published-hours-dom-db.json',JSON.stringify({sql,snapshots},null,2));
 }finally{if(id)await f.pool.query('DELETE FROM schedule_slots WHERE id=$1',[id]);}
});
test('RG33: editable profile controls stay at least 16px on a 390px viewport',async({page,fixture:f})=>{
 await new LoginPage(page).login(f.email('client'),f.password,'/app/profile/edit');
 const controls=await page.locator('input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]),select,textarea').evaluateAll(nodes=>nodes.filter(n=>(n as HTMLElement).offsetWidth>0).map(n=>({tag:n.tagName,type:n.getAttribute('type'),name:n.getAttribute('name'),font:getComputedStyle(n).fontSize})));
 writeFileSync(out+'profile-input-fonts.json',JSON.stringify(controls,null,2));expect(controls.filter(c=>parseFloat(c.font)<16)).toEqual([]);
});
