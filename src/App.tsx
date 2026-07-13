import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, RefreshCw, Search } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { supabase } from './lib/supabase';

type Report = { id:string; titulo:string; descripcion:string|null; categoria:string; periodo:string|null; formato:string; archivo_nombre:string; archivo_url:string; archivo_size:number; fecha_publicacion:string };
type Indicator = { codigo:string; nombre:string; valor:number; unidad:string; categoria:string; fecha_actualizacion:string };

const fmt = new Intl.NumberFormat('es-PA', { maximumFractionDigits: 2 });

export default function App(){
  const [reports,setReports]=useState<Report[]>([]); const [indicators,setIndicators]=useState<Indicator[]>([]);
  const [loading,setLoading]=useState(true); const [query,setQuery]=useState(''); const [category,setCategory]=useState('Todos');
  async function load(){ setLoading(true); const [r,i]=await Promise.all([
    supabase.from('erp_reportes').select('*').eq('estado','publicado').order('fecha_publicacion',{ascending:false}),
    supabase.from('erp_indicadores').select('*').order('nombre')]);
    setReports(r.data ?? []); setIndicators(i.data ?? []); setLoading(false);
  }
  useEffect(()=>{load();},[]);
  const categories=useMemo(()=>['Todos',...Array.from(new Set(reports.map(r=>r.categoria))).sort()], [reports]);
  const filtered=useMemo(()=>reports.filter(r=>(category==='Todos'||r.categoria===category)&&(`${r.titulo} ${r.descripcion??''} ${r.periodo??''}`.toLowerCase().includes(query.toLowerCase()))),[reports,query,category]);
  const chartData=indicators.filter(i=>i.categoria==='Producción').map(i=>({name:i.nombre,value:Number(i.valor)}));
  const latest=reports[0]?.fecha_publicacion ? new Date(reports[0].fecha_publicacion).toLocaleString('es-PA') : 'Sin publicaciones';
  return <div className="app">
    <aside><div className="brand"><BarChart3 size={28}/><div><strong>ERP Report Center</strong><span>Portal ejecutivo</span></div></div><nav><a className="active">Resumen</a><a href="#reportes">Reportes</a><a href="#indicadores">Indicadores</a></nav><div className="aside-foot">Última actualización<br/><strong>{latest}</strong></div></aside>
    <main><header><div><p className="eyebrow">ERP PLANTA DMI</p><h1>Portal ejecutivo de reportes</h1><p>Indicadores y documentos publicados directamente desde el ERP.</p></div><button onClick={load} disabled={loading}><RefreshCw size={17}/>{loading?'Actualizando...':'Actualizar'}</button></header>
    <section id="indicadores" className="kpis">{indicators.slice(0,6).map(i=><article key={i.codigo}><span>{i.nombre}</span><strong>{fmt.format(i.valor)} <small>{i.unidad}</small></strong><em>{i.categoria}</em></article>)}</section>
    {chartData.length>0&&<section className="panel"><div className="panel-title"><div><h2>Indicadores de producción</h2><p>Información más reciente publicada por el ERP.</p></div></div><div className="chart"><ResponsiveContainer width="100%" height={280}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="value" fill="#0b4a6f" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section>}
    <section id="reportes" className="panel"><div className="panel-title"><div><h2>Biblioteca de reportes</h2><p>{filtered.length} archivos disponibles</p></div><div className="filters"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar reporte..."/></label><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div></div>
    <div className="table-wrap"><table><thead><tr><th>Reporte</th><th>Categoría</th><th>Periodo</th><th>Formato</th><th>Publicado</th><th></th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><div className="report-name">{r.formato==='PDF'?<FileText/>:<FileSpreadsheet/>}<div><strong>{r.titulo}</strong><span>{r.descripcion}</span></div></div></td><td><span className="badge">{r.categoria}</span></td><td>{r.periodo||'—'}</td><td>{r.formato}</td><td>{new Date(r.fecha_publicacion).toLocaleDateString('es-PA')}</td><td><a className="download" href={r.archivo_url} target="_blank" rel="noreferrer"><Download size={16}/> Descargar</a></td></tr>)}</tbody></table>{!loading&&!filtered.length&&<div className="empty">No hay reportes que coincidan con los filtros.</div>}</div></section>
    </main></div>
}
