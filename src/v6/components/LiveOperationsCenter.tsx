import {
  Activity, AlertTriangle, CheckCircle2, Clock3, Database, Droplets, Factory,
  FileText, Gauge, Radio, RefreshCw, TrendingDown, TrendingUp,
} from 'lucide-react';
import { useLiveClock } from '../hooks/useLiveClock';
import { compareWithPrevious, compareWithPriorAverage, type Comparison } from '../utils/trends';

type Props = { summary:any; series:any[]; alerts:any[]; reports:any[]; latestUpdate?:string };
const fmt = new Intl.NumberFormat('es-PA', { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('es-PA', { style:'currency', currency:'USD', maximumFractionDigits:2 });

function signed(value:number, unit='') {
  const prefix = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${prefix}${fmt.format(Math.abs(value))}${unit}`;
}

function ComparisonBadge({comparison,unit,referenceText}:{comparison:Comparison;unit?:string;referenceText:string}){
  const Icon = comparison.direction === 'up' ? TrendingUp : comparison.direction === 'down' ? TrendingDown : Activity;
  if (comparison.reference === null) {
    return <div className="v61-comparison neutral"><span><Icon size={14}/> Sin referencia suficiente</span><small>Se requieren al menos dos registros.</small></div>;
  }
  return <div className={`v61-comparison ${comparison.status}`}>
    <span><Icon size={14}/><strong>{signed(comparison.delta,unit)}</strong> · {comparison.percent.toFixed(1)}%</span>
    <small>{referenceText} · <b>{comparison.statusLabel}</b></small>
  </div>;
}

export function LiveOperationsCenter({summary,series,alerts,reports,latestUpdate}:Props){
  const now=useLiveClock();
  const latest=series.length ? series[series.length - 1] : undefined;
  const critical=alerts.filter(a=>String(a.severidad).toLowerCase()==='critica').length;
  const warnings=alerts.filter(a=>String(a.severidad).toLowerCase()==='advertencia').length;
  const prioritized=reports.filter(r=>r.destacado===true).length;
  const updateDate=latestUpdate?new Date(latestUpdate):null;

  const productionComparison=compareWithPrevious(series.map(x=>Number(x.toneladas)),true);
  const costComparison=compareWithPriorAverage(series.map(x=>Number(x.costo_ton)),false);
  const dieselComparison=compareWithPriorAverage(series.map(x=>Number(x.diesel_gal_ton)),false);
  const ac30Comparison=compareWithPriorAverage(series.map(x=>Number(x.ac30_kg_ton)),false);

  const ac30Today = latest && Number.isFinite(Number(latest.ac30_kg_ton))
    ? Number(latest.ac30_kg_ton)
    : Number(summary.ac30_kg_ton);

  const events=[
    {icon:Database,title:'Dashboard sincronizado',detail:updateDate?updateDate.toLocaleString('es-PA'):'Pendiente'},
    {icon:Factory,title:'Último registro de producción',detail:latest?`${latest.fecha} · ${fmt.format(latest.toneladas)} t`:'Sin registro'},
    {icon:Droplets,title:'Consumo AC30 del día',detail:latest?`${latest.fecha} · ${fmt.format(ac30Today)} kg/T`:'Sin registro'},
    {icon:FileText,title:'Reportes ejecutivos activos',detail:`${prioritized} seleccionados desde el ERP`},
    {icon:AlertTriangle,title:'Monitoreo de alertas',detail:`${critical} críticas · ${warnings} advertencias`},
  ];

  return <section className="v6-live-center v62-executive-dashboard">
    <div className="v6-live-hero">
      <div><span className="v6-live-label"><Radio size={15}/> LIVE OPERATIONS CENTER · V6.2</span><h2>DMI Panamá · Estado operativo</h2><p>Lectura consolidada de producción, eficiencia, costos, consumos críticos, calidad y actividad del portal.</p></div>
      <div className="v6-live-clock"><Clock3 size={18}/><strong>{now.toLocaleTimeString('es-PA',{hour:'2-digit',minute:'2-digit'})}</strong><span>{now.toLocaleDateString('es-PA',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
    </div>

    <div className="v6-status-grid">
      <article className="v6-status-card live">
        <span><CheckCircle2/> Planta</span>
        <strong>ONLINE</strong>
        <small>Operación conectada</small>
      </article>

      <article className="v6-status-card">
        <span><Factory/> Última producción</span>
        <strong>{latest?`${fmt.format(latest.toneladas)} t`:'—'}</strong>
        <ComparisonBadge comparison={productionComparison} unit=" t" referenceText="vs corrida anterior"/>
      </article>

      <article className="v6-status-card">
        <span><Gauge/> Costo/T</span>
        <strong>{money.format(summary.costo_total_ton)}/T</strong>
        <ComparisonBadge comparison={costComparison} unit=" USD/T" referenceText="último día vs promedio previo"/>
      </article>

      <article className="v6-status-card">
        <span><RefreshCw/> Diésel</span>
        <strong>{fmt.format(summary.diesel_ton)} gal/T</strong>
        <ComparisonBadge comparison={dieselComparison} unit=" gal/T" referenceText="último día vs promedio previo"/>
      </article>

      <article className={`v6-status-card v62-ac30-card ${ac30Comparison.status}`}>
        <span><Droplets/> AC30 del día</span>
        <strong>{Number.isFinite(ac30Today)?`${fmt.format(ac30Today)} kg/T`:'—'}</strong>
        <ComparisonBadge comparison={ac30Comparison} unit=" kg/T" referenceText="último día vs promedio previo"/>
      </article>

      <article className={`v6-status-card ${critical?'critical':warnings?'warning':'live'}`}>
        <span><AlertTriangle/> Alertas</span>
        <strong>{critical+warnings}</strong>
        <small>{critical?`${critical} críticas`:warnings?`${warnings} requieren atención`:'Sin alertas relevantes'}</small>
      </article>
    </div>

    <div className="v61-reference-note">
      <Activity size={15}/>
      <span>Las variaciones muestran el valor comparado, la referencia y el estado operativo. Producción se compara con la corrida anterior; costo, diésel y AC30 kg/T del día se comparan con el promedio de los registros previos del periodo.</span>
    </div>

    <div className="v6-live-lower">
      <div className="v6-insights">
        <span className="v6-panel-kicker">EXECUTIVE INSIGHTS</span>
        <h3>Qué requiere atención ahora</h3>
        <ul>
          <li>La salud ejecutiva se mantiene en <strong>{fmt.format(summary.puntaje)}/100</strong>.</li>
          <li>El margen estimado es <strong>{fmt.format(summary.margen_pct)}%</strong> y el costo gerencial es <strong>{money.format(summary.costo_total_ton)}/T</strong>.</li>
          <li>El consumo AC30 del último día es <strong>{Number.isFinite(ac30Today)?`${fmt.format(ac30Today)} kg/T`:'sin dato'}</strong> y su estado es <strong>{ac30Comparison.statusLabel}</strong>.</li>
          <li>{critical?`Existen ${critical} alertas críticas que deben revisarse.`:warnings?`Existen ${warnings} advertencias operativas pendientes.`:'No existen alertas críticas activas.'}</li>
          <li>Hay <strong>{prioritized}</strong> reportes priorizados desde el ERP.</li>
        </ul>
      </div>
      <div className="v6-activity-feed">
        <span className="v6-panel-kicker">ACTIVIDAD RECIENTE</span>
        <h3>Flujo del sistema</h3>
        {events.map(({icon:Icon,title,detail})=><div className="v6-event" key={title}><span><Icon size={16}/></span><div><strong>{title}</strong><small>{detail}</small></div></div>)}
      </div>
    </div>
  </section>;
}
