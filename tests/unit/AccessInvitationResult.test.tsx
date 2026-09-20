import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {AccessInvitationResult} from '@/components/admin/AccessInvitationResult';
afterEach(cleanup);
it('describes queued delivery without claiming an external message was sent',()=>{render(<AccessInvitationResult result={{notificationStatus:'queued',emailSent:false,whatsappSent:false}}/>);expect(screen.getByRole('status')).toHaveTextContent('Invitación de acceso en cola');expect(screen.queryByRole('alert')).toBeNull();expect(screen.queryByText(/contraseña temporal|enviada por/)).toBeNull();});
it('only reports a delivered channel when the provider result confirms it',()=>{render(<AccessInvitationResult result={{emailSent:true,whatsappSent:false}}/>);expect(screen.getByRole('status')).toHaveTextContent('enviada por correo');expect(screen.queryByText(/WhatsApp/)).toBeNull();});
it('does not turn an unknown result into a successful delivery',()=>{render(<AccessInvitationResult result={{}}/>);expect(screen.getByRole('alert')).toHaveTextContent('No pudimos confirmar');});
