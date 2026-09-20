# 2707 Altitud · Íconos v1

32 íconos vectoriales creados para el sitio, la app y la administración. Retícula 24×24; trazo 1.65; extremos y uniones redondeados. El logotipo oficial se incluye sin cambios sólo para identificar el catálogo; no es un ícono de esta colección.

## Archivos
- svg/carbon, svg/olivo, svg/marfil: 32 SVG por variante, fondo transparente.
- png/carbon, png/olivo, png/marfil: 32 PNG transparentes de 256×256 por variante.
- sprite.svg: símbolos reutilizables por nombre.
- react/AltitudIcon.tsx: componente React con nombres tipados, sin biblioteca de íconos adicional.
- index.html: catálogo interactivo con búsqueda, cambio de color/tamaño, copia y descargaSVG.
- preview.png: lámina general de la colección.
- icons.json: nombres, categorías y geometría editable.

## Uso
En el proyecto: import { AltitudIcon } from '@/components/brand/AltitudIcon';
Ejemplo: <AltitudIcon name="reservar" size={24} title="Reservar clase" />.
Si el botón ya tiene texto o aria-label, omite title para evitar lectura duplicada.
Con sprite: <svg width="24" height="24"><use href="/brand/icons/sprite.svg#reservar" /></svg>.
Con img: usa alt descriptivo, o alt vacío si es decorativo. El SVG en img conserva su color exportado; para cambiarlo usa inline, sprite o el componente.

Usa 24/32 px en controles; 48/64 px en destacados. A 20 px reduce sólo cuando exista una etiqueta. Usa carbón u olivo sobre marfil; marfil sobre carbón. Arena y café son colores complementarios de la marca, no tintas predeterminadas para controles. Conserva proporciones y trazo uniforme; no estires ni combines estilos.

Los archivos SVG se pueden importar a Figma. Para abrir el catálogo sin servidor, abre index.html; copiarSVG tiene alternativa manual si el navegador restringe el portapapeles. Para regenerarSVG y React desde la geometría: node design/altitud-icons-v1/build.mjs desde la raíz del frontend. La exportaciónPNG y el ZIP se generan en un paso posterior.

Entrega del 9 de septiembre de 2026. Colección preparada para integrar; no sustituye automáticamente los íconos actuales de la app ni habilita funciones del negocio.
