import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, Boxes, ChevronRight, CircleDollarSign,
  Download, Droplets, Factory, FileSpreadsheet, FileText, FolderOpen, Fuel,
  Gauge, Menu, RefreshCw, Search, ShieldCheck, TrendingUp, Truck, X,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { supabase } from './lib/supabase';

type ViewKey = 'resumen' | 'produccion' | 'combustible' | 'ac30' | 'equipos' | 'costos' | 'reportes' | 'alertas';
type Report = { id:string; titulo:string; descripcion:string|null; categoria:string; periodo:string|null; formato:string; archivo_nombre:string; archivo_url:string; archivo_size:number; fecha_publicacion:string; destacado?:boolean; orden_destacado?:number|null };
type Indicator = { codigo:string; nombre:string; valor:number; unidad:string; categoria:string; fecha_actualizacion:string };
type Summary = {
  periodo:string; salud:string; puntaje:number; resumen:string; costo_total_ton:number; margen_pct:number;
  diesel_ton:number; ac30_kg_ton:number; total_ton:number; producciones:number; produccion_promedio:number;
  costo_total_mes:number; variacion_pct:number; diesel_planta:number; diesel_apoyo:number;
  transferencia_interna:number; consumo_equipos:number; costo_equipos:number; ac30_kg:number;
  lab_ac30_promedio:number; lab_vacios_promedio:number; lab_muestras:number; lab_estado:string;
  estados:Record<string, unknown>; fecha_actualizacion:string;
};
type SeriesRow = { codigo:string; periodo:string; fecha:string; toneladas:number; costo_ton:number; ac30_kg_ton:number; diesel_gal_ton:number; tipo_mezcla:string };
type EquipmentRow = { codigo:string; periodo:string; equipo:string; galones_consumo:number; galones_transferencia:number; costo_diesel_usd:number };
type RankingRow = { codigo:string; periodo:string; tipo_ranking:string; posicion:number; fecha:string; tipo_mezcla:string; toneladas:number; costo_ton:number; ac30_kg_ton:number; diesel_gal_ton:number };
type AlertRow = { codigo:string; periodo:string; modulo:string; severidad:string; mensaje:string; estado:string; fecha_actualizacion:string };

const fmt = new Intl.NumberFormat('es-PA', { maximumFractionDigits: 2 });
const money = new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat('es-PA', { day:'2-digit', month:'short', year:'numeric' });
const shortDate = new Intl.DateTimeFormat('es-PA', { day:'2-digit', month:'short' });
const INVALID_REPORT = /(template|plantilla|borrador|demo|test|sample|ejemplo|core_v2|mock|draft)/i;

const NAV: {key:ViewKey; label:string; path:string; description:string; icon:any}[] = [
  { key:'resumen', label:'Resumen Ejecutivo', path:'/resumen', description:'Control consolidado de producción, costos, consumos, laboratorio y reportes del ERP.', icon:BarChart3 },
  { key:'produccion', label:'Producción', path:'/produccion', description:'Toneladas, corridas, promedio operativo y comportamiento diario de la planta.', icon:Factory },
  { key:'combustible', label:'Combustible', path:'/combustible', description:'Consumo de diésel, transferencias internas y eficiencia por tonelada.', icon:Fuel },
  { key:'ac30', label:'AC30 y Laboratorio', path:'/ac30-laboratorio', description:'Dosificación de ligante, muestras de laboratorio y control de vacíos.', icon:Droplets },
  { key:'equipos', label:'Equipos HYUNDAI', path:'/equipos', description:'Distribución del combustible y costo mensual por equipo operativo.', icon:Truck },
  { key:'costos', label:'Costos y Ranking', path:'/costos-ranking', description:'Costo gerencial por tonelada, margen estimado y ranking de desempeño.', icon:CircleDollarSign },
  { key:'reportes', label:'Reportes', path:'/reportes', description:'Biblioteca central de documentos PDF y Excel publicados desde el ERP.', icon:FolderOpen },
  { key:'alertas', label:'Alertas', path:'/alertas', description:'Condiciones operativas que requieren validación o atención gerencial.', icon:AlertTriangle },
];

function safe<T>(result: {data:T|null; error:any}): T | null { return result.error ? null : result.data; }
function issue(label:string,result:{error:any}){ return result.error ? `${label}: ${result.error.message || 'Error de consulta'}` : null; }
function healthTone(value:string) { const v=(value||'').toUpperCase(); return v.includes('SALUD')||v.includes('VERDE') ? 'ok' : v.includes('AMAR')||v.includes('OBS') ? 'warn' : 'danger'; }
function severityTone(value:string) { return value==='critica' ? 'danger' : value==='advertencia' ? 'warn' : 'info'; }

function App() {
  const [pathname,setPathname]=useState(window.location.pathname);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [reports,setReports]=useState<Report[]>([]);
  const [indicators,setIndicators]=useState<Indicator[]>([]);
  const [summary,setSummary]=useState<Summary|null>(null);
  const [series,setSeries]=useState<SeriesRow[]>([]);
  const [equipment,setEquipment]=useState<EquipmentRow[]>([]);
  const [rankings,setRankings]=useState<RankingRow[]>([]);
  const [alerts,setAlerts]=useState<AlertRow[]>([]);
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('Todas');
  const [loadIssues,setLoadIssues]=useState<string[]>([]);

  const activeNav = NAV.find(item => item.path === pathname) ?? NAV[0];
  const navigate = (path:string) => { if (window.location.pathname !== path) window.history.pushState({}, '', path); setPathname(path); };

  async function load() {
    setLoading(true);
    const [r,i,s,ser,eq,rank,al] = await Promise.all([
      supabase.from('erp_reportes').select('*').eq('estado','publicado').order('fecha_publicacion',{ascending:false}),
      supabase.from('erp_indicadores').select('*').order('nombre'),
      supabase.from('erp_dashboard_resumen').select('*').order('periodo',{ascending:false}).limit(1),
      supabase.from('erp_dashboard_series').select('*').order('fecha',{ascending:true}),
      supabase.from('erp_dashboard_equipos').select('*').order('galones_consumo',{ascending:false}),
      supabase.from('erp_dashboard_rankings').select('*').order('posicion',{ascending:true}),
      supabase.from('erp_alertas').select('*').order('fecha_actualizacion',{ascending:false}),
    ]);
    const issues=[issue('Reportes',r),issue('Indicadores',i),issue('Resumen',s),issue('Tendencias',ser),issue('Equipos',eq),issue('Rankings',rank),issue('Alertas',al)].filter(Boolean) as string[];
    setLoadIssues(issues);
    const validReports=(safe<Report[]>(r) ?? []).filter(x=>!INVALID_REPORT.test(`${x.titulo} ${x.archivo_nombre}`));
    const summaryRows=safe<Summary[]>(s) ?? [];
    const active=summaryRows[0] ?? null;
    const period=active?.periodo;
    setReports(validReports); setIndicators(safe<Indicator[]>(i) ?? []); setSummary(active);
    setSeries((safe<SeriesRow[]>(ser) ?? []).filter(x=>!period||x.periodo===period));
    setEquipment((safe<EquipmentRow[]>(eq) ?? []).filter(x=>!period||x.periodo===period));
    setRankings((safe<RankingRow[]>(rank) ?? []).filter(x=>!period||x.periodo===period));
    setAlerts((safe<AlertRow[]>(al) ?? []).filter(x=>!period||x.periodo===period));
    setLoading(false);
  }

  useEffect(()=>{ if (window.location.pathname === '/' || !NAV.some(item=>item.path===window.location.pathname)) { window.history.replaceState({}, '', '/resumen'); setPathname('/resumen'); } load(); },[]);
  useEffect(()=>{ const onPop=()=>setPathname(window.location.pathname); window.addEventListener('popstate',onPop); return()=>window.removeEventListener('popstate',onPop); },[]);
  useEffect(()=>{ setMobileOpen(false); window.scrollTo({top:0, behavior:'smooth'}); },[pathname]);
  useEffect(()=>{
    document.body.classList.toggle('drawer-open', mobileOpen);
    return ()=>document.body.classList.remove('drawer-open');
  },[mobileOpen]);

  const latestUpdate=summary?.fecha_actualizacion || indicators[0]?.fecha_actualizacion;
  const filteredReports=useMemo(()=>reports.filter(r=>{
    const text=`${r.titulo} ${r.categoria} ${r.periodo}`.toLowerCase();
    return (!query||text.includes(query.toLowerCase())) && (category==='Todas'||r.categoria===category);
  }),[reports,query,category]);
  const categories=['Todas',...Array.from(new Set(reports.map(r=>r.categoria))).sort()];

  const routedPage = pathname === '/produccion' ? <Production summary={summary} series={series}/>
    : pathname === '/combustible' ? <FuelPage summary={summary} series={series} equipment={equipment}/>
    : pathname === '/ac30-laboratorio' ? <AC30Page summary={summary} series={series}/>
    : pathname === '/equipos' ? <EquipmentPage equipment={equipment}/>
    : pathname === '/costos-ranking' ? <CostsPage summary={summary} series={series} rankings={rankings}/>
    : pathname === '/reportes' ? <ReportsPage reports={filteredReports} categories={categories} query={query} setQuery={setQuery} category={category} setCategory={setCategory}/>
    : pathname === '/alertas' ? <AlertsPage alerts={alerts}/>
    : <Executive summary={summary} series={series} equipment={equipment} rankings={rankings} alerts={alerts} reports={reports} loadIssues={loadIssues}/>;

  const pageRoutes = loading ? <div className="loading">Sincronizando información del ERP…</div> : routedPage;

  return <div className="app-shell">
    {mobileOpen && <button className="mobile-overlay" aria-label="Cerrar menú" onClick={()=>setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen?'open':''}`}>
      <div className="brand"><div className="brand-icon"><Factory/></div><div><strong>SAS SmartPlant</strong><span>Executive Portal V4</span></div></div>
      <div className="plant-card"><Factory size={17}/><div><small>Planta activa</small><strong>DMI · Panamá</strong></div><span>ONLINE</span></div>
      <nav>{NAV.map(item=>{const Icon=item.icon; const active=activeNav.key===item.key; return <button key={item.key} className={active?'active':''} onClick={()=>navigate(item.path)}><Icon size={19}/><span>{item.label}</span>{active&&<i/>}</button>})}</nav>
      <div className="sidebar-footer"><small>Última sincronización</small><strong>{latestUpdate?new Date(latestUpdate).toLocaleString('es-PA'):'Pendiente'}</strong><span><i/> Supabase conectado</span></div>
    </aside>
    <main>
      <header className="topbar">
        <button className="mobile-menu" aria-label="Abrir menú" onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X/>:<Menu/>}</button>
        <div className="topbar-copy"><span className="eyebrow">SAS SMARTPLANT · EXECUTIVE PORTAL</span><h1>{activeNav.label}</h1><p>{activeNav.description}</p></div>
        <div className="top-actions"><div className="period"><small>Periodo de referencia</small><strong>{summary?.periodo ?? 'Sin datos'}</strong></div><button onClick={load}><RefreshCw size={18}/><span>Actualizar</span></button></div>
      </header>
      <div className="content">{pageRoutes}</div>
    </main>
  </div>;
}
function Metric({label,value,sub,icon:Icon,tone='neutral'}:{label:string;value:string;sub?:string;icon:any;tone?:string}) {
  return <article className={`metric ${tone}`}><div className="metric-head"><span><Icon size={18}/></span><small>{label}</small></div><strong>{value}</strong>{sub&&<p>{sub}</p>}</article>;
}
function Panel({title,kicker,children,className=''}:{title:string;kicker?:string;children:any;className?:string}) { return <section className={`panel ${className}`}><div className="panel-head">{kicker&&<span>{kicker}</span>}<h2>{title}</h2></div>{children}</section>; }
function ChartTooltip({active,payload,label}:any){if(!active||!payload?.length)return null;return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((p:any)=><span key={p.dataKey}>{p.name}: {fmt.format(p.value)}</span>)}</div>}

function Executive({summary:s,series,equipment,rankings,alerts,reports,loadIssues}:{summary:Summary|null;series:SeriesRow[];equipment:EquipmentRow[];rankings:RankingRow[];alerts:AlertRow[];reports:Report[];loadIssues:string[]}) {
  if(!s) return <EmptySetup/>;
  const featured=reports.filter(r=>r.destacado).sort((a,b)=>(a.orden_destacado??99)-(b.orden_destacado??99));
  const periodReports=reports.filter(r=>r.periodo===s.periodo && r.formato==='PDF');
  const reportFive=(featured.length?featured:periodReports.length?periodReports:reports).slice(0,5);
  return <>
    {loadIssues.length>0&&<div className="diagnostic-banner"><AlertTriangle/><div><strong>Sincronización incompleta</strong><span>{loadIssues.join(' · ')}</span></div></div>}
    {series.length===0&&<div className="diagnostic-banner warn"><Activity/><div><strong>Tendencias pendientes</strong><span>El resumen ejecutivo está disponible, pero no hay filas para el periodo {s.periodo}. Vuelve a publicar desde el ERP actualizado.</span></div></div>}
    <div className="health-grid">
      <Metric label="Salud del negocio" value={`${s.salud} · ${fmt.format(s.puntaje)}/100`} icon={ShieldCheck} tone={healthTone(s.salud)}/>
      <Metric label="Costo/T gerencial" value={`${money.format(s.costo_total_ton)}/T`} icon={CircleDollarSign}/>
      <Metric label="Margen estimado" value={`${fmt.format(s.margen_pct)}%`} icon={TrendingUp} tone={s.margen_pct>=30?'ok':'warn'}/>
      <Metric label="Diésel" value={`${fmt.format(s.diesel_ton)} gal/T`} icon={Fuel}/>
      <Metric label="AC30" value={`${fmt.format(s.ac30_kg_ton)} kg/T`} icon={Droplets}/>
    </div>
    <div className="executive-note"><Activity size={19}/><span>{s.resumen}</span></div>
    <div className="section-title"><h2>Producción y costos</h2></div>
    <div className="metrics-grid five">
      <Metric label="Producción mes" value={`${fmt.format(s.total_ton)} t`} icon={Factory}/>
      <Metric label="Producciones" value={fmt.format(s.producciones)} icon={BarChart3}/>
      <Metric label="Promedio corrida" value={`${fmt.format(s.produccion_promedio)} t`} icon={Gauge}/>
      <Metric label="Costo mensual" value={money.format(s.costo_total_mes)} icon={CircleDollarSign}/>
      <Metric label="Variabilidad costo/T" value={`${fmt.format(s.variacion_pct)}%`} icon={Activity}/>
    </div>
    <div className="section-title"><h2>Diésel, AC30 y laboratorio</h2></div>
    <div className="metrics-grid five">
      <Metric label="Diésel planta" value={`${fmt.format(s.diesel_planta)} gal`} icon={Fuel}/>
      <Metric label="Apoyo DMI" value={`${fmt.format(s.diesel_apoyo)} gal`} icon={Truck}/>
      <Metric label="Transferencia interna" value={`${fmt.format(s.transferencia_interna)} gal`} sub="No es consumo operativo" icon={Activity}/>
      <Metric label="AC30 mes" value={`${fmt.format(s.ac30_kg)} kg`} icon={Droplets}/>
      <Metric label="Lab AC30 promedio" value={`${fmt.format(s.lab_ac30_promedio)}%`} sub={`${s.lab_muestras} muestras · ${s.lab_estado}`} icon={ShieldCheck}/>
    </div>
    <Panel title="Tendencias del mes" kicker="CALCULATION ENGINE">
      <div className="chart-grid four">
        <MiniLine title="Producción diaria" data={series} keyName="toneladas" unit="t"/>
        <MiniLine title="Costo/T" data={series} keyName="costo_ton" unit="$"/>
        <MiniLine title="AC30 kg/T" data={series} keyName="ac30_kg_ton" unit="kg/T"/>
        <MiniLine title="Diésel gal/T" data={series} keyName="diesel_gal_ton" unit="gal/T"/>
      </div>
    </Panel>
    <div className="dashboard-grid two-one">
      <Panel title="Consumo HYUNDAI por equipo" kicker="CONSUMO OPERATIVO"><EquipmentChart data={equipment}/></Panel>
      <Panel title="Alertas y cierre operativo" kicker="LECTURA EJECUTIVA"><AlertList alerts={alerts}/></Panel>
    </div>
    <div className="dashboard-grid equal">
      <Ranking title="Top 5 más eficientes" rows={rankings.filter(r=>r.tipo_ranking==='eficiente').slice(0,5)}/>
      <Ranking title="Top 5 mayor costo" rows={rankings.filter(r=>r.tipo_ranking==='mayor_costo').slice(0,5)}/>
    </div>
    <Panel title="Últimos 5 reportes disponibles" kicker="DOCUMENTOS PUBLICADOS"><RecentReports reports={reportFive}/><div className="panel-foot">La biblioteca completa está disponible únicamente en el módulo Reportes.</div></Panel>
  </>;
}

function MiniLine({title,data,keyName,unit}:{title:string;data:SeriesRow[];keyName:keyof SeriesRow;unit:string}) { if(!data.length)return <div className="chart-empty"><Activity/><strong>Sin datos publicados</strong><span>Actualiza el portal desde el ERP.</span></div>; return <div className="mini-chart"><h3>{title}</h3><ResponsiveContainer width="100%" height={230}><LineChart data={data}><defs><linearGradient id={`line-${String(keyName)}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#18b9f2"/><stop offset="1" stopColor="#2dd4bf"/></linearGradient></defs><CartesianGrid stroke="#1e3345" vertical={false}/><XAxis dataKey="fecha" tickFormatter={v=>shortDate.format(new Date(`${v}T00:00:00`))} tick={{fill:'#7890a5',fontSize:10}} axisLine={false}/><YAxis tick={{fill:'#7890a5',fontSize:10}} axisLine={false}/><Tooltip content={<ChartTooltip/>}/><Line type="monotone" dataKey={keyName as string} name={`${title} ${unit}`} stroke={`url(#line-${String(keyName)})`} strokeWidth={3} dot={{r:3,fill:'#18b9f2',strokeWidth:0}} activeDot={{r:6}}/></LineChart></ResponsiveContainer></div> }
function EquipmentChart({data}:{data:EquipmentRow[]}) { if(!data.length)return <div className="chart-empty"><Truck/><strong>Sin consumo por equipo</strong><span>Publica nuevamente desde el ERP.</span></div>; return <ResponsiveContainer width="100%" height={330}><BarChart data={data.slice(0,10)} margin={{bottom:65}}><CartesianGrid stroke="#1e3345" vertical={false}/><XAxis dataKey="equipo" angle={-45} textAnchor="end" tick={{fill:'#7890a5',fontSize:10}} interval={0}/><YAxis tick={{fill:'#7890a5',fontSize:10}}/><Tooltip content={<ChartTooltip/>}/><Bar dataKey="galones_consumo" name="Galones" fill="#147dc2" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer> }
function AlertList({alerts}:{alerts:AlertRow[]}) { return <div className="alert-list">{alerts.length?alerts.map(a=><div className={`alert-row ${severityTone(a.severidad)}`} key={a.codigo}><AlertTriangle size={18}/><div><strong>{a.modulo}</strong><p>{a.mensaje}</p></div><span>{a.severidad}</span></div>):<div className="positive-state"><ShieldCheck/><strong>Operación sin alertas críticas</strong></div>}</div> }
function Ranking({title,rows}:{title:string;rows:RankingRow[]}) { return <Panel title={title} kicker="RANKING RÁPIDO"><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Ton</th><th>Costo/T</th><th>AC30 kg/T</th><th>gal/T</th></tr></thead><tbody>{rows.map(r=><tr key={r.codigo}><td>{r.fecha}</td><td>{r.tipo_mezcla}</td><td>{fmt.format(r.toneladas)}</td><td>{fmt.format(r.costo_ton)}</td><td>{fmt.format(r.ac30_kg_ton)}</td><td>{fmt.format(r.diesel_gal_ton)}</td></tr>)}</tbody></table>{!rows.length&&<div className="empty">Sin datos de ranking publicados.</div>}</div></Panel> }
function RecentReports({reports}:{reports:Report[]}) { return <div className="recent-reports">{reports.map(r=><a href={r.archivo_url} target="_blank" rel="noreferrer" key={r.id}><span className={r.formato==='PDF'?'pdf':'excel'}>{r.formato==='PDF'?<FileText/>:<FileSpreadsheet/>}</span><div><strong>{r.titulo}</strong><small>{r.categoria} · {r.periodo||'Sin periodo'} · {dateFmt.format(new Date(r.fecha_publicacion))}</small></div><ChevronRight/></a>)}</div> }

function Production({summary:s,series}:{summary:Summary|null;series:SeriesRow[]}) { return <><div className="metrics-grid four"><Metric label="Producción mes" value={`${fmt.format(s?.total_ton||0)} t`} icon={Factory}/><Metric label="Producciones" value={fmt.format(s?.producciones||0)} icon={BarChart3}/><Metric label="Promedio corrida" value={`${fmt.format(s?.produccion_promedio||0)} t`} icon={Gauge}/><Metric label="Variabilidad" value={`${fmt.format(s?.variacion_pct||0)}%`} icon={Activity}/></div><Panel title="Producción diaria" kicker="TONELADAS"><ResponsiveContainer width="100%" height={420}><AreaChart data={series}><defs><linearGradient id="prod" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#18b9f2" stopOpacity={.4}/><stop offset="1" stopColor="#18b9f2" stopOpacity={.02}/></linearGradient></defs><CartesianGrid stroke="#1e3345" vertical={false}/><XAxis dataKey="fecha" tick={{fill:'#7890a5'}}/><YAxis tick={{fill:'#7890a5'}}/><Tooltip content={<ChartTooltip/>}/><Area dataKey="toneladas" name="Toneladas" stroke="#18b9f2" fill="url(#prod)" strokeWidth={3}/></AreaChart></ResponsiveContainer></Panel></> }
function FuelPage({summary:s,series,equipment}:{summary:Summary|null;series:SeriesRow[];equipment:EquipmentRow[]}) { return <><div className="metrics-grid four"><Metric label="Diésel planta" value={`${fmt.format(s?.diesel_planta||0)} gal`} icon={Fuel}/><Metric label="Apoyo DMI" value={`${fmt.format(s?.diesel_apoyo||0)} gal`} icon={Truck}/><Metric label="Transferencias" value={`${fmt.format(s?.transferencia_interna||0)} gal`} icon={Activity}/><Metric label="Eficiencia" value={`${fmt.format(s?.diesel_ton||0)} gal/T`} icon={Gauge}/></div><div className="dashboard-grid equal"><Panel title="Diésel gal/T" kicker="TENDENCIA"><MiniLine title="Eficiencia diaria" data={series} keyName="diesel_gal_ton" unit="gal/T"/></Panel><Panel title="Consumo por equipo" kicker="HYUNDAI"><EquipmentChart data={equipment}/></Panel></div></> }
function AC30Page({summary:s,series}:{summary:Summary|null;series:SeriesRow[]}) { return <><div className="metrics-grid four"><Metric label="AC30 mes" value={`${fmt.format(s?.ac30_kg||0)} kg`} icon={Droplets}/><Metric label="AC30 por tonelada" value={`${fmt.format(s?.ac30_kg_ton||0)} kg/T`} icon={Gauge}/><Metric label="Laboratorio" value={`${fmt.format(s?.lab_ac30_promedio||0)}%`} sub={`${s?.lab_muestras||0} muestras`} icon={ShieldCheck}/><Metric label="Vacíos promedio" value={`${fmt.format(s?.lab_vacios_promedio||0)}%`} icon={Activity}/></div><Panel title="Dosificación AC30 por tonelada" kicker="TENDENCIA"><ResponsiveContainer width="100%" height={420}><LineChart data={series}><CartesianGrid stroke="#1e3345" vertical={false}/><XAxis dataKey="fecha" tick={{fill:'#7890a5'}}/><YAxis tick={{fill:'#7890a5'}}/><Tooltip content={<ChartTooltip/>}/><Line dataKey="ac30_kg_ton" name="AC30 kg/T" stroke="#2dd4bf" strokeWidth={3}/></LineChart></ResponsiveContainer></Panel></> }
function EquipmentPage({equipment}:{equipment:EquipmentRow[]}) { return <><Panel title="Consumo operativo HYUNDAI por equipo" kicker="DISTRIBUCIÓN"><EquipmentChart data={equipment}/></Panel><Panel title="Detalle mensual" kicker="EQUIPOS"><div className="table-wrap"><table><thead><tr><th>Equipo</th><th>Consumo</th><th>Transferencia</th><th>Costo</th></tr></thead><tbody>{equipment.map(e=><tr key={e.codigo}><td>{e.equipo}</td><td>{fmt.format(e.galones_consumo)} gal</td><td>{fmt.format(e.galones_transferencia)} gal</td><td>{money.format(e.costo_diesel_usd)}</td></tr>)}</tbody></table></div></Panel></> }
function CostsPage({summary:s,series,rankings}:{summary:Summary|null;series:SeriesRow[];rankings:RankingRow[]}) { return <><div className="metrics-grid four"><Metric label="Costo/T gerencial" value={`${money.format(s?.costo_total_ton||0)}/T`} icon={CircleDollarSign}/><Metric label="Costo mensual" value={money.format(s?.costo_total_mes||0)} icon={CircleDollarSign}/><Metric label="Margen estimado" value={`${fmt.format(s?.margen_pct||0)}%`} icon={TrendingUp}/><Metric label="Variabilidad" value={`${fmt.format(s?.variacion_pct||0)}%`} icon={Activity}/></div><Panel title="Costo por tonelada" kicker="TENDENCIA"><MiniLine title="Costo/T diario" data={series} keyName="costo_ton" unit="USD/T"/></Panel><div className="dashboard-grid equal"><Ranking title="Top eficientes" rows={rankings.filter(r=>r.tipo_ranking==='eficiente')}/><Ranking title="Mayor costo" rows={rankings.filter(r=>r.tipo_ranking==='mayor_costo')}/></div></> }
function AlertsPage({alerts}:{alerts:AlertRow[]}) { return <Panel title="Alertas y cierre operativo" kicker="MONITOREO"><AlertList alerts={alerts}/></Panel> }

function ReportsPage({reports,categories,query,setQuery,category,setCategory}:{reports:Report[];categories:string[];query:string;setQuery:(v:string)=>void;category:string;setCategory:(v:string)=>void}) { return <Panel title="Biblioteca completa de reportes" kicker="PDF Y EXCEL"><div className="report-tools"><label><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar reporte, categoría o periodo…"/></label><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div><div className="report-grid">{reports.map(r=><article className="report-card" key={r.id}><div className="report-card-head"><span className={r.formato==='PDF'?'pdf':'excel'}>{r.formato==='PDF'?<FileText/>:<FileSpreadsheet/>}</span><small>{r.formato}</small></div><h3>{r.titulo}</h3><p>{r.categoria} · {r.periodo||'Sin periodo'}</p><div><span>{dateFmt.format(new Date(r.fecha_publicacion))}</span><a href={r.archivo_url} target="_blank" rel="noreferrer"><Download size={16}/>Abrir</a></div></article>)}</div>{!reports.length&&<div className="empty">No hay reportes que coincidan con los filtros.</div>}</Panel> }
function EmptySetup(){return <div className="empty-setup"><Boxes/><h2>El portal está listo para recibir datos gerenciales</h2><p>Ejecuta el SQL incluido en <code>supabase/schema.sql</code> y luego presiona “Actualizar dashboard” desde el ERP.</p></div>}

export default App;
