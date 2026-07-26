# SAS SmartPlant Executive Portal V6.1

## KPI Reference & Status Patch

V6.1 replaces ambiguous percentages such as “745% favorable” with an explicit operational comparison:

- Current value.
- Absolute difference.
- Percentage variation.
- Comparison reference.
- Operational status: Óptimo, Atención, Revisar or Estable.

### References used

- **Última producción:** last production record versus the previous production record.
- **Costo/T:** latest daily cost/T versus the average of prior daily records in the selected period.
- **Diésel:** latest daily gal/T versus the average of prior daily records in the selected period.

Lower values are considered favorable for cost and diesel. Higher values are considered favorable for production.
