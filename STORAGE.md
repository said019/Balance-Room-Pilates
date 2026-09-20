# Multimedia de 2707 Altitud

Los originales de identidad y fotografía de este frontend viven en `public/brand`. No se modifican los logos del manual ni se reemplazan las fotografías de Altitud al limpiar contenido antiguo.

El plugin `build/drive-media.ts` genera un manifiesto con las rutas y hashes de los medios. La compilación elimina los binarios multimedia del directorio de salida y transforma sus referencias para servirlos mediante `/api/media/path/...`. El backend mantiene el catálogo en PostgreSQL y obtiene el archivo de Drive. Imágenes de perfil y comprobantes usan rutas privadas que requieren autorización.

La configuración y migración del proveedor pertenecen al backend. Una compilación del frontend no carga archivos en Drive, no crea registros multimedia y no activa proveedores. Si el catálogo de un entorno aún no está preparado, debe configurarse expresamente en ese entorno.

Las pruebas de navegador usan un servidor HTTP local de archivos sintéticos; eso no certifica acceso a una cuenta real de Drive. Las pruebas PWA verifican que las rutas de API no queden almacenadas por el service worker.
