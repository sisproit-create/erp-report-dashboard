# Actualización de marca · SmartPlant Portal

## Identidad aplicada

- Producto: **SmartPlant Portal**
- Posicionamiento: **Inteligencia Operativa para Plantas Industriales**
- Empresa desarrolladora: **SISPRO LLC**
- Dominio principal: `https://portal.sisprollc.com`

## Cambios realizados

- Sustitución de “SAS SmartPlant” en la interfaz principal.
- Inclusión de “Desarrollado por SISPRO LLC” en la barra lateral y el pie de página.
- Actualización del encabezado superior a “SmartPlant Portal · Inteligencia Operativa”.
- Actualización de título, descripción, canonical, Open Graph y Twitter Cards.
- Actualización de `api/share.ts` para usar el dominio corporativo y redirigir a `/resumen`.
- Eliminación de `api/og.tsx`, ya que la vista previa usa la imagen estática estable `public/og-smartplant.jpg`.
- Eliminación de la dependencia `@vercel/og`.
- Cambio del nombre técnico del paquete a `smartplant-portal`.

## URL para compartir

`https://portal.sisprollc.com/compartir?v=1`

El parámetro `v` puede incrementarse cuando WhatsApp conserve una vista previa anterior en caché.
