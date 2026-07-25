# SAS SmartPlant Executive Portal V4
## Multi-Page Responsive Architecture

### Rutas públicas
- `/resumen`
- `/produccion`
- `/combustible`
- `/ac30-laboratorio`
- `/equipos`
- `/costos-ranking`
- `/reportes`
- `/alertas`

La navegación utiliza la History API del navegador. Vercel redirige cada ruta a `index.html` mediante `vercel.json`, permitiendo abrir, actualizar y compartir directamente cualquier módulo.

### Mejoras V4
- URL independiente para cada módulo.
- Compatibilidad con los botones Atrás y Adelante.
- Menú móvil tipo drawer con overlay.
- Bloqueo de desplazamiento mientras el menú está abierto.
- Uso de `100dvh` para corregir espacios verticales en navegadores móviles.
- Encabezado móvil fijo y compacto.
- Dos columnas de indicadores en teléfonos y una columna en pantallas muy estrechas.
- Retorno automático al inicio al cambiar de módulo.

### Despliegue
1. Copiar `.env.example` como `.env`.
2. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev` para pruebas.
5. Ejecutar `npm run build` antes de publicar.
6. Publicar en Vercel conservando `vercel.json`.
