import React from 'react';
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {RescheduleDialog} from '@/components/member/RescheduleDialog';
import api from '@/lib/api';
jest.mock('@/lib/api',()=>({__esModule:true,default:{get:jest.fn()},getStoredToken:()=>null,getErrorMessage:(e:any)=>e.message}));
const booking={booking_id:'source-booking',class_id:'source-class',booking_status:'confirmed',date:'2030-01-01',start_time:'10:00'} as any;
const target={id:'target-class',class_type_name:'TRAIN destino',date:'2030-01-02',start_time:'11:00',status:'scheduled',current_bookings:0,max_capacity:12};
afterEach(()=>{cleanup();jest.clearAllMocks();});
function mount(onChange=jest.fn(),onClose=jest.fn()){const cache=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});return {...render(<QueryClientProvider client={cache}><RescheduleDialog booking={booking} onClose={onClose} onChange={onChange}/></QueryClientProvider>),onClose,onChange};}
it('requires selecting a valid target instead of cancelling first',async()=>{(api.get as jest.Mock).mockResolvedValue({data:[target]});mount();await screen.findByText(/TRAIN destino/);expect(screen.getByRole('button',{name:'Confirmar cambio'})).toBeDisabled();});
it('keeps the original reservation dialog recoverable after an atomic change is rejected',async()=>{(api.get as jest.Mock).mockResolvedValue({data:[target]});const change=jest.fn().mockRejectedValue(new Error('El destino se llenó'));const {onClose}=mount(change);await userEvent.selectOptions(await screen.findByLabelText('Nueva sesión'),'target-class');await userEvent.click(screen.getByRole('button',{name:'Confirmar cambio'}));await screen.findByText('El destino se llenó');expect(onClose).not.toHaveBeenCalled();expect(change).toHaveBeenCalledWith(booking,target);});
it('offers retry on an unavailable agenda without any invented options',async()=>{(api.get as jest.Mock).mockRejectedValue(new Error('Offline'));mount();await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('No pudimos consultar'));expect(screen.queryByLabelText('Nueva sesión')).toBeNull();expect(screen.getByRole('button',{name:'Confirmar cambio'})).toBeDisabled();});
