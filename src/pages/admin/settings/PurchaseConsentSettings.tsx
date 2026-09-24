import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
type Policy = { version: number; title: string; body: string; review_status: 'pending_review' | 'reviewed' };
export function PurchaseConsentSettings() {
 const query = useQuery<Policy>({queryKey:['purchase-consent-admin'],queryFn:async()=>(await api.get('/purchase-consent/public')).data});
 const [draft,setDraft]=useState<Policy|null>(null); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
 useEffect(()=>{if(query.data)setDraft(query.data);},[query.data]);
 const save=async()=>{if(!draft)return;setBusy(true);setMessage('');try{const {data}=await api.put('/purchase-consent',{expectedVersion:draft.version,title:draft.title,body:draft.body,review_status:draft.review_status});setDraft(data);setMessage('Nueva versión guardada. Las aceptaciones anteriores se conservan.');}catch(e){setMessage(getErrorMessage(e));}finally{setBusy(false);}};
 return <section className="space-y-5 border-t pt-8" aria-labelledby="consent-settings-title"><header><h2 id="consent-settings-title" className="text-xl font-semibold">Declaración en cada compra</h2><p className="mt-2 max-w-prose text-sm text-muted-foreground">El cliente debe aceptar el texto vigente en cada nueva orden. Conservamos la fecha, la versión y el texto que aceptó.</p></header>
 {query.isLoading?<p role="status">Consultando declaración…</p>:query.isError?<Button variant="outline" onClick={()=>void query.refetch()}>Volver a consultar declaración</Button>:draft&&<div className="space-y-4">
 <p className="text-sm text-altitud-earth">Versión {draft.version} · {draft.review_status==='reviewed'?'Revisada por el studio':'Revisión del texto pendiente'}</p>
 <p className="max-w-prose text-sm text-muted-foreground">Revisa este texto con tu asesor legal antes de publicarlo en producción. No sustituye una valoración médica ni elimina derechos del consumidor.</p>
 <div><Label htmlFor="consent-title">Título</Label><Input id="consent-title" value={draft.title} maxLength={160} onChange={e=>setDraft({...draft,title:e.target.value})}/></div>
 <div><Label htmlFor="consent-body">Texto completo</Label><Textarea id="consent-body" className="mt-2 min-h-72" maxLength={12000} value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value,review_status:'pending_review'})}/></div>
 <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={draft.review_status==='reviewed'} onChange={e=>setDraft({...draft,review_status:e.target.checked?'reviewed':'pending_review'})}/><span>El studio ha revisado esta versión del texto.</span></label>
 <div className="flex flex-wrap gap-3"><Button disabled={busy||draft.title.trim().length<3||draft.body.trim().length<30} onClick={()=>void save()}>{busy?'Guardando…':'Guardar nueva versión'}</Button><Button variant="outline" onClick={()=>void query.refetch()}>Recargar versión vigente</Button></div>
 </div>}{message&&<p role="status" className="text-sm">{message}</p>}</section>;
}
