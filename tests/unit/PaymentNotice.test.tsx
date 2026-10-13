import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {PaymentNotice} from '@/components/layout/PaymentNotice';
jest.mock('@/lib/api',()=>({getStoredToken:()=> 'native-session'}));
jest.mock('@/components/layout/paymentNoticeBanner.js',()=>({
 montarAviso:(_el:any,options:any)=>{options.onNotice({fecha:'2026-10-30',ciclo:'2026-10',texto:'Tu fecha de pago'});return ()=>{};}
}));
test('owner sees dismissible popup and customer never sees it',()=>{
 const {rerender}=render(<PaymentNotice role="admin"/>);
 expect(screen.getByRole('dialog')).toBeInTheDocument();
 fireEvent.click(screen.getByText('Entendido, continuar'));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
 rerender(<PaymentNotice role="client"/>);
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
