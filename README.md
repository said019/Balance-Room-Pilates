# 2707 Altitud

Frontend del sitio público, app de miembros y administración del studio. La API y sus migraciones pertenecen al proyecto backend; este repositorio no conecta directamente a PostgreSQL ni contiene herramientas para sembrar planes.

## Desarrollo local

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 2707
```

Configura `VITE_API_URL` con la API de 2707 Altitud para consultar datos. Para el proxy del mismo origen usa `VITE_API_URL=/api` también al compilar. Sin configuración explícita, el acceso se mantiene en modo de preparación. Un catálogo vacío o no disponible se muestra como tal, sin paquetes de reemplazo.

Para servir una compilación real con proxy local:

```sh
VITE_API_URL=/api npm run build
PORT=2707 HOST=127.0.0.1 API_PROXY_TARGET=http://127.0.0.1:3001/api npm start
```

El puerto de la API es un ejemplo local: usa el del backend que hayas iniciado. No pongas credenciales ni `DATABASE_URL` en variables `VITE_*`.

## Identidad y contenido

Se conservan los logotipos oficiales, fotografías del manual y fotografías de entrenamiento entregadas para Altitud bajo `public/brand`. Tipografías locales: Carrois Gothic y Source Sans 3. Paleta: carbón `#1C1C19`, marfil `#F6F4EE`, arena `#CFBD9D`, olivo `#5F632C`, tierra `#7F6146`.

- `/`, `/pricing` y `/app/checkout` consultan los planes activos de la API. Nombre, precio y vigencia se administran desde el backend. Una lectura nunca crea paquetes.
- Los planes con procedencia pendiente aparecen en «Planes por revisar» en administración; no se borran ni se desactivan automáticamente desde la interfaz.
- `/reservar` requiere inicio de sesión y continúa en `/app/book`.
- `/app/preview` permite explorar la app sin una cuenta. Sus 12 créditos son de muestra, no un plan a la venta. Consulta las sesiones publicadas, pero guarda sus acciones sólo en el navegador (`altitud2707-member-preview-v3`).
- Las reglas de cancelación públicas y de la app provienen de la configuración operativa de la API.

Los precios confirmados originalmente en el briefing se conservan como antecedente en `PRODUCT.md`; no son un catálogo de respaldo ni una instrucción para regenerar planes. Las credenciales, proveedores y datos bancarios se configuran en el backend.

## Imágenes y compilación

En desarrollo se usan los archivos fuente de `public/brand`. La compilación genera `dist/media-migration-manifest.json`, retira las copias multimedia y utiliza las rutas `/api/media/...` del backend. El catálogo multimedia del entorno debe contener esos archivos. Ver [STORAGE.md](STORAGE.md).

## Verificación

```sh
npm run test:unit
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

Las suites actuales de integración están en `tests/e2e-audit` y `tests/e2e-configuration`, con guardas explícitas para bases locales desechables y usuarios sintéticos. No se ejecutan contra producción. Las pruebas antiguas de `e2e/` se conservan como referencia; requieren cuentas autorizadas en variables de entorno y ya no incluyen credenciales de otro negocio.

`docs/audit` conserva evidencia histórica. Otros documentos históricos están identificados como tales y no sustituyen esta guía ni la configuración del entorno actual.
