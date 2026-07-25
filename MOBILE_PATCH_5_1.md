# Executive Portal V5 Enterprise · Mobile Responsive Patch 5.1

## Cambios principales

- Altura dinámica con `100dvh` y respaldo `100svh`/`100vh`.
- Compatibilidad con áreas seguras de iPhone mediante `viewport-fit=cover`.
- Encabezado móvil compacto y fijo, sin espacios verticales innecesarios.
- Menú lateral tipo drawer con overlay, bloqueo de scroll y desplazamiento táctil.
- Tarjetas KPI en dos columnas y una columna en teléfonos estrechos.
- Reportes móviles más compactos, con títulos largos ajustados automáticamente.
- Tablas con desplazamiento horizontal controlado.
- Correcciones para orientación horizontal y navegadores móviles.
- Se conserva toda la lógica de Supabase, rutas, indicadores e interpretaciones gerenciales.

## Instalación

Reemplaza el contenido del repositorio con este paquete y ejecuta:

```bash
npm install
npm run build
git add .
git commit -m "Executive Portal V5 Enterprise Mobile Responsive Patch 5.1"
git push origin main
```
