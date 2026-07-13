# ERP Report Center

## 1. Supabase
1. Cree un proyecto.
2. Ejecute `supabase/schema.sql` en SQL Editor.
3. En Storage cree un bucket **público** llamado `erp-reportes`.

## 2. ERP
Cree `.streamlit/secrets.toml`:
```toml
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="service-role-key"
SUPABASE_REPORT_BUCKET="erp-reportes"
ERP_PORTAL_URL="https://tu-proyecto.vercel.app"
```
Nunca coloque la service role key en React ni en Vercel.

## 3. Dashboard
Copie `.env.example` a `.env.local` y complete URL + anon key.
```bash
npm install
npm run dev
```

## 4. Vercel
Importe la carpeta `portal_dashboard` como proyecto y configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_COMPANY_NAME`

El ERP publica datos mediante las APIs REST y Storage de Supabase. El dashboard consulta Supabase al abrirse o al pulsar Actualizar; no requiere un nuevo despliegue.
