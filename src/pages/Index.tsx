import { CancellationTerms } from '@/hooks/use-cancellation-policy';
import { useState } from 'react';
import { TrainingSection } from '@/components/altitud/TrainingSection';
import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter, Arrow } from '@/components/altitud/SiteShell';
import { StudioHours, StudioContact, PlanHighlights } from '@/components/altitud/StudioDetails';

const questions = [
  ['¿Puedo entrenar si estoy empezando?', 'Sí. Aquí tu punto de partida es tuyo. El coaching cercano nos permite adaptar el trabajo a tu nivel, cuidar tu técnica y acompañarte para construir una base sólida.'],
  ['¿Qué significa entrenamiento híbrido?', 'Combinamos trabajo de fuerza y resistencia cardiovascular. Es una forma de desarrollar una condición física completa y prepararte para distintos retos deportivos.'],
  ['¿Necesito experiencia en competencias híbridas?', 'No necesitas haber competido. El entrenamiento híbrido es para quienes quieren comenzar y para atletas que buscan complementar su preparación para competencias híbridas.'],
  ['¿Puedo cancelar o cambiar mi clase?', 'Si cancelas después del plazo vigente o no asistes, la clase se considera utilizada y no puede recuperarse.'],
  ['¿Cuánto tiempo tengo para usar mi paquete?', 'Consulta la vigencia indicada en tu paquete al momento de comprarlo. Las clases no utilizadas no son acumulables ni transferibles, salvo excepción autorizada por Altitud.'],
  ['¿Qué llevo a mi primera clase?', 'Ropa deportiva cómoda, tenis para entrenar, agua y una toalla. Ven con disposición de aprender; el resto lo construimos juntos.'],
  ['¿Cómo reservo mi lugar?', 'Selecciona Reservar clase e inicia sesión o crea tu cuenta. Después elige una sesión disponible y confirma tu lugar desde tu app con un paquete o membresía activo. Entrenamos en grupos de hasta 12 personas.'],
];
export default function Index() {
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  return <div className="alt-site alt-home"><a href="#contenido" className="alt-skip">Ir al contenido</a><SiteHeader /><main id="contenido">
    <section className="alt-hero">
      <div className="alt-hero-copy"><div className="alt-eyebrow"><span className="alt-status-dot" /> PERFORMANCE LIFESTYLE · ZINACANTEPEC</div><h1>Tu siguiente<br />nivel empieza<br /><span>aquí.</span></h1><p>Híbrido y funcional, fuerza y running. Grupos de hasta 12 personas para dar más de ti y sentirte parte.</p><div className="alt-hero-buttons"><Link className="alt-button alt-button-olive" to="/reservar">Encuentra tu clase <Arrow /></Link><a className="alt-text-link" href="#studio">Conoce Altitud <span aria-hidden="true">↓</span></a></div><div className="alt-hero-bottom"><span>Inspirados en la altitud.</span><span>ZINACANTEPEC, MÉXICO<br />2707 M S. N. M.</span></div></div>
      <div className="alt-hero-visual"><img src="/brand/studio/hybrid-sled.webp" alt="Entrenamiento híbrido con empuje de trineo" width="1920" height="1080" /><div className="alt-image-top"><span>EL PROGRESO SE ENTRENA.</span><span>01 / EN MOVIMIENTO</span></div><div className="alt-image-bottom"><span><small>FUERZA. RESISTENCIA. COMUNIDAD.</small>Entrena con intención.</span><a href="#entrenamientos" aria-label="Descubre los entrenamientos" className="alt-circle-link"><Arrow /></a></div></div>
    </section>
    <div className="alt-values-strip"><span>ALTITUD</span><span aria-hidden="true">↗</span><span>DISCIPLINA</span><span aria-hidden="true">↗</span><span>COMUNIDAD</span><span aria-hidden="true">↗</span><span>EVOLUCIÓN</span><span aria-hidden="true">↗</span></div>
    <section className="alt-section alt-intro" id="studio"><div className="alt-eyebrow">01 / NUESTRA ESENCIA</div><div><h2>Un lugar para entrenar.<br /><span>Una comunidad para<br className="alt-desktop-break" /> llegar más lejos.</span></h2><div className="alt-intro-bottom"><p>Nacimos en Zinacantepec, a 2707 metros sobre el nivel del mar. Inspirados en el Nevado de Toluca, hacemos de cada entrenamiento una oportunidad para evolucionar.</p><p>Entrenamiento de alto nivel, atención cercana y un espacio donde cabes tal como eres. Aquí el progreso es personal. La energía es de todos.</p></div></div></section>
    <TrainingSection />
    <section className="alt-community"><div className="alt-community-image"><img src="/brand/studio/hybrid-ski.webp" alt="Atletas acompañándose durante una prueba de entrenamiento híbrido" loading="lazy" width="1920" height="1080" /></div><div className="alt-community-copy"><div className="alt-eyebrow">03 / EL PODER DE ENTRENAR JUNTOS</div><h2>El esfuerzo es tuyo.<br /><span>El impulso,<br />de todos.</span></h2><p>Más que un lugar donde entrenas. Una comunidad a la que quieres pertenecer.</p><ul><li><span>01</span>Hasta 12 personas, atención real.</li><li><span>02</span>Coaching que conoce tu proceso.</li><li><span>03</span>Energía que se contagia.</li></ul><Link className="alt-button alt-button-cream" to="/reservar">Encuentra tu lugar <Arrow /></Link></div></section>
    <StudioHours />
    <section className="alt-section alt-memberships" id="membresias"><div><div className="alt-eyebrow">04 / HAZLO PARTE DE TU VIDA</div><h2>Haz espacio<br />para tu<br /><span>mejor versión.</span></h2><p>Entrenar una vez es empezar.<br />Volver es lo que te transforma.</p></div><div className="alt-membership-options"><PlanHighlights /></div></section>
    <section className="alt-section alt-faq" id="preguntas"><div><div className="alt-eyebrow">ANTES DE EMPEZAR</div><h2>Llega con ganas.<br />Y sin dudas.</h2><p>Tu primera clase, con confianza.</p></div><div>{questions.map(([q,a],i)=><div className="alt-faq-item" key={q}><h3><button aria-expanded={openQuestion===i} aria-controls={`answer-${i}`} onClick={()=>setOpenQuestion(openQuestion===i?null:i)}>{q}<span aria-hidden="true">{openQuestion===i?'−':'+'}</span></button></h3><div id={`answer-${i}`} hidden={openQuestion!==i}><p>{i === 3 && <><CancellationTerms /> </>}{a}</p></div></div>)}</div></section>
    <StudioContact />
    <section className="alt-final-cta"><div className="alt-eyebrow">EL PRIMER PASO TAMBIÉN CUENTA.</div><div><h2>Nos vemos<br />en Altitud.</h2><Link className="alt-button alt-button-dark" to="/reservar">Vamos a entrenar <Arrow /></Link></div><span className="alt-cta-coordinate">ZINACANTEPEC, MÉXICO · 2707 M S. N. M.</span></section>
  </main><SiteFooter /></div>;
}
