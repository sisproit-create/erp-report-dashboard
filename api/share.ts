const SITE_URL = 'https://sas-erp-reportes.vercel.app';
const PORTAL_URL = `${SITE_URL}/`;
const SHARE_URL = `${SITE_URL}/compartir`;
const IMAGE_URL = `${SITE_URL}/og-smartplant.jpg`;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function handler(_request: any, response: any): void {
  const title = 'SAS SmartPlant • Executive Portal';
  const description =
    'Supervise la planta desde cualquier lugar. Producción, costos, diésel, AC30 y calidad en tiempo real.';

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);

  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.setHeader(
    'Cache-Control',
    'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
  );

  response.status(200).send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <link rel="canonical" href="${SHARE_URL}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="SAS SmartPlant" />
    <meta property="og:locale" content="es_PA" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${SHARE_URL}" />
    <meta property="og:image" content="${IMAGE_URL}" />
    <meta property="og:image:secure_url" content="${IMAGE_URL}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta
      property="og:image:alt"
      content="SAS SmartPlant Executive Portal para supervisión en tiempo real de la planta DMI."
    />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${IMAGE_URL}" />
    <meta
      name="twitter:image:alt"
      content="SAS SmartPlant Executive Portal para supervisión en tiempo real de la planta DMI."
    />

    <meta http-equiv="refresh" content="1;url=${PORTAL_URL}" />
  </head>

  <body>
    <p>
      Abriendo
      <a href="${PORTAL_URL}">SAS SmartPlant Executive Portal</a>…
    </p>

    <script>
      window.setTimeout(function () {
        window.location.replace(${JSON.stringify(PORTAL_URL)});
      }, 700);
    </script>
  </body>
</html>`);
}
