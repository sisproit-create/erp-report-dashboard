import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  ClipboardList,
  Download,
  Droplets,
  Factory,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Fuel,
  Gauge,
  Menu,
  PackageSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from './lib/supabase';

type Report = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  periodo: string | null;
  formato: string;
  archivo_nombre: string;
  archivo_url: string;
  archivo_size: number;
  fecha_publicacion: string;
};

type Indicator = {
  codigo: string;
  nombre: string;
  valor: number;
  unidad: string;
  categoria: string;
  fecha_actualizacion: string;
};

type ViewKey =
  | 'resumen'
  | 'produccion'
  | 'despachos'
  | 'combustible'
  | 'ac30'
  | 'inventarios'
  | 'calidad'
  | 'requisiciones'
  | 'reportes'
  | 'alertas';

const fmt = new Intl.NumberFormat('es-PA', { maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat('es-PA', { dateStyle: 'medium', timeStyle: 'short' });
const compactDateFmt = new Intl.DateTimeFormat('es-PA', { dateStyle: 'medium' });

const NAV_ITEMS: Array<{ key: ViewKey; label: string; icon: typeof Activity }> = [
  { key: 'resumen', label: 'Resumen Ejecutivo', icon: BarChart3 },
  { key: 'produccion', label: 'Producción', icon: Factory },
  { key: 'despachos', label: 'Despachos por proyecto', icon: TrendingUp },
  { key: 'combustible', label: 'Combustible', icon: Fuel },
  { key: 'ac30', label: 'AC30', icon: Droplets },
  { key: 'inventarios', label: 'Inventarios', icon: Boxes },
  { key: 'calidad', label: 'Calidad', icon: ShieldCheck },
  { key: 'requisiciones', label: 'Requisiciones', icon: ClipboardList },
  { key: 'reportes', label: 'Biblioteca de reportes', icon: FolderOpen },
  { key: 'alertas', label: 'Alertas', icon: AlertTriangle },
];

const CATEGORY_ALIASES: Record<ViewKey, string[]> = {
  resumen: [],
  produccion: ['Producción'],
  despachos: ['Producción y despachos', 'Despachos'],
  combustible: ['Combustible', 'Recepciones'],
  ac30: ['AC30'],
  inventarios: ['Inventarios'],
  calidad: ['Calidad'],
  requisiciones: ['Requisiciones'],
  reportes: [],
  alertas: ['Gerencia'],
};

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function iconForIndicator(indicator: Indicator) {
  const value = normalize(`${indicator.nombre} ${indicator.categoria}`);
  if (value.includes('produccion') || value.includes('proyecto')) return Factory;
  if (value.includes('diesel') || value.includes('combustible')) return Fuel;
  if (value.includes('ac30')) return Droplets;
  if (value.includes('inventario')) return Boxes;
  if (value.includes('reporte')) return FolderOpen;
  if (value.includes('alerta')) return AlertTriangle;
  return Gauge;
}

function formatSize(size: number) {
  if (!size) return '—';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function categoryMatches(report: Report, aliases: string[]) {
  if (!aliases.length) return true;
  const category = normalize(report.categoria);
  return aliases.some((alias) => category.includes(normalize(alias)));
}

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const Icon = iconForIndicator(indicator);
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-icon"><Icon size={19} /></span>
        <span className="metric-category">{indicator.categoria || 'ERP'}</span>
      </div>
      <div className="metric-value">
        {fmt.format(Number(indicator.valor))}
        {indicator.unidad && <small>{indicator.unidad}</small>}
      </div>
      <div className="metric-label">{indicator.nombre}</div>
      <div className="metric-date">Actualizado {compactDateFmt.format(new Date(indicator.fecha_actualizacion))}</div>
    </article>
  );
}

function StatusPill({ label, tone = 'ok' }: { label: string; tone?: 'ok' | 'warn' | 'danger' | 'neutral' }) {
  return <span className={`status-pill ${tone}`}>{label}</span>;
}

function ReportList({ reports, limit = 6 }: { reports: Report[]; limit?: number }) {
  const rows = reports.slice(0, limit);
  return (
    <div className="compact-report-list">
      {rows.map((report) => (
        <a key={report.id} href={report.archivo_url} target="_blank" rel="noreferrer" className="compact-report-row">
          <span className={`file-icon ${report.formato === 'PDF' ? 'pdf' : 'excel'}`}>
            {report.formato === 'PDF' ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
          </span>
          <span className="compact-report-copy">
            <strong>{report.titulo}</strong>
            <small>{report.categoria} · {report.periodo || 'Sin periodo'}</small>
          </span>
          <span className="compact-report-date">{compactDateFmt.format(new Date(report.fecha_publicacion))}</span>
          <ChevronRight size={17} />
        </a>
      ))}
      {!rows.length && <div className="empty compact">No hay informes publicados en esta categoría.</div>}
    </div>
  );
}

function ExecutiveOverview({ reports, indicators }: { reports: Report[]; indicators: Indicator[] }) {
  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    reports.forEach((report) => counts.set(report.categoria || 'Otros', (counts.get(report.categoria || 'Otros') ?? 0) + 1));
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [reports]);

  const productionIndicators = indicators.filter((item) => normalize(item.categoria).includes('produccion'));
  const trendData = reports
    .slice(0, 14)
    .reverse()
    .map((report, index) => ({
      fecha: compactDateFmt.format(new Date(report.fecha_publicacion)),
      publicaciones: index + 1,
    }));

  const topIndicators = [...indicators].sort((a, b) => {
    const priority = (item: Indicator) => {
      const code = normalize(`${item.codigo} ${item.nombre}`);
      if (code.includes('produccion_mes')) return 100;
      if (code.includes('proyecto')) return 90;
      if (code.includes('reporte')) return 50;
      return 60;
    };
    return priority(b) - priority(a);
  }).slice(0, 8);

  return (
    <>
      <section className="metrics-grid">
        {topIndicators.map((indicator) => <IndicatorCard key={indicator.codigo} indicator={indicator} />)}
        {!topIndicators.length && <div className="empty-card">Aún no hay indicadores publicados desde el ERP.</div>}
      </section>

      <section className="dashboard-grid two-one">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Tendencia de publicación</span>
              <h2>Actividad reciente del ERP</h2>
              <p>Evolución acumulada de reportes disponibles en el portal.</p>
            </div>
            <StatusPill label="Sincronizado" />
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={285}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                <Area type="monotone" dataKey="publicaciones" stroke="#38bdf8" fill="url(#activityFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading compact-heading">
            <div>
              <span className="section-kicker">Cobertura documental</span>
              <h2>Reportes por categoría</h2>
            </div>
          </div>
          <div className="chart-box pie-box">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3}>
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa', '#f43f5e', '#14b8a6', '#eab308', '#64748b'][index % 8]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend-list">
              {categoryData.slice(0, 5).map((item, index) => (
                <div key={item.name}><span style={{ background: ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa', '#f43f5e'][index] }} />{item.name}<strong>{item.value}</strong></div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-grid equal">
        <article className="panel">
          <div className="panel-heading compact-heading">
            <div>
              <span className="section-kicker">Últimas publicaciones</span>
              <h2>Informes recientes</h2>
              <p>Documentos publicados directamente desde SAS SmartPlant.</p>
            </div>
          </div>
          <ReportList reports={reports} limit={6} />
        </article>

        <article className="panel operational-panel">
          <div className="panel-heading compact-heading">
            <div>
              <span className="section-kicker">Estado operativo</span>
              <h2>Lectura ejecutiva</h2>
            </div>
          </div>
          <div className="status-stack">
            <div className="status-row"><span><Factory size={18} /> Producción</span><StatusPill label={productionIndicators.length ? 'Datos disponibles' : 'Pendiente'} tone={productionIndicators.length ? 'ok' : 'warn'} /></div>
            <div className="status-row"><span><Fuel size={18} /> Combustible</span><StatusPill label={reports.some((r) => categoryMatches(r, ['Combustible'])) ? 'Reportes activos' : 'Sin publicar'} tone={reports.some((r) => categoryMatches(r, ['Combustible'])) ? 'ok' : 'neutral'} /></div>
            <div className="status-row"><span><Droplets size={18} /> AC30</span><StatusPill label={reports.some((r) => categoryMatches(r, ['AC30'])) ? 'Reportes activos' : 'Sin publicar'} tone={reports.some((r) => categoryMatches(r, ['AC30'])) ? 'ok' : 'neutral'} /></div>
            <div className="status-row"><span><ShieldCheck size={18} /> Calidad</span><StatusPill label={reports.some((r) => categoryMatches(r, ['Calidad'])) ? 'Reportes activos' : 'Sin publicar'} tone={reports.some((r) => categoryMatches(r, ['Calidad'])) ? 'ok' : 'neutral'} /></div>
          </div>
          <div className="insight-box">
            <Activity size={20} />
            <div>
              <strong>Insight del portal</strong>
              <p>El portal muestra automáticamente la información más reciente publicada por el ERP. Los nuevos indicadores aparecerán aquí sin modificar el diseño.</p>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

function ModuleOverview({
  view,
  reports,
  indicators,
}: {
  view: ViewKey;
  reports: Report[];
  indicators: Indicator[];
}) {
  const nav = NAV_ITEMS.find((item) => item.key === view)!;
  const aliases = CATEGORY_ALIASES[view];
  const moduleReports = reports.filter((report) => categoryMatches(report, aliases));
  const moduleIndicators = indicators.filter((indicator) => {
    const category = normalize(indicator.categoria);
    const label = normalize(nav.label);
    return aliases.some((alias) => category.includes(normalize(alias))) || label.includes(category) || category.includes(label);
  });
  const chartData = moduleIndicators.map((item) => ({ name: item.nombre, value: Number(item.valor), unidad: item.unidad }));

  return (
    <>
      <section className="module-hero">
        <div className="module-icon"><nav.icon size={28} /></div>
        <div>
          <span className="section-kicker">Módulo operativo</span>
          <h2>{nav.label}</h2>
          <p>Indicadores, gráficos y documentos relacionados publicados por el ERP.</p>
        </div>
        <div className="module-count"><strong>{moduleReports.length}</strong><span>reportes</span></div>
      </section>

      <section className="metrics-grid module-metrics">
        {moduleIndicators.map((indicator) => <IndicatorCard key={indicator.codigo} indicator={indicator} />)}
        {!moduleIndicators.length && (
          <article className="metric-card placeholder-metric">
            <span className="metric-icon"><Gauge size={19} /></span>
            <strong>Próxima publicación</strong>
            <p>Los KPI de este módulo aparecerán automáticamente cuando el ERP los publique.</p>
          </article>
        )}
      </section>

      <section className="dashboard-grid equal">
        <article className="panel chart-panel">
          <div className="panel-heading compact-heading">
            <div>
              <span className="section-kicker">Indicadores del módulo</span>
              <h2>Resumen gráfico</h2>
            </div>
          </div>
          <div className="chart-box">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={310}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={135} tick={{ fill: '#cbd5e1', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
                  <Bar dataKey="value" fill="#38bdf8" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder"><BarChart3 size={38} /><strong>Esperando datos del ERP</strong><span>El gráfico se activará al publicar indicadores de {nav.label.toLowerCase()}.</span></div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading compact-heading">
            <div>
              <span className="section-kicker">Documentos relacionados</span>
              <h2>Últimos informes</h2>
            </div>
          </div>
          <ReportList reports={moduleReports} limit={8} />
        </article>
      </section>
    </>
  );
}

function ReportsLibrary({ reports, loading }: { reports: Report[]; loading: boolean }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [format, setFormat] = useState('Todos');

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(reports.map((report) => report.categoria))).sort()], [reports]);
  const filtered = useMemo(() => reports.filter((report) => {
    const matchesCategory = category === 'Todos' || report.categoria === category;
    const matchesFormat = format === 'Todos' || report.formato === format;
    const haystack = normalize(`${report.titulo} ${report.descripcion ?? ''} ${report.periodo ?? ''} ${report.categoria}`);
    return matchesCategory && matchesFormat && haystack.includes(normalize(query));
  }), [reports, query, category, format]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    reports.forEach((report) => map.set(report.categoria, (map.get(report.categoria) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  return (
    <>
      <section className="library-summary">
        <article><FolderOpen size={22} /><span><strong>{reports.length}</strong>Total de archivos</span></article>
        <article><FileText size={22} /><span><strong>{reports.filter((r) => r.formato === 'PDF').length}</strong>Documentos PDF</span></article>
        <article><FileSpreadsheet size={22} /><span><strong>{reports.filter((r) => r.formato !== 'PDF').length}</strong>Archivos Excel</span></article>
        <article><PackageSearch size={22} /><span><strong>{categoryCounts.length}</strong>Categorías</span></article>
      </section>

      <section className="panel library-panel">
        <div className="panel-heading library-heading">
          <div>
            <span className="section-kicker">Centro documental</span>
            <h2>Biblioteca de reportes</h2>
            <p>{filtered.length} archivos disponibles según los filtros seleccionados.</p>
          </div>
          <div className="filters">
            <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar informe..." /></label>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={format} onChange={(event) => setFormat(event.target.value)}><option>Todos</option><option>PDF</option><option>XLSX</option><option>XLS</option></select>
          </div>
        </div>

        <div className="category-chips">
          {categoryCounts.slice(0, 9).map(([name, count]) => (
            <button key={name} onClick={() => setCategory(name)} className={category === name ? 'selected' : ''}>{name}<span>{count}</span></button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Informe</th><th>Categoría</th><th>Periodo</th><th>Formato</th><th>Tamaño</th><th>Publicado</th><th></th></tr></thead>
            <tbody>
              {filtered.map((report) => (
                <tr key={report.id}>
                  <td><div className="report-name"><span className={`file-icon ${report.formato === 'PDF' ? 'pdf' : 'excel'}`}>{report.formato === 'PDF' ? <FileText /> : <FileSpreadsheet />}</span><div><strong>{report.titulo}</strong><span>{report.descripcion}</span></div></div></td>
                  <td><span className="badge">{report.categoria}</span></td>
                  <td>{report.periodo || '—'}</td>
                  <td>{report.formato}</td>
                  <td>{formatSize(report.archivo_size)}</td>
                  <td>{compactDateFmt.format(new Date(report.fecha_publicacion))}</td>
                  <td><a className="download" href={report.archivo_url} target="_blank" rel="noreferrer"><Download size={16} /> Descargar</a></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !filtered.length && <div className="empty">No hay reportes que coincidan con los filtros.</div>}
        </div>
      </section>
    </>
  );
}

function AlertsPage({ reports, indicators }: { reports: Report[]; indicators: Indicator[] }) {
  const alerts = [
    {
      title: 'Indicadores sin actualización reciente',
      body: indicators.length ? 'Revise la fecha de actualización de los KPI antes del cierre operativo.' : 'Todavía no existen indicadores publicados desde el ERP.',
      tone: indicators.length ? 'warn' : 'danger',
      module: 'Portal',
    },
    {
      title: 'Cobertura documental',
      body: `${reports.length} archivos están disponibles y organizados en ${new Set(reports.map((r) => r.categoria)).size} categorías.`,
      tone: 'ok',
      module: 'Reportes',
    },
    {
      title: 'Sincronización automática',
      body: 'La página consulta Supabase directamente. No es necesario reconstruir Vercel al actualizar información desde el ERP.',
      tone: 'ok',
      module: 'Integración',
    },
  ];

  return (
    <section className="alerts-layout">
      <article className="panel">
        <div className="panel-heading compact-heading"><div><span className="section-kicker">Monitoreo</span><h2>Alertas del portal</h2><p>Lecturas automáticas basadas en la información actualmente disponible.</p></div></div>
        <div className="alert-list">
          {alerts.map((alert) => (
            <div className={`alert-item ${alert.tone}`} key={alert.title}>
              <AlertTriangle size={20} />
              <div><strong>{alert.title}</strong><p>{alert.body}</p><span>{alert.module}</span></div>
            </div>
          ))}
        </div>
      </article>
      <article className="panel recommendations">
        <div className="panel-heading compact-heading"><div><span className="section-kicker">Acciones sugeridas</span><h2>Próximos pasos</h2></div></div>
        <ol>
          <li>Publicar indicadores de combustible, AC30, inventarios y calidad desde el ERP.</li>
          <li>Definir umbrales para alertas críticas y preventivas.</li>
          <li>Agregar comparación contra mes anterior y metas operativas.</li>
          <li>Incorporar tabla de alertas persistente en Supabase.</li>
        </ol>
      </article>
    </section>
  );
}

export default function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewKey>('resumen');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const [reportResult, indicatorResult] = await Promise.all([
      supabase.from('erp_reportes').select('*').eq('estado', 'publicado').order('fecha_publicacion', { ascending: false }),
      supabase.from('erp_indicadores').select('*').order('nombre'),
    ]);
    if (reportResult.error || indicatorResult.error) {
      setError(reportResult.error?.message || indicatorResult.error?.message || 'No se pudo consultar Supabase.');
    }
    setReports(reportResult.data ?? []);
    setIndicators(indicatorResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const latest = reports[0]?.fecha_publicacion
    ? dateFmt.format(new Date(reports[0].fecha_publicacion))
    : 'Sin publicaciones';
  const currentNav = NAV_ITEMS.find((item) => item.key === view)!;

  const renderContent = () => {
    if (view === 'resumen') return <ExecutiveOverview reports={reports} indicators={indicators} />;
    if (view === 'reportes') return <ReportsLibrary reports={reports} loading={loading} />;
    if (view === 'alertas') return <AlertsPage reports={reports} indicators={indicators} />;
    return <ModuleOverview view={view} reports={reports} indicators={indicators} />;
  };

  return (
    <div className="app-shell">
      <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
        <div className="brand-block">
          <div className="brand-mark"><Factory size={24} /></div>
          <div><strong>SAS SmartPlant</strong><span>ERP Intelligence Portal</span></div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <div className="plant-card">
          <Building2 size={18} />
          <div><small>Planta activa</small><strong>DMI · Panamá</strong></div>
          <StatusPill label="Online" />
        </div>

        <nav className="main-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={view === item.key ? 'active' : ''} onClick={() => { setView(item.key); setSidebarOpen(false); }}>
                <Icon size={18} /><span>{item.label}</span>{view === item.key && <span className="nav-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <span>Última sincronización</span>
          <strong>{latest}</strong>
          <div><span className="sync-dot" /> Supabase conectado</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div>
            <span className="eyebrow">SAS SMARTPLANT · PORTAL EJECUTIVO</span>
            <h1>{currentNav.label}</h1>
            <p>Control consolidado de producción, consumos, inventarios y reportes del ERP.</p>
          </div>
          <div className="topbar-actions">
            <div className="period-box"><small>Periodo de referencia</small><strong>{reports.find((report) => report.periodo)?.periodo || 'Actual'}</strong></div>
            <button className="refresh-button" onClick={() => void load()} disabled={loading}><RefreshCw size={17} className={loading ? 'spin' : ''} />{loading ? 'Actualizando...' : 'Actualizar'}</button>
          </div>
        </header>

        {error && <div className="error-banner"><AlertTriangle size={18} /><span>{error}</span></div>}
        {loading && !reports.length && <div className="loading-state"><RefreshCw className="spin" /><strong>Consultando información del ERP...</strong></div>}
        {!loading || reports.length ? renderContent() : null}

        <footer className="portal-footer"><span>SAS SmartPlant · ERP Intelligence Portal</span><span>Información publicada automáticamente desde el ERP</span></footer>
      </main>
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú" />}
    </div>
  );
}
