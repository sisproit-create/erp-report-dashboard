# SAS SmartPlant Executive Portal V6
## Live Operations Center

V6 conserva la integración ERP → Supabase → Portal y añade una capa ejecutiva dinámica sin modificar las tablas existentes.

## Motores incorporados

- Live Operations Center
- Executive Score Engine
- KPI Trend Engine
- Live Activity Engine
- Executive Insights Engine
- Smart Reports Engine
- Mobile Premium Engine

## Estructura

```text
src/
├── App.tsx
├── lib/supabase.ts
└── v6/
    ├── components/LiveOperationsCenter.tsx
    ├── hooks/useLiveClock.ts
    └── utils/trends.ts
```

## Publicación

```bash
npm install
npm run build
git add .
git commit -m "SAS SmartPlant Executive Portal V6 Live Operations Center"
git push origin main
```
