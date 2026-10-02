import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button } from '@/components/ui/button';
import api, { getErrorMessage } from '@/lib/api';

export default function FoundingCheckout() {
 const [acceptedVersion,setAcceptedVersion]=useState<number|null>(null);
 const consent=useQuery<{version:number;title:string;body:string}>({queryKey:['purchase-consent'],queryFn:async()=>(await api.get('/purchase-consent/public')).data,staleTime:0});
 const methods=useQuery({queryKey:['payment-methods'],queryFn:async()=>(await api.get('/settings/payment-methods')).data});
 const purchase=useMutation({mutationFn:async()=> (await api.post('/founding50/checkout',{health_acceptance:{accepted:true,version:acceptedVersion}})).data,
 onSuccess:data=>{window.location.href=data.checkout_url;},onError:()=>{setAcceptedVersion(null);void consent.refetch();}});
 return <AuthGuard><ClientLayout><main className="mx-auto max-w-2xl space-y-6 px-5 py-10">
  <Link to="/pricing" className="underline">Volver a paquetes</Link>
  <p className="text-xs uppercase tracking-widest text-altitud-olive">Los primeros 50</p>
  <h1 className="text-4xl">FOUNDING 50</h1>
  <p className="text-3xl">$1,299 <span className="text-base">MXN</span></p>
  <p>Tu primer periodo de 30 días con clases ilimitadas. Precio de $1,299 durante 6 meses, con pagos consecutivos y membresía activa. No incluye cobros automáticos.</p>
  <p className="rounded-xl bg-altitud-sand/20 p-4">Al continuar reservamos un lugar durante 30 minutos. Se confirma cuando Mercado Pago aprueba tu pago. Si el pago llega después y ya no hay lugar, el studio deberá revisarlo antes de activar la membresía.</p>
  <section className="space-y-4 border-y py-5"><h2 className="text-xl">Tu salud, en cada compra</h2>
   {consent.isPending?<p role="status">Cargando declaración…</p>:consent.isError?<p role="alert">No se pudo cargar la declaración. <button onClick={()=>void consent.refetch()} className="underline">Reintentar</button></p>:<>
    <h3>{consent.data.title}</h3><p className="whitespace-pre-line text-sm leading-relaxed">{consent.data.body}</p>
    <label className="flex items-start gap-3"><input type="checkbox" checked={acceptedVersion===consent.data.version} onChange={e=>setAcceptedVersion(e.target.checked?consent.data.version:null)} /><span>He leído la declaración y confirmo mi aceptación para esta compra.</span></label>
   </>}
  </section>
  {purchase.isError&&<p role="alert">{getErrorMessage(purchase.error)}</p>}
  {methods.isError&&<p role="alert">No se pudo consultar el pago con tarjeta. <button onClick={()=>void methods.refetch()} className="underline">Reintentar</button></p>}
  {methods.isSuccess&&!methods.data.card&&<p>El pago con tarjeta no está disponible en este momento.</p>}
  <Button className="w-full" disabled={!consent.data||acceptedVersion!==consent.data.version||!methods.data?.card||purchase.isPending} onClick={()=>purchase.mutate()}>{purchase.isPending?'Abriendo Mercado Pago…':'Pagar $1,299 con Mercado Pago'}</Button>
  <p className="text-sm">Al continuar aceptas las <Link className="underline" to="/terms">condiciones de Altitud</Link>. El pago se completa en Mercado Pago.</p>
 </main></ClientLayout></AuthGuard>;
}
