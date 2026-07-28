import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Droplets,
  Factory,
  FileText,
  Gauge,
  Radio,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useLiveClock } from '../hooks/useLiveClock';
import type { Comparison, TrendStatus } from '../utils/trends';

type Props = {
  summary: any;
  series: any[];
  alerts: any[];
  reports: any[];
  latestUpdate?: string;
};

const fmt = new Intl.NumberFormat('es-PA', { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('es-PA', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function finiteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function signed(value: number, unit = '') {
  const prefix = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${prefix}${fmt.format(Math.abs(value))}${unit}`;
}

function compareToReference(
  currentValue: unknown,
  referenceValue: unknown,
  positiveWhenHigher = true,
): Comparison {
  const current = finiteNumber(currentValue);
  const reference = finiteNumber(referenceValue);

  if (current === null || reference === null) {
    return {
      direction: 'flat',
      delta: 0,
      percent: 0,
      reference: null,
      favorable: true,
      status: 'neutral',
      statusLabel: 'Sin referencia',
    };
  }

  const delta = current - reference;
  const percent = reference === 0 ? 0 : (delta / Math.abs(reference)) * 100;
  const tolerance = Math.max(Math.abs(reference) * 0.005, 0.0001);
  const direction =
    Math.abs(delta) <= tolerance ? 'flat' : delta > 0 ? 'up' : 'down';
  const favorable =
    direction === 'flat' ||
    (positiveWhenHigher ? delta > 0 : delta < 0);

  let status: TrendStatus = 'neutral';
  let statusLabel = 'Estable';

  if (direction !== 'flat') {
    if (favorable) {
      status = 'optimal';
      statusLabel = 'Óptimo';
    } else if (Math.abs(percent) >= 10) {
      status = 'critical';
      statusLabel = 'Revisar';
    } else {
      status = 'attention';
      statusLabel = 'Atención';
    }
  }

  return {
    direction,
    delta,
    percent: Math.abs(percent),
    reference,
    favorable,
    status,
    statusLabel,
  };
}

function ComparisonBadge({
  comparison,
  unit,
  referenceText,
}: {
  comparison: Comparison;
  unit?: string;
  referenceText: string;
}) {
  const Icon =
    comparison.direction === 'up'
      ? TrendingUp
      : comparison.direction === 'down'
        ? TrendingDown
        : Activity;

  if (comparison.reference === null) {
    return (
      <div className="v61-comparison neutral">
        <span>
          <Icon size={14} /> Sin referencia suficiente
        </span>
        <small>No existe un valor mensual comparable.</small>
      </div>
    );
  }

  return (
    <div className={`v61-comparison ${comparison.status}`}>
      <span>
        <Icon size={14} />
        <strong>{signed(comparison.delta, unit)}</strong> ·{' '}
        {comparison.percent.toFixed(1)}%
      </span>
      <small>
        {referenceText} · <b>{comparison.statusLabel}</b>
      </small>
    </div>
  );
}

function DailyMonthlyCard({
  icon: Icon,
  label,
  current,
  currentSuffix = '',
  average,
  averageSuffix = '',
  comparison,
  formatter = fmt.format,
  className = '',
}: {
  icon: any;
  label: string;
  current: number | null;
  currentSuffix?: string;
  average: number | null;
  averageSuffix?: string;
  comparison: Comparison;
  formatter?: (value: number) => string;
  className?: string;
}) {
  return (
    <article
      className={`v6-status-card v63-dual-kpi ${comparison.status} ${className}`}
    >
      <span>
        <Icon /> {label}
      </span>

      <div className="v63-kpi-primary">
        <small>HOY / ÚLTIMO REGISTRO</small>
        <strong>
          {current === null ? '—' : formatter(current)}
          {current === null ? '' : currentSuffix}
        </strong>
      </div>

      <ComparisonBadge
        comparison={comparison}
        unit={currentSuffix}
        referenceText="vs promedio mensual"
      />

      <div className="v63-month-reference">
        <span>Promedio mensual</span>
        <strong>
          {average === null ? '—' : formatter(average)}
          {average === null ? '' : averageSuffix}
        </strong>
      </div>
    </article>
  );
}

export function LiveOperationsCenter({
  summary,
  series,
  alerts,
  reports,
  latestUpdate,
}: Props) {
  const now = useLiveClock();
  const latest = series.length ? series[series.length - 1] : undefined;

  const critical = alerts.filter(
    (alert) => String(alert.severidad).toLowerCase() === 'critica',
  ).length;
  const warnings = alerts.filter(
    (alert) => String(alert.severidad).toLowerCase() === 'advertencia',
  ).length;
  const prioritized = reports.filter(
    (report) => report.destacado === true,
  ).length;
  const updateDate = latestUpdate ? new Date(latestUpdate) : null;

  const productionToday = finiteNumber(latest?.toneladas);
  const productionAverage = finiteNumber(summary.produccion_promedio);

  const costToday = finiteNumber(latest?.costo_ton);
  const costMonthly = finiteNumber(summary.costo_total_ton);

  const dieselToday = finiteNumber(latest?.diesel_gal_ton);
  const dieselMonthly = finiteNumber(summary.diesel_ton);

  const ac30Today =
    finiteNumber(latest?.ac30_kg_ton) ??
    finiteNumber(summary.ac30_kg_ton);
  const ac30Monthly = finiteNumber(summary.ac30_kg_ton);

  const productionComparison = compareToReference(
    productionToday,
    productionAverage,
    true,
  );
  const costComparison = compareToReference(
    costToday,
    costMonthly,
    false,
  );
  const dieselComparison = compareToReference(
    dieselToday,
    dieselMonthly,
    false,
  );
  const ac30Comparison = compareToReference(
    ac30Today,
    ac30Monthly,
    false,
  );

  const estimatedRunCost =
    productionToday !== null && costToday !== null
      ? productionToday * costToday
      : null;

  const events = [
    {
      icon: Database,
      title: 'Dashboard sincronizado',
      detail: updateDate
        ? updateDate.toLocaleString('es-PA')
        : 'Pendiente',
    },
    {
      icon: Factory,
      title: 'Último registro de producción',
      detail: latest
        ? `${latest.fecha} · ${fmt.format(productionToday ?? 0)} t`
        : 'Sin registro',
    },
    {
      icon: Gauge,
      title: 'Costo de la última corrida',
      detail:
        costToday !== null
          ? `${money.format(costToday)}/T`
          : 'Sin registro',
    },
    {
      icon: Droplets,
      title: 'Consumo AC30 del día',
      detail:
        ac30Today !== null
          ? `${fmt.format(ac30Today)} kg/T`
          : 'Sin registro',
    },
    {
      icon: FileText,
      title: 'Reportes ejecutivos activos',
      detail: `${prioritized} seleccionados desde el ERP`,
    },
  ];

  return (
    <section className="v6-live-center v62-executive-dashboard v63-executive-dashboard">
      <div className="v6-live-hero">
        <div>
          <span className="v6-live-label">
            <Radio size={15} /> LIVE OPERATIONS CENTER · V6.4
          </span>
          <h2>DMI Panamá · Estado operativo</h2>
          <p>
            Comparación directa entre el último registro operativo y el
            promedio mensual publicado por el ERP.
          </p>
        </div>

        <div className="v6-live-clock">
          <Clock3 size={18} />
          <strong>
            {now.toLocaleTimeString('es-PA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </strong>
          <span>
            {now.toLocaleDateString('es-PA', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      <div className="v6-status-grid v63-status-grid">
        <article className="v6-status-card live v63-plant-card">
          <span>
            <CheckCircle2 /> Planta
          </span>
          <strong>ONLINE</strong>
          <small>Operación conectada</small>

          <div className="v63-plant-meta">
            <span>Última fecha operativa</span>
            <strong>{latest?.fecha ? new Date(`${latest.fecha}T12:00:00`).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin registro'}</strong>
          </div>
        </article>

        <DailyMonthlyCard
          icon={Factory}
          label="Producción"
          current={productionToday}
          currentSuffix=" t"
          average={productionAverage}
          averageSuffix=" t"
          comparison={productionComparison}
        />

        <DailyMonthlyCard
          icon={Gauge}
          label="Costo/T"
          current={costToday}
          currentSuffix="/T"
          average={costMonthly}
          averageSuffix="/T"
          comparison={costComparison}
          formatter={(value) => money.format(value)}
        />

        <DailyMonthlyCard
          icon={RefreshCw}
          label="Diésel"
          current={dieselToday}
          currentSuffix=" gal/T"
          average={dieselMonthly}
          averageSuffix=" gal/T"
          comparison={dieselComparison}
        />

        <DailyMonthlyCard
          icon={Droplets}
          label="AC30"
          current={ac30Today}
          currentSuffix=" kg/T"
          average={ac30Monthly}
          averageSuffix=" kg/T"
          comparison={ac30Comparison}
          className="v62-ac30-card"
        />

        <article
          className={`v6-status-card v63-alert-card ${
            critical ? 'critical' : warnings ? 'warning' : 'live'
          }`}
        >
          <span>
            <AlertTriangle /> Alertas
          </span>
          <strong>{critical + warnings}</strong>
          <small>
            {critical
              ? `${critical} críticas`
              : warnings
                ? `${warnings} requieren atención`
                : 'Sin alertas relevantes'}
          </small>

          <div className="v63-month-reference">
            <span>Costo estimado última corrida</span>
            <strong>
              {estimatedRunCost === null
                ? '—'
                : money.format(estimatedRunCost)}
            </strong>
          </div>
        </article>
      </div>

      <div className="v61-reference-note v63-reference-note">
        <Activity size={15} />
        <span>
          La cifra principal corresponde al último registro diario de la
          serie. La cifra inferior corresponde al promedio mensual del
          resumen ERP. De esta forma, costo, diésel y AC30 ya no mezclan
          valores diarios con valores acumulados.
        </span>
      </div>

      <div className="v6-live-lower">
        <div className="v6-insights">
          <span className="v6-panel-kicker">EXECUTIVE INSIGHTS</span>
          <h3>Lectura del día frente al mes</h3>
          <ul>
            <li>
              La última producción fue de{' '}
              <strong>
                {productionToday === null
                  ? 'sin dato'
                  : `${fmt.format(productionToday)} t`}
              </strong>{' '}
              frente a un promedio mensual de{' '}
              <strong>
                {productionAverage === null
                  ? 'sin dato'
                  : `${fmt.format(productionAverage)} t`}
              </strong>
              .
            </li>
            <li>
              El costo del último registro es{' '}
              <strong>
                {costToday === null
                  ? 'sin dato'
                  : `${money.format(costToday)}/T`}
              </strong>{' '}
              frente al promedio mensual de{' '}
              <strong>
                {costMonthly === null
                  ? 'sin dato'
                  : `${money.format(costMonthly)}/T`}
              </strong>
              .
            </li>
            <li>
              El diésel del último registro es{' '}
              <strong>
                {dieselToday === null
                  ? 'sin dato'
                  : `${fmt.format(dieselToday)} gal/T`}
              </strong>{' '}
              y el AC30 es{' '}
              <strong>
                {ac30Today === null
                  ? 'sin dato'
                  : `${fmt.format(ac30Today)} kg/T`}
              </strong>
              .
            </li>
            <li>
              La salud ejecutiva se mantiene en{' '}
              <strong>{fmt.format(summary.puntaje)}/100</strong> con un
              margen estimado de{' '}
              <strong>{fmt.format(summary.margen_pct)}%</strong>.
            </li>
          </ul>
        </div>

        <div className="v6-activity-feed">
          <span className="v6-panel-kicker">ACTIVIDAD RECIENTE</span>
          <h3>Flujo del sistema</h3>
          {events.map(({ icon: Icon, title, detail }) => (
            <div className="v6-event" key={title}>
              <span>
                <Icon size={16} />
              </span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
