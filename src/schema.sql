-- SmartPlant Portal · Esquema definitivo V4
-- Idempotente: puede ejecutarse varias veces sin errores.

create extension if not exists pgcrypto;

create table if not exists public.erp_reportes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  titulo text not null,
  descripcion text,
  categoria text not null default 'Otros',
  periodo text,
  formato text not null,
  archivo_nombre text not null,
  archivo_url text not null,
  archivo_size bigint default 0,
  archivo_hash text,
  estado text not null default 'publicado',
  fecha_generacion timestamptz,
  fecha_publicacion timestamptz not null default now(),
  publicado_por text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.erp_indicadores (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  valor numeric not null default 0,
  unidad text,
  categoria text,
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.erp_historial_publicacion (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz not null default now(),
  publicado_por text,
  archivos_publicados integer default 0,
  archivos_error integer default 0,
  detalle jsonb default '{}'::jsonb
);

create table if not exists public.erp_dashboard_resumen (
  id uuid primary key default gen_random_uuid(),
  periodo text unique not null,
  salud text,
  puntaje numeric default 0,
  resumen text,
  costo_total_ton numeric default 0,
  margen_pct numeric default 0,
  diesel_ton numeric default 0,
  ac30_kg_ton numeric default 0,
  total_ton numeric default 0,
  producciones integer default 0,
  produccion_promedio numeric default 0,
  costo_total_mes numeric default 0,
  variacion_pct numeric default 0,
  diesel_planta numeric default 0,
  diesel_apoyo numeric default 0,
  transferencia_interna numeric default 0,
  consumo_equipos numeric default 0,
  costo_equipos numeric default 0,
  ac30_kg numeric default 0,
  lab_ac30_promedio numeric default 0,
  lab_vacios_promedio numeric default 0,
  lab_muestras integer default 0,
  lab_estado text,
  estados jsonb default '{}'::jsonb,
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.erp_dashboard_series (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  periodo text not null,
  fecha date not null,
  toneladas numeric default 0,
  costo_ton numeric default 0,
  ac30_kg_ton numeric default 0,
  diesel_gal_ton numeric default 0,
  tipo_mezcla text
);

create table if not exists public.erp_dashboard_equipos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  periodo text not null,
  equipo text not null,
  galones_consumo numeric default 0,
  galones_transferencia numeric default 0,
  costo_diesel_usd numeric default 0
);

create table if not exists public.erp_dashboard_rankings (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  periodo text not null,
  tipo_ranking text not null,
  posicion integer not null,
  fecha date,
  tipo_mezcla text,
  toneladas numeric default 0,
  costo_ton numeric default 0,
  ac30_kg_ton numeric default 0,
  diesel_gal_ton numeric default 0
);

create table if not exists public.erp_alertas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  periodo text not null,
  modulo text not null,
  severidad text not null,
  mensaje text not null,
  estado text not null default 'abierta',
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists idx_erp_reportes_fecha on public.erp_reportes(fecha_publicacion desc);
create index if not exists idx_erp_reportes_categoria on public.erp_reportes(categoria, periodo);
create index if not exists idx_erp_series_periodo_fecha on public.erp_dashboard_series(periodo, fecha);
create index if not exists idx_erp_equipos_periodo on public.erp_dashboard_equipos(periodo);
create index if not exists idx_erp_rankings_periodo on public.erp_dashboard_rankings(periodo, tipo_ranking, posicion);
create index if not exists idx_erp_alertas_periodo on public.erp_alertas(periodo, estado);

alter table public.erp_reportes add column if not exists destacado boolean default false;
alter table public.erp_reportes add column if not exists orden_destacado integer;
create index if not exists idx_erp_reportes_destacados on public.erp_reportes (destacado, orden_destacado, periodo);

alter table public.erp_reportes enable row level security;
alter table public.erp_indicadores enable row level security;
alter table public.erp_historial_publicacion enable row level security;
alter table public.erp_dashboard_resumen enable row level security;
alter table public.erp_dashboard_series enable row level security;
alter table public.erp_dashboard_equipos enable row level security;
alter table public.erp_dashboard_rankings enable row level security;
alter table public.erp_alertas enable row level security;

-- Las políticas se recrean para que este archivo sea seguro al volver a ejecutarse.
drop policy if exists "Lectura pública reportes publicados" on public.erp_reportes;
create policy "Lectura pública reportes publicados"
  on public.erp_reportes for select using (estado = 'publicado');

drop policy if exists "Lectura pública indicadores" on public.erp_indicadores;
create policy "Lectura pública indicadores"
  on public.erp_indicadores for select using (true);

drop policy if exists "Lectura pública resumen ejecutivo" on public.erp_dashboard_resumen;
create policy "Lectura pública resumen ejecutivo"
  on public.erp_dashboard_resumen for select using (true);

drop policy if exists "Lectura pública series ejecutivas" on public.erp_dashboard_series;
create policy "Lectura pública series ejecutivas"
  on public.erp_dashboard_series for select using (true);

drop policy if exists "Lectura pública equipos" on public.erp_dashboard_equipos;
create policy "Lectura pública equipos"
  on public.erp_dashboard_equipos for select using (true);

drop policy if exists "Lectura pública rankings" on public.erp_dashboard_rankings;
create policy "Lectura pública rankings"
  on public.erp_dashboard_rankings for select using (true);

drop policy if exists "Lectura pública alertas" on public.erp_alertas;
create policy "Lectura pública alertas"
  on public.erp_alertas for select using (true);

-- Limpieza de documentos de desarrollo que no deben aparecer en el portal.
update public.erp_reportes
set estado = 'archivado', updated_at = now()
where lower(coalesce(titulo,'') || ' ' || coalesce(archivo_nombre,'')) ~
      '(template|plantilla|borrador|demo|test|sample|ejemplo|core[_ -]?v2|mock|draft)';

-- Verificación final: debe devolver cinco tablas ejecutivas.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'erp_dashboard_resumen',
    'erp_dashboard_series',
    'erp_dashboard_equipos',
    'erp_dashboard_rankings',
    'erp_alertas'
  )
order by table_name;

-- En Storage debe existir un bucket público llamado: erp-reportes

-- SmartPlant Portal V6.4 · Producción por clientes, proyectos y despachos
create table if not exists public.erp_dashboard_despachos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  periodo text not null,
  fecha date not null,
  ticket text,
  placa text,
  camion text,
  cliente text not null,
  proyecto text not null,
  toneladas numeric not null default 0,
  estado text default 'confirmado',
  fecha_actualizacion timestamptz not null default now()
);
create index if not exists idx_erp_despachos_periodo_fecha on public.erp_dashboard_despachos(periodo,fecha);
create index if not exists idx_erp_despachos_cliente_proyecto on public.erp_dashboard_despachos(cliente,proyecto);
alter table public.erp_dashboard_despachos enable row level security;
drop policy if exists "Lectura pública despachos" on public.erp_dashboard_despachos;
create policy "Lectura pública despachos" on public.erp_dashboard_despachos for select using (true);

