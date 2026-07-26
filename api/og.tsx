import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

type Summary = {
  periodo?: string;
  fecha_actualizacion?: string;
};

type SeriesRow = {
  fecha?: string;
  toneladas?: number | string;
  costo_ton?: number | string;
  diesel_gal_ton?: number | string;
  ac30_kg_ton?: number | string;
};

type AlertRow = { estado?: string };

const num = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const fmt = (value: unknown, digits = 2) =>
  new Intl.NumberFormat('es-PA', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num(value));

async function supabaseGet<T>(path: string): Promise<T | null> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

export default async function handler(request: Request) {
  const origin = new URL(request.url).origin;

  const summaries = await supabaseGet<Summary[]>(
    'erp_dashboard_resumen?select=periodo,fecha_actualizacion&order=periodo.desc&limit=1',
  );
  const summary = summaries?.[0];
  const period = summary?.periodo;
  const periodFilter = period ? `&periodo=eq.${encodeURIComponent(period)}` : '';

  const [seriesRows, alertRows] = await Promise.all([
    supabaseGet<SeriesRow[]>(
      `erp_dashboard_series?select=fecha,toneladas,costo_ton,diesel_gal_ton,ac30_kg_ton${periodFilter}&order=fecha.desc&limit=1`,
    ),
    supabaseGet<AlertRow[]>(
      `erp_alertas?select=estado${periodFilter}&estado=eq.abierta`,
    ),
  ]);

  const latest = seriesRows?.[0] ?? {};
  const alerts = alertRows?.length ?? 0;
  const updatedAt = summary?.fecha_actualizacion
    ? new Date(summary.fecha_actualizacion)
    : new Date();
  const updatedLabel = updatedAt.toLocaleString('es-PA', {
    timeZone: 'America/Panama',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const card = (label: string, value: string, detail: string, accent: string) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 250,
        height: 142,
        padding: '20px 22px',
        borderRadius: 22,
        border: `1px solid ${accent}`,
        background: 'rgba(2, 22, 38, 0.88)',
        boxShadow: '0 12px 32px rgba(0,0,0,.28)',
      }}
    >
      <div style={{ display: 'flex', fontSize: 18, letterSpacing: 2, color: '#9fb5c5' }}>{label}</div>
      <div style={{ display: 'flex', fontSize: 37, fontWeight: 800, color: '#f6fbff' }}>{value}</div>
      <div style={{ display: 'flex', fontSize: 15, color: accent }}>{detail}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          background: '#00101f',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <img
          src={`${origin}/planta-ciber-inova1500.jpg`}
          width="1200"
          height="630"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(90deg, rgba(0,10,23,.98) 0%, rgba(0,18,34,.94) 45%, rgba(0,18,34,.40) 72%, rgba(0,10,23,.24) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: '42px 46px 34px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #16d9d0',
                  background: 'rgba(0,58,76,.82)',
                  color: '#22e3b8',
                  fontSize: 34,
                  fontWeight: 900,
                }}
              >
                S
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: 34, fontWeight: 900, letterSpacing: 1 }}>
                  SAS <span style={{ color: '#20ddb0', marginLeft: 10 }}>SMARTPLANT</span>
                </div>
                <div style={{ display: 'flex', fontSize: 17, letterSpacing: 6, color: '#c9d7e2' }}>
                  EXECUTIVE PORTAL
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '13px 18px',
                borderRadius: 16,
                border: '1px solid #19bcdc',
                background: 'rgba(1,29,48,.86)',
              }}
            >
              <div style={{ display: 'flex', fontSize: 17, color: '#22d7f4', fontWeight: 800 }}>● PLANTA ONLINE</div>
              <div style={{ display: 'flex', fontSize: 13, color: '#b8c9d5', marginTop: 4 }}>DMI Panamá · CIBER iNOVA 1500</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40 }}>
            <div style={{ display: 'flex', fontSize: 43, fontWeight: 900, letterSpacing: .4 }}>SUPERVISE LA PLANTA</div>
            <div style={{ display: 'flex', fontSize: 43, fontWeight: 900, color: '#20ddb0', letterSpacing: .4 }}>DESDE CUALQUIER LUGAR.</div>
            <div style={{ display: 'flex', marginTop: 13, fontSize: 20, color: '#c5d3dd' }}>
              Producción, costos, diésel, AC30 y calidad en tiempo real.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, marginTop: 34 }}>
            {card('ÚLTIMA PRODUCCIÓN', `${fmt(latest.toneladas, 0)} t`, latest.fecha ? `Corrida ${latest.fecha}` : 'Última corrida publicada', '#22d7f4')}
            {card('DIÉSEL', `${fmt(latest.diesel_gal_ton)} gal/T`, 'Eficiencia operativa', '#20ddb0')}
            {card('AC30', `${fmt(latest.ac30_kg_ton)} kg/T`, 'Dosificación registrada', '#22d7f4')}
            {card('COSTO/T', `USD ${fmt(latest.costo_ton)}`, alerts ? `${alerts} alerta(s) abierta(s)` : 'Sin alertas relevantes', alerts ? '#f5b63c' : '#20ddb0')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div style={{ display: 'flex', fontSize: 14, letterSpacing: 2.4, color: '#6fd7e8' }}>INDUSTRIAL INTELLIGENCE PLATFORM</div>
            <div style={{ display: 'flex', fontSize: 14, color: '#c4d2dc' }}>Actualizado: {updatedLabel}</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    },
  );
}
