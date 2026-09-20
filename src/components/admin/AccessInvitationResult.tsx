export type AccessInvitationStatus = { notificationStatus?: 'queued' | 'sent' | 'failed'; emailSent?: boolean; whatsappSent?: boolean };
export function AccessInvitationResult({result}: {result: AccessInvitationStatus}) {
 if(result.notificationStatus==='queued') return <div role="status" className="space-y-3"><p>Invitación de acceso en cola</p><p className="text-sm text-muted-foreground">El envío está pendiente. El cliente podrá crear su contraseña mediante el enlace de acceso cuando reciba la invitación.</p></div>;
 if(result.emailSent||result.whatsappSent) return <p role="status">Invitación de acceso enviada por {[result.emailSent?'correo':null,result.whatsappSent?'WhatsApp':null].filter(Boolean).join(' y ')}.</p>;
 return <p role="alert">No pudimos confirmar el envío de la invitación. Revisa el estado antes de volver a intentarlo.</p>;
}
