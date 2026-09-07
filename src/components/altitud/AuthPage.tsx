import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api, { getErrorMessage } from '@/lib/api';
import { Arrow } from './SiteShell';

type Mode = 'login' | 'register' | 'forgot';
export default function AuthPage({ mode }: { mode: Mode }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { login, register, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const configured = Boolean(import.meta.env.VITE_API_URL);
  const title = mode==='login'?'BIENVENIDO A TU SIGUIENTE NIVEL.':mode==='register'?'TU HISTORIA EMPIEZA AQUÍ.':'VOLVAMOS A CONECTAR.';
  useEffect(()=>{ if(isAuthenticated&&user){ const url=params.get('returnUrl'); navigate(url?.startsWith('/')&&!url.startsWith('//')?url:user.role==='admin'?'/admin/dashboard':'/app',{replace:true}); } },[isAuthenticated,user,navigate,params]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    if(!configured) { setError('El acceso de 2707 Altitud estará disponible al activar el studio. Por ahora puedes explorar la agenda de muestra.'); return; }
    const data=new FormData(e.currentTarget); const email=String(data.get('email')); const password=String(data.get('password')||'');
    if(mode==='register'&&password!==data.get('confirmPassword')) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    try { if(mode==='login') await login({email,password}); else if(mode==='register') await register({email,password,displayName:String(data.get('name')).trim(),phone:String(data.get('phone')),acceptsTerms:data.get('terms')==='on',acceptsCommunications:false}); else { await api.post('/auth/forgot-password',{email});setSuccess(true); } } catch(err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return <main className="alt-site alt-auth"><section className="alt-auth-image"><img className="alt-auth-photo" src="/brand/hybrid-training.jpg" alt="Entrenamiento híbrido en comunidad" /><Link to="/" className="alt-auth-logo" aria-label="Volver a 2707 Altitud"><img src="/brand/logo-light.svg" alt="2707 Altitud" width="280" height="140" /></Link><div className="alt-auth-manifesto"><div className="alt-eyebrow">2707 M S. N. M. · ZINACANTEPEC</div><h1>EL SIGUIENTE<br />NIVEL ES<br /><span>CONTIGO.</span></h1><p>Disciplina. Comunidad. Evolución.</p></div></section><section className="alt-auth-content"><Link to="/" className="alt-auth-back">← Volver al studio</Link><div className="alt-auth-form"><div className="alt-eyebrow">PERFORMANCE MEETS LIFESTYLE</div><h2>{title}</h2><p>{mode==='login'?'Entra a tu cuenta y haz espacio para entrenar.':mode==='register'?'Únete a una comunidad que te impulsa a ir más lejos.':'Escribe tu correo para recuperar tu contraseña.'}</p>{!configured&&<div className="alt-auth-notice">Estamos preparando el acceso al nuevo studio. <Link to="/app/preview">Explora tu app de usuario ↗</Link></div>}{success?<div className="alt-auth-success" role="status"><h3>Revisa tu correo.</h3><p>Si existe una cuenta con ese correo, recibirás las instrucciones para restablecer tu contraseña.</p><Link to="/login" className="alt-text-link">Volver al inicio de sesión</Link></div>:<form onSubmit={submit}>
    {mode==='register'&&<div className="alt-form-field"><label htmlFor="name">Nombre completo</label><input id="name" name="name" autoComplete="name" minLength={2} required placeholder="Tu nombre" disabled={busy} /></div>}
    <div className="alt-form-field"><label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="tu@correo.com" disabled={busy} /></div>
    {mode==='register'&&<div className="alt-form-field"><label htmlFor="phone">Teléfono</label><input id="phone" name="phone" type="tel" autoComplete="tel" pattern="\+52[0-9]{10}" required placeholder="+52 seguido de 10 dígitos" disabled={busy} /><small>Incluye +52 y tus 10 dígitos.</small></div>}
    {mode!=='forgot'&&<div className="alt-form-field"><div className="alt-field-label"><label htmlFor="password">Contraseña</label>{mode==='login'&&<Link to="/forgot-password">¿La olvidaste?</Link>}</div><div className="alt-password-input"><input id="password" name="password" type={visible?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='register'?8:1} pattern={mode==='register'?'(?=.*[A-Z])(?=.*[0-9]).{8,}':undefined} required disabled={busy} aria-describedby={mode==='register'?'password-help':undefined} /><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'}>{visible?'Ocultar':'Mostrar'}</button></div>{mode==='register'&&<small id="password-help">Mínimo 8 caracteres, una mayúscula y un número.</small>}</div>}
    {mode==='register'&&<><div className="alt-form-field"><label htmlFor="confirmPassword">Confirmar contraseña</label><input id="confirmPassword" name="confirmPassword" type={visible?'text':'password'} autoComplete="new-password" required disabled={busy} /></div><label className="alt-form-check"><input type="checkbox" name="terms" required disabled={busy} /><span>Acepto los <Link to="/terms">términos</Link> y el <Link to="/privacy">aviso de privacidad</Link>.</span></label></>}
    {error&&<p className="alt-error" role="alert">{error}</p>}<button type="submit" className="alt-button alt-button-olive" disabled={busy}>{busy?'Un momento…':mode==='login'?'Entrar a mi cuenta':mode==='register'?'Crear mi cuenta':'Enviar instrucciones'}<Arrow /></button></form>}
    <div className="alt-auth-switch">{mode==='login'?<>¿Aún no eres parte? <Link to="/register">Crea tu cuenta ↗</Link></>:<Link to="/login">Ya tengo cuenta. Iniciar sesión ↗</Link>}</div><div className="alt-auth-signoff">UN LUGAR. UN NIVEL. TU SIGUIENTE VERSIÓN.</div></div></section></main>;
}
