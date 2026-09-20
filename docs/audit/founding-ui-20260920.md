# Founding 50: operación de admin y recepción

Implementación local auditada; no es autorización de despliegue ni veredicto GO global.

## Alcance

- Ruta `/admin/founding50`, protegida para admin, super_admin y recepción. Recepción accede desde Llegadas sin abrir navegación administrativa global.
- Historial, número de miembro y cupo leídos de GET `/founding50`. Alta exige búsqueda de cliente activo, pago recibido por $1,299 y confirmación del servidor; no reserva lugares gratis.
- Renovación envía el último ciclo observado. Intento financiero conserva Idempotency-Key tras respuesta incierta y consulta nuevamente el historial después del éxito.
- Transferencia exige folio y comprobante privado subido con dueño cliente. Efectivo y tarjeta registran un pago recibido, no ejecutan cargos externos.
- Se muestran seis meses desde activación. El séptimo pago no se ofrece porque su política continúa pendiente. No se habilitó compra pública ni un endpoint personal inexistente.
- Estados de carga, error/reintento, vacío, cupo completo, beneficio perdido, transferencia incompleta y operación pendiente representados con controles accesibles. Inputs mínimo16px para móvil.

## Evidencia y regresión

`../../evidence/founding/` respecto a este frontend aislado:

- `ui-red.txt`: prueba falla antes del componente.
- `ui-green.txt`: 6 pruebas RTL del módulo pasan. `ui-suite.txt`: 40 pruebas,7 suites globales verdes.
- `ui-tsc.txt`: typecheck termina0. `ui-build.txt`: build con NODE_ENV=production y VITE_API_URL=/api termina0.
- `ui-e2e-final.txt` y `playwright-ui.json`: dos escenarios Chromium390px sobre build real y API real local.
- `ui-cash-sql.json`: búsqueda recepción → primer pago → respuesta503 inyectada DESPUÉS del commit → mismo idempotency key → exactamente un periodo; renovación → dos periodos consecutivos y dos importes1299, Unlimitedsinlímite.
- `ui-transfer-sql.json`: búsqueda admin → upload privado con dueño cliente → pago aprobado/revisor correcto y exactamente un ciclo1299.
- `founding-reception-390.png` y `founding-admin-390.png`: evidencia visual. Sin desbordamiento horizontal en recepción.

Base única de pruebas54349/altitud_2707; API3419, web3519, doble Drive3429. No producción, banco, correo ni Drive externo. Los registros sintéticos de estas pruebas se conservan por UUID en la base desechable para consulta del supervisor; no hay limpieza masiva automática. La campaña debe tener dos lugares disponibles por ejecución E2E. No ejecutar el script backend de concurrencia sobre datos a conservar: ese script prepara su propio escenario sintético.

## Reproducción aislada

1. Migrar backend028 y montar `/founding50` (contratos dd0f32b,f56c64c y mount69cd1ae o integración equivalente).
2. Usar `../test-env.json` limpio con DATABASE_URL local54349 y NODE_ENVtest. Configurar MEDIA_DRIVE_TEST_ORIGIN=http://127.0.0.1:3429, credenciales Google literalmente `synthetic`, carpetas `synthetic-public`/`synthetic-private`.
3. Ejecutar `tests/e2e-founding/drive-provider.cjs` con ese entorno y levantar backend `src/altitud.ts`; ningún job habilitado.
4. Build production y servidor `HOST=127.0.0.1 PORT=3519 API_PROXY_TARGET=http://127.0.0.1:3419/api node server.mjs`.
5. `python3 tests/e2e-founding/run.py`; el runner conserva guard de red local del área auditada.

La suite usa Page Object Model, fixtures propias y AAA con consultas SQL. Esto valida los flujos nuevos; no demuestra cobertura100%, todos los dispositivos ni instalación PWA/Safari.
