# SAS SmartPlant Executive Portal V5

## Cambios principales

- Navegación por rutas independientes para Resumen, Producción, Combustible, AC30 y Laboratorio, Equipos, Costos, Reportes y Alertas.
- Módulo Reportes ordenado del archivo generado más reciente al más antiguo.
- Orden robusto usando `created_at` cuando está disponible y `fecha_publicacion` como respaldo.
- Fecha y hora de generación visibles en cada tarjeta de reporte.
- Compatibilidad responsive para escritorio, tablet y móvil.
- Reescritura de rutas preparada para Vercel.

## Reemplazo

Copie el contenido de esta carpeta sobre el repositorio `erp-report-dashboard`, reemplazando los archivos existentes.

```bash
npm install
npm run build
git add .
git commit -m "Actualizar SAS SmartPlant Executive Portal V5"
git push origin main
```

## Variables requeridas

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
