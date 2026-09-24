import React from 'react';
import {render,screen,cleanup,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import Checkout from '@/pages/client/Checkout';
import api from '@/lib/api';
jest.mock('@/lib/api',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn()},getErrorMessage:(e:any)=>e.message}));
jest.mock('@/components/layout/AuthGuard',()=>({AuthGuard:({children}:any)=>children}));
jest.mock('@/components/layout/ClientLayout',()=>({ClientLayout:({children}:any)=>children}));
const toast=jest.fn();jest.mock('@/hooks/use-toast',()=>({useToast:()=>({toast})}));
const plan={id:'plan-fixture',name:'BASE',price:649,duration_days:30,class_limit:4,is_active:true};
function mount(){return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})}><MemoryRouter><Checkout/></MemoryRouter></QueryClientProvider>);}
beforeEach(()=>{(api.get as jest.Mock).mockImplementation(async(path:string)=>({data:path==='/plans'?[plan]:path==='/settings/payment-methods'?{cash:true,card:false,bank_transfer:false}:path==='/purchase-consent/public'?{version:1,title:'Declaración vigente',body:'Declaro que puedo realizar ejercicio.'}:{}}));});afterEach(()=>{cleanup();jest.clearAllMocks();});
it('shows a retry state when plans cannot be fetched',async()=>{(api.get as jest.Mock).mockRejectedValue(new Error('Offline'));mount();await screen.findByText('No pudimos cargar los paquetes disponibles.');expect(screen.getByRole('button',{name:'Volver a intentar'})).toBeVisible();});
it('does not expose unavailable card payment as a working option',async()=>{mount();await userEvent.click(await screen.findByRole('button',{name:/BASE/}));expect(screen.queryByText('Tarjeta de crédito o débito')).toBeNull();expect(await screen.findByText('Pago en el studio')).toBeVisible();});
it('keeps confirmation and selected plan after order creation fails',async()=>{(api.post as jest.Mock).mockRejectedValue(new Error('No se creó la orden'));mount();await userEvent.click(await screen.findByRole('button',{name:/BASE/}));await userEvent.click(await screen.findByLabelText(/Pago en el studio/));await userEvent.click(screen.getByRole('button',{name:'Continuar'}));expect(screen.getByRole('button',{name:'Confirmar orden'})).toBeDisabled();expect(api.post).not.toHaveBeenCalled();await userEvent.click(screen.getByRole('checkbox'));await userEvent.click(screen.getByRole('button',{name:'Confirmar orden'}));await waitFor(()=>expect(toast).toHaveBeenCalledWith(expect.objectContaining({title:'No pudimos crear tu orden'})));expect(screen.getByText('Antes de confirmar')).toBeVisible();expect(api.post).toHaveBeenCalledWith('/orders',expect.objectContaining({plan_id:'plan-fixture',health_acceptance:{accepted:true,version:1}}));});
