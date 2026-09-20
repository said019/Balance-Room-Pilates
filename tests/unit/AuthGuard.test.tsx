import React from 'react';
import {render,screen,waitFor,cleanup} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {AuthGuard} from '@/components/layout/AuthGuard';
import {safeReturnUrl,authUrl} from '@/lib/auth-redirect';
let state:any;
jest.mock('@/stores/authStore',()=>({useAuthStore:()=>state}));
beforeEach(()=>{state={user:null,isAuthenticated:false,isLoading:false,authCheckError:null,checkAuth:jest.fn()};});afterEach(cleanup);
function mount(){return render(<MemoryRouter initialEntries={['/private?day=2030-01-01']}><Routes><Route path="/private" element={<AuthGuard requiredRoles={['admin']}><h1>Privado</h1></AuthGuard>}/><Route path="/login" element={<h1>Acceso requerido</h1>}/><Route path="/app" element={<h1>Mi app</h1>}/></Routes></MemoryRouter>);}
it('redirects anonymous access and never renders protected content',async()=>{mount();await screen.findByText('Acceso requerido');expect(screen.queryByText('Privado')).toBeNull();});
it('rejects a client from an admin screen',async()=>{state={...state,user:{role:'client'},isAuthenticated:true};mount();await screen.findByText('Mi app');expect(screen.queryByText('Privado')).toBeNull();});
it('shows a recoverable authentication service error without dropping into private content',async()=>{state.authCheckError='Servicio no disponible';mount();expect(screen.getByRole('alert')).toHaveTextContent('Servicio no disponible');expect(screen.queryByText('Privado')).toBeNull();});
it('renders authorized content after auth completes',()=>{state={...state,user:{role:'admin'},isAuthenticated:true};mount();expect(screen.getByText('Privado')).toBeVisible();});
it.each(['//evil.invalid','https://evil.invalid','/\\evil.invalid','/login','/register','/forgot-password'])('rejects unsafe or looping returnUrl %s',value=>expect(safeReturnUrl(value)).toBeNull());
it('preserves an internal booking destination without exposing session tokens',()=>expect(authUrl('/login','/app/book?tipo=TRAIN')).toBe('/login?returnUrl=%2Fapp%2Fbook%3Ftipo%3DTRAIN'));
