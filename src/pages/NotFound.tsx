import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter, Arrow } from '@/components/altitud/SiteShell';
export default function NotFound(){return <div className="alt-site"><SiteHeader/><main className="alt-not-found"><div className="alt-eyebrow">404 · FUERA DE RUTA</div><h1>RETOMA<br />TU CAMINO.</h1><p>Esta página no existe. Tu siguiente entrenamiento sí tiene un lugar.</p><Link to="/" className="alt-button alt-button-olive">Volver a Altitud <Arrow/></Link></main><SiteFooter/></div>}
