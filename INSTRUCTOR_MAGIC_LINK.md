# Acceso de coaches · 2707 Altitud

El acceso de un coach se administra desde la sección de equipo y usa los servicios de autenticación del backend de Altitud. Las invitaciones quedan registradas en la cola de notificaciones: encolar una invitación no significa que haya sido entregada.

La configuración de envío y sus credenciales se realiza en el backend. No reutilices dominios, cuentas ni variables de otro studio. Consulta el estado y los pendientes en administración antes de anunciar que el envío está disponible.

Las pruebas actuales de acceso, permisos y notificaciones se encuentran en `tests/e2e-audit` y `tests/unit`. Se ejecutan con usuarios sintéticos y servicios locales; no envían correos externos.
