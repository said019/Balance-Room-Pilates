# 2707 Altitud

Sitio de entrenamiento híbrido y funcional, rediseñado a partir del manual de marca y del briefing del studio.

## Vista local

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 2707
```

Abrir http://127.0.0.1:2707.

## Identidad

- Carrois Gothic Regular y Source Sans 3 Light, alojadas localmente.
- Carbón `#1C1C19`, marfil `#F6F4EE`, arena `#CFBD9D`, olivo `#5F632C`, tierra `#7F6146`.
- Los tres logotipos vectoriales y las fotografías de `public/brand` se extrajeron del PDF proporcionado. Los trazos, proporciones y colores de los logos son los originales; se excluyeron los fondos y textos de presentación del manual mediante recorte de vista y eliminación del fondo de página.
- La asociación entre nombres y colores sigue el briefing del usuario; la página de colores del PDF intercambia las etiquetas de tierra y olivo.

## Recorridos

- `/`: portada, studio, entrenamientos, comunidad, membresías y preguntas frecuentes.
- `/reservar`: agenda de muestra con filtros, fechas, confirmación, persistencia local y cancelación.
- `/pricing`: estado de preparación de membresías, sin precios inventados.
- `/login`, `/register`, `/forgot-password`: nueva experiencia de acceso.
- `/privacy`, `/terms`, `/cancellation-policy`: documentos pendientes de aprobación del nuevo studio.

La agenda es explícitamente ilustrativa. No cobra ni crea reservas reales. Las muestras solo se guardan en el navegador con la clave `altitud2707-preview-bookings`.

El frontend ya no apunta al servicio anterior. Antes de habilitar cuentas y operación real, configurar una API propia mediante `VITE_API_URL`, además de horarios, cupos, tarifas, contactos, ubicación exacta y políticas oficiales. No reutilizar bases de datos, proveedores de pago o credenciales del negocio anterior.

La aplicación conserva sus rutas de gestión y clientes, con identidad y estilos nuevos. Estas requieren un servicio de 2707 Altitud configurado; no se validaron contra datos de producción.

## Verificación

```sh
npm run build
npx tsc --noEmit -p tsconfig.app.json
```

## App de usuario

Vista recorrible sin credenciales: `/app/preview`.

La app comparte el nuevo diseño entre las pantallas de cliente y la vista previa: navegación lateral, barra inferior móvil, inicio, calendario, reservas, membresía y perfil. Las pantallas existentes de edición de datos, pagos, órdenes y eventos conservan sus operaciones dentro de la nueva navegación.

La vista previa utiliza `altitud2707-member-preview-v1` para guardar localmente reservas, cancelaciones y ajustes de ejemplo. No establece una sesión, no envía notificaciones, no realiza cobros y no hace peticiones a la API. Las rutas reales `/app` conservan su control de acceso y sus integraciones existentes.

Verificado en navegador: filtros y enlaces a disciplinas, confirmación y cancelación de reservas, crédito descontado/devuelto, persistencia al recargar, edición del perfil, preferencias y adaptación de las diez secciones a 320 px. La operación real con usuarios del studio requiere configurar su API.
