import React from 'react';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import api from '@/lib/api';
import {MemberOpeningRegistration} from '@/components/altitud/MemberOpeningRegistration';
jest.mock('@/lib/api',()=>({__esModule:true,default:{get:jest.fn()}}));
afterEach(()=>{cleanup();jest.clearAllMocks();});
function mount(record:unknown){(api.get as jest.Mock).mockImplementation(async(path:string)=>({data:path.endsWith('/me')?record:{date:'2026-10-24',startTime:'10:00',endTime:'12:00'}}));render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})}><MemoryRouter><MemberOpeningRegistration/></MemoryRouter></QueryClientProvider>);}
it('shows saved attendance and answers with edit link',async()=>{mount({attendeeCount:3,exercisesRegularly:true,exerciseType:'Running',activitiesInterest:true});expect(await screen.findByText(/Asistencia registrada · 3 personas/)).toBeVisible();expect(screen.getByText(/Ejercicio: Running/)).toBeVisible();expect(screen.getByRole('link',{name:/actualizar mi registro/})).toHaveAttribute('href','/inauguracion');});
it('offers registration without fabricating attendance',async()=>{mount(null);expect(await screen.findByText(/Aún no estás registrado/)).toBeVisible();expect(screen.getByRole('link',{name:/Registrarme a la inauguración/})).toHaveAttribute('href','/inauguracion');});
