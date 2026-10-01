import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
export function OpeningPromotionSettings(){
 const qc=useQueryClient();const q=useQuery({queryKey:['opening-promotion'],queryFn:async()=>(await api.get('/plans/opening-promotion')).data});const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function toggle(){setBusy(true);setError('');try{await api.put('/plans/opening-promotion',{enabled:!q.data.enabled});await qc.invalidateQueries({queryKey:['opening-promotion']});}catch(e){setError(getErrorMessage(e));}finally{setBusy(false);}}
 return <section className="space-y-4 border-t pt-8"><h2 className="text-xl font-semibold">Promoción de apertura · 10%</h2><p className="max-w-prose text-sm text-muted-foreground">Hasta el 24 de octubre de 2026, inclusive, en horario de Ciudad de México. FOUNDING 50 aplica el descuento al primer pago; las renovaciones conservan su precio de $1,299.</p>{q.isLoading?<p role="status">Consultando promoción…</p>:q.isError?<Button variant="outline" onClick={()=>void q.refetch()}>Reintentar</Button>:<><p>Prueba, DROP IN y primer pago Founding: <strong>{q.data.active?'Promoción vigente':q.data.enabled?'Fuera de vigencia':'Desactivada'}</strong></p><Button variant="outline" disabled={busy} onClick={()=>void toggle()}>{busy?'Guardando…':q.data.enabled?'Desactivar prueba, DROP IN y Founding':'Activar prueba, DROP IN y Founding'}</Button></>}{error&&<p role="alert" className="text-destructive">{error}</p>}<p className="text-sm text-muted-foreground">BASE, ASCENSO, CUMBRE y 2707 tienen precio y vencimiento promocional editables en cada plan. La vigencia de uso de prueba y DROP IN debe configurarse antes de habilitar su compra.</p><Link to="/admin/plans" className="inline-block underline">Administrar precios y paquetes</Link></section>;
}
