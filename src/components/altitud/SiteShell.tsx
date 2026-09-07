import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true" className="alt-arrow">{diagonal ? '↗' : '↗'}</span>;
}
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const links = [['El studio', '/#studio'], ['Entrenamientos', '/#entrenamientos'], ['Horarios', '/reservar'], ['Membresías', '/#membresias']];
  return <header className="alt-header">
    <Link to="/" aria-label="2707 Altitud — Inicio" className="alt-brand"><img src="/brand/logo-horizontal.svg" alt="2707 Altitud" width="242" height="27" /></Link>
    <nav aria-label="Navegación principal" className="alt-desktop-nav">{links.map(([name, href]) => <a key={name} href={href} aria-current={pathname === href ? 'page' : undefined}>{name}</a>)}</nav>
    <div className="alt-header-actions"><Link className="alt-account" to="/login">Mi cuenta</Link><Link className="alt-button alt-button-dark alt-header-cta" to="/reservar">Reservar clase <Arrow /></Link>
      <button className="alt-menu-toggle" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? 'Cerrar −' : 'Menú +'}</button></div>
    {open && <nav id="mobile-navigation" aria-label="Navegación móvil" className="alt-mobile-nav">{links.map(([name, href]) => <a onClick={() => setOpen(false)} key={name} href={href}>{name}<Arrow /></a>)}<Link to="/login" onClick={() => setOpen(false)}>Mi cuenta</Link><Link to="/reservar" onClick={() => setOpen(false)}>Reservar clase <Arrow /></Link></nav>}
  </header>;
}
export function SiteFooter() {
  return <footer className="alt-footer"><div className="alt-footer-main"><div><img className="alt-footer-logo" src="/brand/logo-light.svg" alt="2707 Altitud" width="280" height="140" /><p>Un lugar. Un nivel. Tu siguiente versión.</p></div><div><span className="alt-eyebrow">ENCUÉNTRANOS</span><p>Zinacantepec<br />Estado de México</p><span className="alt-footer-note">Inspirados en el Nevado de Toluca.</span></div><div className="alt-footer-links"><span className="alt-eyebrow">SIGUE EN MOVIMIENTO</span><a href="/#entrenamientos">Entrenamientos <Arrow /></a><Link to="/reservar">Reserva tu clase <Arrow /></Link><Link to="/login">Mi cuenta <Arrow /></Link></div></div><div className="alt-footer-bottom"><span>© {new Date().getFullYear()} 2707 ALTITUD</span><span>PERFORMANCE MEETS LIFESTYLE</span><div><Link to="/privacy">Privacidad</Link><Link to="/terms">Términos</Link></div></div></footer>;
}
