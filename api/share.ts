const SITE_URL = 'https://portal.sisprollc.com';
const PORTAL_URL = `${SITE_URL}/resumen`;
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
  const title = 'SmartPlant Portal • Inteligencia Operativa Industrial';
  const description =
    'Supervise producción, costos, inventarios, diésel, AC30 y calidad en tiempo real. Desarrollado por SISPRO LLC.';

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
    <meta property="og:site_name" content="SmartPlant Portal" />
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
      content="SmartPlant Portal, plataforma de inteligencia operativa para plantas industriales desarrollada por SISPRO LLC."
    />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${IMAGE_URL}" />
    <meta
      name="twitter:image:alt"
      content="SmartPlant Portal, plataforma de inteligencia operativa para plantas industriales desarrollada por SISPRO LLC."
    />

    <meta http-equiv="refresh" content="1;url=${PORTAL_URL}" />
  </head>

  <body>
    <p>
      Abriendo
      <a href="${PORTAL_URL}">SmartPlant Portal</a>…
    </p>

    <script>
      window.setTimeout(function () {
        window.location.replace(${JSON.stringify(PORTAL_URL)});
      }, 700);
    </script>
  </body>
</html>`);
}
