import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, Factory, FileText, Gauge, Radio, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useLiveClock } from '../hooks/useLiveClock';
import { calculateTrend } from '../utils/trends';

type Props = { summary:any; series:any[]; alerts:any[]; reports:any[]; latestUpdate?:string };
const fmt = new Intl.NumberFormat('es-PA', { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('es-PA', { style:'currency', currency:'USD', maximumFractionDigits:2 });

function TrendBadge({values,positiveWhenHigher=true}:{values:number[];positiveWhenHigher?:boolean}){
  const trend=calculateTrend(values,positiveWhenHigher);
  const Icon=trend.direction==='up'?TrendingUp:trend.direction==='down'?TrendingDown:Activity;
  return <span className={`v6-trend ${trend.direction} ${trend.favorable?'good':'review'}`}><Icon size={14}/>{trend.percent.toFixed(1)}% · {trend.favorable?'Favorable':'Revisar'}</span>;
}

export function LiveOperationsCenter({summary,series,alerts,reports,latestUpdate}:Props){
  const now=useLiveClock();
  const latest=series.length ? series[series.length - 1] : undefined;
  const critical=alerts.filter(a=>String(a.severidad).toLowerCase()==='critica').length;
  const warnings=alerts.filter(a=>String(a.severidad).toLowerCase()==='advertencia').length;
  const prioritized=reports.filter(r=>r.destacado===true).length;
  const updateDate=latestUpdate?new Date(latestUpdate):null;
  const events=[
    {icon:Database,title:'Dashboard sincronizado',detail:updateDate?updateDate.toLocaleString('es-PA'):'Pendiente'},
    {icon:Factory,title:'Último registro de producción',detail:latest?`${latest.fecha} · ${fmt.format(latest.toneladas)} t`:'Sin registro'},
    {icon:FileText,title:'Reportes ejecutivos activos',detail:`${prioritized} seleccionados desde el ERP`},
    {icon:AlertTriangle,title:'Monitoreo de alertas',detail:`${critical} críticas · ${warnings} advertencias`},
  ];
  return <section className="v6-live-center">
    <div className="v6-live-hero">
      <div><span className="v6-live-label"><Radio size={15}/> LIVE OPERATIONS CENTER</span><h2>DMI Panamá · Estado operativo</h2><p>Lectura consolidada de producción, eficiencia, costos, calidad y actividad del portal.</p></div>
      <div className="v6-live-clock"><Clock3 size={18}/><strong>{now.toLocaleTimeString('es-PA',{hour:'2-digit',minute:'2-digit'})}</strong><span>{now.toLocaleDateString('es-PA',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
    </div>
    <div className="v6-status-grid">
      <article className="v6-status-card live"><span><CheckCircle2/> Planta</span><strong>ONLINE</strong><small>Operación conectada</small></article>
      <article className="v6-status-card"><span><Factory/> Última producción</span><strong>{latest?`${fmt.format(latest.toneladas)} t`:'—'}</strong><TrendBadge values={series.map(x=>Number(x.toneladas))}/></article>
      <article className="v6-status-card"><span><Gauge/> Costo/T</span><strong>{money.format(summary.costo_total_ton)}/T</strong><TrendBadge values={series.map(x=>Number(x.costo_ton))} positiveWhenHigher={false}/></article>
      <article className="v6-status-card"><span><RefreshCw/> Diésel</span><strong>{fmt.format(summary.diesel_ton)} gal/T</strong><TrendBadge values={series.map(x=>Number(x.diesel_gal_ton))} positiveWhenHigher={false}/></article>
      <article className={`v6-status-card ${critical?'critical':warnings?'warning':'live'}`}><span><AlertTriangle/> Alertas</span><strong>{critical+warnings}</strong><small>{critical?`${critical} críticas`:warnings?`${warnings} requieren atención`:'Sin alertas relevantes'}</small></article>
    </div>
    <div className="v6-live-lower">
      <div className="v6-insights"><span className="v6-panel-kicker">EXECUTIVE INSIGHTS</span><h3>Qué requiere atención ahora</h3><ul>
        <li>La salud ejecutiva se mantiene en <strong>{fmt.format(summary.puntaje)}/100</strong>.</li>
        <li>El margen estimado es <strong>{fmt.format(summary.margen_pct)}%</strong> y el costo gerencial es <strong>{money.format(summary.costo_total_ton)}/T</strong>.</li>
        <li>{critical?`Existen ${critical} alertas críticas que deben revisarse.`:warnings?`Existen ${warnings} advertencias operativas pendientes.`:'No existen alertas críticas activas.'}</li>
        <li>Hay <strong>{prioritized}</strong> reportes priorizados desde el ERP.</li>
      </ul></div>
      <div className="v6-activity-feed"><span className="v6-panel-kicker">ACTIVIDAD RECIENTE</span><h3>Flujo del sistema</h3>{events.map(({icon:Icon,title,detail})=><div className="v6-event" key={title}><span><Icon size={16}/></span><div><strong>{title}</strong><small>{detail}</small></div></div>)}</div>
    </div>
  </section>;
}
