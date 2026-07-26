type Summary = { fecha_actualizacion?: string };

async function latestVersion(): Promise<string> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return String(Date.now());

  try {
    const response = await fetch(
      `${url}/rest/v1/erp_dashboard_resumen?select=fecha_actualizacion&order=periodo.desc&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' },
    );
    if (!response.ok) return String(Date.now());
    const rows = (await response.json()) as Summary[];
    return encodeURIComponent(rows[0]?.fecha_actualizacion || String(Date.now()));
  } catch {
    return String(Date.now());
  }
}

export default async function handler(req: any, res: any) {
  const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers.host || 'sas-erp-reportes.vercel.app';
  const origin = `${protocol}://${host}`;
  const version = await latestVersion();
  const image = `${origin}/api/og?v=${version}`;
  const portal = `${origin}/resumen`;
  const title = 'SAS SmartPlant • Executive Portal';
  const description = 'Supervise la planta desde cualquier lugar. Producción, costos, diésel, AC30 y calidad en tiempo real.';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SAS SmartPlant">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${origin}/compartir">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0;url=${portal}">
<script>window.location.replace(${JSON.stringify(portal)});</script>
</head>
<body><p>Abriendo <a href="${portal}">SAS SmartPlant Executive Portal</a>…</p></body>
</html>`);
}
