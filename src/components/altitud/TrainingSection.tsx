import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DisciplineIcon } from '@/components/brand/DisciplineIcon';
import { STUDIO_SERVICES, TRAIN_DETAILS } from '@/lib/studio';
import { Arrow } from './SiteShell';
import './training-section.css';

const programs = [
  { ...STUDIO_SERVICES[0], title: 'Híbrido', subtitle: 'Fuerza que resiste.', focus: 'FUERZA / RESISTENCIA / CONTROL', photos: [
    { file: 'studio/hybrid-carry.webp', alt: 'Atletas de Altitud realizando un acarreo con pesas' },
    { file: 'studio/hybrid-ski.webp', alt: 'Entrenamiento híbrido en SkiErg' },
    { file: 'studio/hybrid-sled.webp', alt: 'Atleta empujando un trineo en una competencia híbrida' },
  ] },
  { ...STUDIO_SERVICES[1], title: 'TRAIN', subtitle: 'La fuerza tiene ritmo.', focus: 'MÚSICA / TÉCNICA / HIPERTROFIA', photos: [
    { file: 'performance-disciplines.jpg', alt: 'Trabajo de fuerza y movimiento en el studio' },
  ] },
  { ...STUDIO_SERVICES[2], title: 'Running', subtitle: 'Tu ritmo. Más lejos.', focus: 'CARRERA / CONSTANCIA / COMUNIDAD', photos: [
    { file: 'studio/run-community.webp', alt: 'Corredores de Altitud compartiendo una carrera' },
    { file: 'studio/run-race.webp', alt: 'Corredores de Altitud avanzando juntos durante una carrera' },
    { file: 'studio/run-progress.webp', alt: 'La comunidad de Altitud disfrutando su progreso en carrera' },
  ] },
];

export function TrainingSection() {
  const [selected, setSelected] = useState(2);
  const [photoIndex, setPhotoIndex] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const program = programs[selected];
  const photo = program.photos[photoIndex];
  const selectProgram = (index: number) => { setSelected(index); setPhotoIndex(0); };
  const movePhoto = (step: number) => setPhotoIndex(index => (index + step + program.photos.length) % program.photos.length);

  return <section className="alt-programs" id="entrenamientos" aria-labelledby="programs-title">
    <header className="alt-programs-heading">
      <div><span className="alt-eyebrow">02 / EL ENTRENAMIENTO, A TU ALTITUD</span><h2 id="programs-title">Tres disciplinas.<br /><span>Tu siguiente nivel.</span></h2></div>
      <p>Encuentra lo que te mueve.<br />Entrenamos en grupos de hasta 12 personas, con atención a tu proceso.</p>
    </header>
    <div className="alt-program-tabs" role="tablist" aria-label="Elige tu entrenamiento">
      {programs.map((item, index) => <button key={item.id} ref={element => { tabs.current[index] = element; }} type="button" role="tab" id={`program-tab-${item.id}`} aria-controls={`program-panel-${item.id}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => selectProgram(index)} onKeyDown={event => {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % programs.length;
        else if (event.key === 'ArrowLeft') next = (index + programs.length - 1) % programs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = programs.length - 1;
        else return;
        event.preventDefault(); selectProgram(next); tabs.current[next]?.focus();
      }}><span className="alt-program-number">0{index + 1}</span><DisciplineIcon name={item.id} size={48} /><span className="alt-program-name">{item.title}</span><span className="alt-program-indicator" aria-hidden="true">↗</span></button>)}
    </div>
    {programs.map((item, index) => <div key={item.id} id={`program-panel-${item.id}`} role="tabpanel" aria-labelledby={`program-tab-${item.id}`} hidden={selected !== index} tabIndex={0}>
      {selected === index && <div className={`alt-program-story alt-program-${program.id}`}>
        <div className="alt-program-visual">
          <div className="alt-program-photo"><img key={photo.file} src={`/brand/${photo.file}`} alt={photo.alt} width="853" height="1280" loading="lazy" /></div>
          <div className="alt-program-photo-bar"><span>2707 ALTITUD <span className="alt-program-photo-location">/ EN MOVIMIENTO</span></span>
            {program.photos.length > 1 && <div className="alt-program-photo-controls"><button type="button" onClick={() => movePhoto(-1)} aria-label={`Foto anterior de ${program.title}`}>←</button><span role="status" aria-live="polite">{String(photoIndex + 1).padStart(2, '0')} <span>/ {String(program.photos.length).padStart(2, '0')}</span></span><button type="button" onClick={() => movePhoto(1)} aria-label={`Foto siguiente de ${program.title}`}>→</button></div>}
          </div>
        </div>
        <div className="alt-program-copy">
          <span className="alt-program-focus">{program.focus}</span>
          <h3>{program.title}</h3>
          <p className="alt-program-subtitle">{program.subtitle}</p>
          <div className="alt-program-description"><p>{program.description}</p>{program.id === 'train' && TRAIN_DETAILS.map(text => <p key={text}>{text}</p>)}</div>
          <Link className="alt-program-book" to={`/reservar?tipo=${encodeURIComponent(program.name)}`}>Ver sesiones de {program.title} <Arrow /></Link>
          <div className="alt-program-footnote"><span>EL PROGRESO ES PERSONAL.</span><span>EL IMPULSO ES DE TODOS.</span></div>
        </div>
      </div>}
    </div>)}
    <div className="alt-program-challenge"><DisciplineIcon name="competition" size={50} /><p>De tu primera sesión a tu próxima competencia híbrida.</p><Link to="/reservar">Construye tu base <Arrow /></Link></div>
  </section>;
}
