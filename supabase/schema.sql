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

alter table public.erp_reportes enable row level security;
alter table public.erp_indicadores enable row level security;
alter table public.erp_historial_publicacion enable row level security;

create policy "Lectura pública reportes publicados" on public.erp_reportes for select using (estado = 'publicado');
create policy "Lectura pública indicadores" on public.erp_indicadores for select using (true);

-- En Storage cree un bucket público llamado: erp-reportes
