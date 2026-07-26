# Open Graph dinámico — SAS SmartPlant

## Enlace recomendado para compartir

https://sas-erp-reportes.vercel.app/compartir

Ese enlace genera metadatos dinámicos y redirige al usuario a `/resumen`.

## Qué actualiza automáticamente

- Última producción publicada.
- Diésel gal/T.
- AC30 kg/T.
- Costo por tonelada.
- Cantidad de alertas abiertas.
- Fecha y hora de actualización.

## Variables necesarias en Vercel

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Deben existir tanto para el frontend como para las funciones `/api/og` y `/api/share`.

## Archivos añadidos

- `api/og.tsx`: genera la imagen PNG de 1200 × 630.
- `api/share.ts`: genera los metadatos con una URL de imagen versionada.
- `public/planta-ciber-inova1500.jpg`: fotografía real de la planta.

## Prueba después del despliegue

1. Abra `https://sas-erp-reportes.vercel.app/api/og` y confirme que aparece la imagen.
2. Abra `https://sas-erp-reportes.vercel.app/compartir` y confirme la redirección.
3. Comparta `/compartir` en WhatsApp, no solamente la raíz del dominio.

WhatsApp mantiene caché de las vistas previas. El parámetro dinámico `?v=fecha_actualizacion` ayuda a generar una URL nueva cada vez que el ERP publica un periodo actualizado.
