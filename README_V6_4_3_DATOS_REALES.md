# SmartPlant Portal V6.4.3 — Clientes y Proyectos con datos reales

## Cambios
- Consulta `erp_dashboard_clientes_proyectos` además de `erp_dashboard_despachos`.
- Elimina los valores fijos de respaldo para el mes y el último día.
- KPIs, rankings, concentración y comparación Día vs Mes usan los consolidados publicados por el ERP.
- La tabla de trazabilidad usa exclusivamente los despachos publicados en Supabase.
- Cuando faltan datos, muestra un mensaje de sincronización en vez de cifras históricas incrustadas.
