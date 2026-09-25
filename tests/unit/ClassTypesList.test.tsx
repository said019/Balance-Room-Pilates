import React from 'react';
import {render,screen} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import ClassTypesList from '@/pages/admin/classes/ClassTypesList';
import api from '@/lib/api';
jest.mock('@/lib/api',()=>({__esModule:true,default:{get:jest.fn()},getErrorMessage:()=> 'Error'}));
jest.mock('@/components/layout/AdminLayout',()=>({AdminLayout:({children}:any)=><main>{children}</main>}));
jest.mock('@/components/layout/AuthGuard',()=>({AuthGuard:({children}:any)=>children}));
it('shows inactive disciplines even when the public active-only catalog is cached empty',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false,staleTime:60000}}});
 client.setQueryData(['class-types'],[]);
 (api.get as jest.Mock).mockResolvedValue({data:[{id:'discipline',name:'ALT. ELEVATE',is_active:false,level:'all',duration_minutes:60,max_capacity:12}]});
 render(<QueryClientProvider client={client}><MemoryRouter><ClassTypesList/></MemoryRouter></QueryClientProvider>);
 expect(await screen.findByText('ALT. ELEVATE')).toBeInTheDocument();
 expect(screen.getByText('Inactivo')).toBeInTheDocument();
 expect(api.get).toHaveBeenCalledWith('/class-types?all=true');
 client.clear();
});
