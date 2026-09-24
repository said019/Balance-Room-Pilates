import { Link } from 'react-router-dom';
import { DisciplineIcon } from '@/components/brand/DisciplineIcon';
import { STUDIO_SERVICES, TRAIN_DETAILS } from '@/lib/studio';
import { Arrow } from './SiteShell';
import './training-section.css';

const programs = [
  { ...STUDIO_SERVICES[0], title: STUDIO_SERVICES[0].name, subtitle: 'Fuerza que resiste.', focus: STUDIO_SERVICES[0].label, photos: [
    { file: 'studio/alt-elevate-20260924.png', alt: 'ALT. ELEVATE: trabajo con balón y empuje de trineo', width: 1536, height: 1024 },
  ] },
  { ...STUDIO_SERVICES[1], title: STUDIO_SERVICES[1].name, subtitle: 'La fuerza tiene ritmo.', focus: STUDIO_SERVICES[1].label, photos: [
    { file: 'studio/alt-train-20260924.png', alt: 'ALT. TRAIN: fuerza con mancuernas y espacio de entrenamiento', width: 1280, height: 1100 },
  ] },
  { ...STUDIO_SERVICES[2], title: STUDIO_SERVICES[2].name, subtitle: 'Tu ritmo. Más lejos.', focus: STUDIO_SERVICES[2].label, photos: [
    { file: 'studio/alt-race-20260924.png', alt: 'ALT. RACE: corredores de Altitud avanzando juntos', width: 1312, height: 1199 },
  ] },
];

export function TrainingSection() {
  return <section className="alt-programs" id="entrenamientos" aria-labelledby="programs-title">
    <header className="alt-programs-heading">
      <div><span className="alt-eyebrow">02 / EL ENTRENAMIENTO, A TU ALTITUD</span><h2 id="programs-title">Tres disciplinas.<br /><span>Tu siguiente nivel.</span></h2></div>
      <p>Encuentra lo que te mueve.<br />Entrenamos en grupos de hasta 12 personas, con atención a tu proceso.</p>
    </header>
    <div className="alt-program-list">
    {programs.map((program, index) => {
      const photo = program.photos[0];
      return <article key={program.id} className={`alt-program-story alt-program-${program.id}`} aria-labelledby={`program-title-${program.id}`}>
        <div className="alt-program-visual">
          <div className="alt-program-photo"><img key={photo.file} src={`/brand/${photo.file}`} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" /></div>
          <div className="alt-program-photo-bar"><span>2707 ALTITUD <span className="alt-program-photo-location">/ EN MOVIMIENTO</span></span>

          </div>
        </div>
        <div className="alt-program-copy">
          <div className="alt-program-label"><span className="alt-program-number">0{index + 1}</span><DisciplineIcon name={program.id} size={48} /><span className="alt-program-focus">{program.focus}</span></div>
          <h3 id={`program-title-${program.id}`}>{program.title}</h3>
          <p className="alt-program-subtitle">{program.subtitle}</p>
          <div className="alt-program-description"><p>{program.description}</p>{program.id === 'train' && TRAIN_DETAILS.map(text => <p key={text}>{text}</p>)}</div>
          <Link className="alt-program-book" to={`/reservar?tipo=${encodeURIComponent(program.name)}`}>Ver sesiones de {program.title} <Arrow /></Link>
          <div className="alt-program-footnote"><span>EL PROGRESO ES PERSONAL.</span><span>EL IMPULSO ES DE TODOS.</span></div>
        </div>
      </article>;
    })}
    </div>
    <div className="alt-program-challenge"><DisciplineIcon name="competition" size={50} /><p>De tu primera sesión a tu próxima competencia híbrida.</p><Link to="/reservar">Construye tu base <Arrow /></Link></div>
  </section>;
}
