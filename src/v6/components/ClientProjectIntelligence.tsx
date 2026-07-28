import { useMemo, useState } from 'react';
import {
  Activity, BarChart3, BriefcaseBusiness, CalendarDays, ChevronDown,
  FileText, Search, Truck, UsersRound,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

export type DispatchRow = {
  codigo:string;
  periodo:string;
  fecha:string;
  ticket:string|null;
  placa:string|null;
  camion:string|null;
  cliente:string;
  proyecto:string;
  toneladas:number;
  estado?:string|null;
};

type PeriodMode = 'day' | 'month';
type AggregateRow = { name:string; toneladas:number; share:number; secondary?:string };

const fmt = new Intl.NumberFormat('es-PA', { maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat('es-PA', { maximumFractionDigits: 1 });

const MONTH_PROJECTS = [
  ['ACP','ACP - MENDOZA',41], ['ALEX VASO','ALEX VASO',40], ['Aispell Keira','Aispell Keira',3],
  ['Alex Vaso','Transistmica',40], ['Alex vaso','Playa Caracol',58.66], ['BTD','BTD Chorrera',43],
  ['BTD','BTD',25], ['CASTREJON','CASTREJON',40], ['CONSORCIO-DEL-OESTE','CONSORCIO DEL OESTE',870],
  ['Castrejon','Castrejon Burunga',50], ['Ciudad del Saber','Ciudad Del Saber',36], ['GEL','GEL',125],
  ['MECO','MECO',15], ['Multi Servicio','Multi Servicio',1], ['NOVA','NOVA VIA CHAPALA',1500],
  ['NOVA','NOVA CALLE NEGRA',910], ['NOVA','NOVA - BURUNGA',110], ['NOVA','NOVA CHAPALA',55],
  ['NOVA','NOVA LA MITRA-CONSIHSA',15], ['Nova','Nova Vía Chapala (Consihsa)',375],
  ['Nova','Nova La Mitra',140], ['Nova','Nova Parcheo Calle Burunga',45], ['Nova','Nova La Pesita',2],
  ['OHLA','OHLA mendoza',42], ['Otros','Carlos Ávila',35], ['Otros','Tapia',6], ['PAM','Pam',3],
  ['TAPIA','Tapia-Multiplaza',13], ['TAPIA','MULTIPLAZA TAPIA',4], ['TONY','TONY',178],
  ['VIA DEL ISTMO','VIA DEL ISTMO',31], ['Vías del Istmo','Vías del Istmo',529.5],
  ['Vías del Istmo','Vías del Istmo Panamericana',25], ['ZARATE','ZARATE',25],
] as const;

const DAY_DISPATCHES: DispatchRow[] = [
  ['8077','EM1476','', 'BTD','BTD',25],
  ['8071','AH7922','Guillermo Rivas','CONSORCIO-DEL-OESTE','CONSORCIO DEL OESTE',25],
  ['8072','DB2254','Cesar Ruiz','CONSORCIO-DEL-OESTE','CONSORCIO DEL OESTE',25],
  ['8076','AU8648','Alvaro Quintero','CONSORCIO-DEL-OESTE','CONSORCIO DEL OESTE',25],
  ['8078','EP7330','Abdiel Florez','CONSORCIO-DEL-OESTE','CONSORCIO DEL OESTE',25],
  ['8079','443955','David Rodriguez','CONSORCIO-DEL-OESTE','CONSORCIO DEL OESTE',25],
  ['8074','AL2248','Jorge Navarro','CONSORCIO-DEL-OESTE','CONSORCIO DEL OESTE',25],
  ['8073','AK9000','Javier Castillo','GEL','GEL',15],
  ['8075','529444','Jorge Navarro','OHLA','OHLA mendoza',10],
  ['8069','465344','Carlos Camarena','Vías del Istmo','Vías del Istmo',22],
  ['8070','EB6911','Edwin Guillen','Vías del Istmo','Vías del Istmo',5],
  ['8080','867522','Victor Castillo','ZARATE','ZARATE',25],
].map((row,index)=>({codigo:`fallback-day-${index}`,periodo:'2026-07',fecha:'2026-07-27',ticket:row[0] as string,placa:row[1] as string,camion:row[2] as string,cliente:row[3] as string,proyecto:row[4] as string,toneladas:Number(row[5]),estado:'confirmado'}));

function normalizeClient(value:string){
  const v=value.trim().toUpperCase().replace(/-/g,' ').replace(/\s+/g,' ');
  if(v==='NOVA') return 'NOVA';
  if(v==='VIA DEL ISTMO'||v==='VÍAS DEL ISTMO') return 'VÍAS DEL ISTMO';
  if(v==='ALEX VASO') return 'ALEX VASO';
  if(v==='CASTREJON') return 'CASTREJON';
  if(v==='TAPIA') return 'TAPIA';
  return v;
}

function aggregate(rows:{name:string;toneladas:number;secondary?:string}[]):AggregateRow[]{
  const total=rows.reduce((sum,row)=>sum+row.toneladas,0);
  const map=new Map<string,{toneladas:number;secondary?:string}>();
  rows.forEach(row=>{const current=map.get(row.name)||{toneladas:0,secondary:row.secondary};current.toneladas+=row.toneladas;map.set(row.name,current)});
  return [...map.entries()].map(([name,value])=>({name,toneladas:value.toneladas,share:total?value.toneladas/total*100:0,secondary:value.secondary})).sort((a,b)=>b.toneladas-a.toneladas);
}

function IntelligenceTooltip({active,payload}:any){
  if(!active||!payload?.length)return null;
  const row=payload[0].payload;
  return <div className="cp-tooltip"><strong>{row.name}</strong><span>{fmt.format(row.toneladas)} t</span><small>{pct.format(row.share)}% del periodo</small></div>;
}

function HorizontalRanking({data}:{data:AggregateRow[]}){
  const shown=data.slice(0,10);
  return <ResponsiveContainer width="100%" height={Math.max(330,shown.length*42)}><BarChart data={shown} layout="vertical" margin={{top:10,right:42,bottom:10,left:18}}><CartesianGrid stroke="#173246" horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={150} tick={{fill:'#a7becd',fontSize:10}} axisLine={false} tickLine={false}/><Tooltip content={<IntelligenceTooltip/>}/><Bar dataKey="toneladas" radius={[0,8,8,0]}>{shown.map((_,index)=><Cell key={index} fill={index===0?'#18d6a2':'#18b9f2'}/>)}</Bar></BarChart></ResponsiveContainer>;
}

export function ClientProjectIntelligence({dispatches,period}:{dispatches:DispatchRow[];period:string}){
  const [mode,setMode]=useState<PeriodMode>('day');
  const [query,setQuery]=useState('');

  const liveRows=dispatches.filter(row=>!period||row.periodo===period);
  const latestDate=liveRows.length?[...liveRows].sort((a,b)=>b.fecha.localeCompare(a.fecha))[0].fecha:'2026-07-27';
  const liveDay=liveRows.filter(row=>row.fecha===latestDate);
  const dayRows=liveDay.length?liveDay:DAY_DISPATCHES;

  const projectRows=useMemo(()=>mode==='day'
    ? aggregate(dayRows.map(row=>({name:row.proyecto,toneladas:Number(row.toneladas),secondary:row.cliente})))
    : aggregate((liveRows.length?liveRows.map(row=>({name:row.proyecto,toneladas:Number(row.toneladas),secondary:row.cliente})):MONTH_PROJECTS.map(row=>({name:row[1],toneladas:Number(row[2]),secondary:row[0]})))),[mode,dayRows,liveRows]);

  const clientRows=useMemo(()=>mode==='day'
    ? aggregate(dayRows.map(row=>({name:normalizeClient(row.cliente),toneladas:Number(row.toneladas)})))
    : aggregate((liveRows.length?liveRows.map(row=>({name:normalizeClient(row.cliente),toneladas:Number(row.toneladas)})):MONTH_PROJECTS.map(row=>({name:normalizeClient(row[0]),toneladas:Number(row[2])})))),[mode,dayRows,liveRows]);

  const total=projectRows.reduce((sum,row)=>sum+row.toneladas,0);
  const top3=clientRows.slice(0,3).reduce((sum,row)=>sum+row.toneladas,0);
  const sourceRows=mode==='day'?dayRows:liveRows;
  const filtered=sourceRows.filter(row=>`${row.ticket} ${row.placa} ${row.camion} ${row.cliente} ${row.proyecto}`.toLowerCase().includes(query.toLowerCase()));
  const dispatchCount=mode==='day'?dayRows.length:(liveRows.length?liveRows.length:0);
  const avgDispatch=dispatchCount?total/dispatchCount:0;
  const pieData=[...clientRows.slice(0,5),...(clientRows.length>5?[{name:'OTROS',toneladas:clientRows.slice(5).reduce((s,r)=>s+r.toneladas,0),share:clientRows.slice(5).reduce((s,r)=>s+r.share,0)}]:[])];
  const colors=['#18d6a2','#18b9f2','#7c8cff','#f2bd48','#d66df0','#597184'];

  return <div className="cp-page">
    <section className="cp-hero"><div><span>CLIENT & PROJECT INTELLIGENCE · V6.4</span><h2>Producción por clientes y proyectos</h2><p>Distribución comercial y operativa de las toneladas de la planta, con lectura del último día y del mes completo.</p></div><div className="cp-period-switch"><button className={mode==='day'?'active':''} onClick={()=>setMode('day')}><CalendarDays size={16}/>Última producción</button><button className={mode==='month'?'active':''} onClick={()=>setMode('month')}><BarChart3 size={16}/>Mes completo</button></div></section>

    <div className="cp-kpi-grid">
      <article><FactoryMetric icon={Activity} label="Producción total" value={`${fmt.format(total)} t`} note={mode==='day'?latestDate:period}/></article>
      <article><FactoryMetric icon={UsersRound} label="Clientes activos" value={String(clientRows.length)} note="Clientes atendidos"/></article>
      <article><FactoryMetric icon={BriefcaseBusiness} label="Proyectos activos" value={String(projectRows.length)} note="Proyectos con producción"/></article>
      <article><FactoryMetric icon={Truck} label="Despachos" value={dispatchCount?String(dispatchCount):'—'} note={dispatchCount?`${fmt.format(avgDispatch)} t por despacho`:'Detalle mensual pendiente de sincronizar'}/></article>
      <article><FactoryMetric icon={BarChart3} label="Cliente principal" value={clientRows[0]?.name||'—'} note={clientRows[0]?`${fmt.format(clientRows[0].toneladas)} t · ${pct.format(clientRows[0].share)}%`:''}/></article>
      <article><FactoryMetric icon={Activity} label="Concentración Top 3" value={`${pct.format(total?top3/total*100:0)}%`} note="Participación de los tres principales"/></article>
    </div>

    <div className="cp-chart-grid"><section className="cp-panel"><header><span>RANKING OPERATIVO</span><h3>Producción por proyecto</h3></header><HorizontalRanking data={projectRows}/></section><section className="cp-panel"><header><span>CONCENTRACIÓN COMERCIAL</span><h3>Producción por cliente</h3></header><HorizontalRanking data={clientRows}/></section></div>

    <div className="cp-chart-grid cp-lower-grid"><section className="cp-panel"><header><span>PARTICIPACIÓN</span><h3>Distribución por cliente</h3></header><div className="cp-pie-wrap"><ResponsiveContainer width="100%" height={330}><PieChart><Pie data={pieData} dataKey="toneladas" nameKey="name" innerRadius={72} outerRadius={112} paddingAngle={3}>{pieData.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip content={<IntelligenceTooltip/>}/><Legend wrapperStyle={{fontSize:10,color:'#a7becd'}}/></PieChart></ResponsiveContainer><div className="cp-pie-center"><strong>{fmt.format(total)}</strong><span>toneladas</span></div></div></section><section className="cp-panel cp-concentration"><header><span>LECTURA EJECUTIVA</span><h3>Concentración del periodo</h3></header><div className="cp-concentration-list">{clientRows.slice(0,5).map((row,index)=><div key={row.name}><div><span>#{index+1} {row.name}</span><strong>{pct.format(row.share)}%</strong></div><i><b style={{width:`${row.share}%`}}/></i></div>)}</div><p>{clientRows[0]?`${clientRows[0].name} concentra ${pct.format(clientRows[0].share)}% de la producción. Los tres clientes principales representan ${pct.format(total?top3/total*100:0)}%.`:'Sin datos disponibles.'}</p></section></div>

    <section className="cp-panel cp-comparison"><header><span>DÍA VS MES</span><h3>Participación de los proyectos del último día dentro del mes</h3></header><div className="table-wrap"><table><thead><tr><th>Proyecto</th><th>Cliente</th><th>Último día</th><th>Mes</th><th>Participación del mes</th></tr></thead><tbody>{aggregate(dayRows.map(row=>({name:row.proyecto,toneladas:Number(row.toneladas),secondary:row.cliente}))).map(day=>{const month=aggregate(MONTH_PROJECTS.map(row=>({name:row[1],toneladas:Number(row[2]),secondary:row[0]}))).find(item=>item.name.toUpperCase()===day.name.toUpperCase());return <tr key={day.name}><td>{day.name}</td><td>{day.secondary}</td><td>{fmt.format(day.toneladas)} t</td><td>{month?`${fmt.format(month.toneladas)} t`:'—'}</td><td>{month?`${pct.format(day.toneladas/month.toneladas*100)}%`:'—'}</td></tr>})}</tbody></table></div></section>

    <section className="cp-panel cp-dispatches"><header><div><span>TRAZABILIDAD</span><h3>Detalle operativo de despachos</h3></div><label><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar ticket, placa, cliente o proyecto"/></label></header>{mode==='month'&&!liveRows.length?<div className="cp-data-note"><FileText size={18}/><span>El consolidado mensual está disponible. Para mostrar todos los tickets del mes en línea, publique la tabla <code>erp_dashboard_despachos</code> desde el ERP.</span></div>:<div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Placa</th><th>Camión</th><th>Cliente</th><th>Proyecto</th><th>Producción</th></tr></thead><tbody>{filtered.map(row=><tr key={row.codigo}><td>{row.ticket||'—'}</td><td>{row.placa||'—'}</td><td>{row.camion||'—'}</td><td>{row.cliente}</td><td>{row.proyecto}</td><td>{fmt.format(row.toneladas)} t</td></tr>)}</tbody></table></div>}</section>
  </div>;
}

function FactoryMetric({icon:Icon,label,value,note}:{icon:any;label:string;value:string;note:string}){
  return <><div className="cp-kpi-head"><span><Icon size={17}/></span><small>{label}</small></div><strong>{value}</strong><p>{note}</p></>;
}
