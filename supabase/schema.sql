create table if not exists public.album_metadata (
  id text primary key,
  nome text not null,
  temporada text not null default '2026',
  total_figurinhas integer not null check (total_figurinhas > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.album_sessions (
  id text primary key,
  album_id text not null references public.album_metadata(id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stickers (
  codigo text primary key,
  secao text not null,
  grupo text,
  tipo text not null check (tipo in ('FWC', 'Selecao', 'Coca-Cola')),
  ordem_secao integer not null,
  ordem_figurinha integer not null,
  ordem_album integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sticker_status (
  session_id text not null references public.album_sessions(id) on delete cascade,
  codigo text not null references public.stickers(codigo) on update cascade on delete cascade,
  possui boolean not null default false,
  repetidas integer not null default 0 check (repetidas >= 0),
  quantidade_total integer generated always as ((case when possui then 1 else 0 end) + repetidas) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, codigo)
);

create index if not exists sticker_status_codigo_idx on public.sticker_status(codigo);
create index if not exists sticker_status_updated_at_idx on public.sticker_status(updated_at desc);

insert into public.album_metadata (id, nome, temporada, total_figurinhas)
values ('copa-2026', 'Figurinhas Copa 2026', '2026', 994)
on conflict (id) do update
set
  nome = excluded.nome,
  temporada = excluded.temporada,
  total_figurinhas = excluded.total_figurinhas,
  updated_at = now();

insert into public.album_sessions (id, album_id, nome)
values ('album-principal', 'copa-2026', 'Album principal')
on conflict (id) do update
set
  album_id = excluded.album_id,
  nome = excluded.nome,
  updated_at = now();

with fwc_part_1(codigo, ordem_figurinha) as (
  values
    ('00', 1),
    ('FWC1', 2),
    ('FWC2', 3),
    ('FWC3', 4),
    ('FWC4', 5),
    ('FWC5', 6),
    ('FWC6', 7),
    ('FWC7', 8),
    ('FWC8', 9)
),
fwc_part_2(codigo, ordem_figurinha) as (
  select 'FWC' || gs::text, gs - 8
  from generate_series(9, 19) as gs
),
team_sections(codigo, nome, ordem_secao, grupo) as (
  values
    ('MEX', 'Mexico', 3, 'Grupo A'),
    ('RSA', 'Africa do Sul', 4, 'Grupo A'),
    ('KOR', 'Coreia do Sul', 5, 'Grupo A'),
    ('CZE', 'Republica Tcheca', 6, 'Grupo A'),
    ('CAN', 'Canada', 7, 'Grupo B'),
    ('BIH', 'Bosnia e Herzegovina', 8, 'Grupo B'),
    ('QAT', 'Catar', 9, 'Grupo B'),
    ('SUI', 'Suica', 10, 'Grupo B'),
    ('BRA', 'Brasil', 11, 'Grupo C'),
    ('MAR', 'Marrocos', 12, 'Grupo C'),
    ('HAI', 'Haiti', 13, 'Grupo C'),
    ('SCO', 'Escocia', 14, 'Grupo C'),
    ('USA', 'Estados Unidos', 15, 'Grupo D'),
    ('PAR', 'Paraguai', 16, 'Grupo D'),
    ('AUS', 'Australia', 17, 'Grupo D'),
    ('TUR', 'Turquia', 18, 'Grupo D'),
    ('GER', 'Alemanha', 19, 'Grupo E'),
    ('CUW', 'Curacao', 20, 'Grupo E'),
    ('CIV', 'Costa do Marfim', 21, 'Grupo E'),
    ('ECU', 'Equador', 22, 'Grupo E'),
    ('NED', 'Holanda', 23, 'Grupo F'),
    ('JPN', 'Japao', 24, 'Grupo F'),
    ('SWE', 'Suecia', 25, 'Grupo F'),
    ('TUN', 'Tunisia', 26, 'Grupo F'),
    ('BEL', 'Belgica', 27, 'Grupo G'),
    ('EGY', 'Egito', 28, 'Grupo G'),
    ('IRN', 'Ira', 29, 'Grupo G'),
    ('NZL', 'Nova Zelandia', 30, 'Grupo G'),
    ('ESP', 'Espanha', 31, 'Grupo H'),
    ('CPV', 'Cabo Verde', 32, 'Grupo H'),
    ('KSA', 'Arabia Saudita', 33, 'Grupo H'),
    ('URU', 'Uruguai', 34, 'Grupo H'),
    ('FRA', 'Franca', 35, 'Grupo I'),
    ('SEN', 'Senegal', 36, 'Grupo I'),
    ('IRQ', 'Iraque', 37, 'Grupo I'),
    ('NOR', 'Noruega', 38, 'Grupo I'),
    ('ARG', 'Argentina', 39, 'Grupo J'),
    ('ALG', 'Argelia', 40, 'Grupo J'),
    ('AUT', 'Austria', 41, 'Grupo J'),
    ('JOR', 'Jordania', 42, 'Grupo J'),
    ('POR', 'Portugal', 43, 'Grupo K'),
    ('COD', 'Congo RD', 44, 'Grupo K'),
    ('UZB', 'Uzbequistao', 45, 'Grupo K'),
    ('COL', 'Colombia', 46, 'Grupo K'),
    ('ENG', 'Inglaterra', 47, 'Grupo L'),
    ('CRO', 'Croacia', 48, 'Grupo L'),
    ('GHA', 'Gana', 49, 'Grupo L'),
    ('PAN', 'Panama', 50, 'Grupo L')
),
generated_stickers as (
  select codigo, 'FWC - Parte 1' as secao, 'FWC' as grupo, 'FWC' as tipo, 1 as ordem_secao, ordem_figurinha, ordem_figurinha as ordem_album
  from fwc_part_1
  union all
  select codigo, 'FWC - Parte 2', 'FWC', 'FWC', 2, ordem_figurinha, 9 + ordem_figurinha
  from fwc_part_2
  union all
  select
    team_sections.codigo || sticker_number::text,
    team_sections.nome,
    team_sections.grupo,
    'Selecao',
    team_sections.ordem_secao,
    sticker_number,
    20 + ((team_sections.ordem_secao - 3) * 20) + sticker_number
  from team_sections
  cross join generate_series(1, 20) as sticker_number
  union all
  select
    'CC' || sticker_number::text,
    'Coca-Cola',
    'CC',
    'Coca-Cola',
    51,
    sticker_number,
    980 + sticker_number
  from generate_series(1, 14) as sticker_number
)
insert into public.stickers (
  codigo,
  secao,
  grupo,
  tipo,
  ordem_secao,
  ordem_figurinha,
  ordem_album
)
select
  codigo,
  secao,
  grupo,
  tipo,
  ordem_secao,
  ordem_figurinha,
  ordem_album
from generated_stickers
on conflict (codigo) do update
set
  secao = excluded.secao,
  grupo = excluded.grupo,
  tipo = excluded.tipo,
  ordem_secao = excluded.ordem_secao,
  ordem_figurinha = excluded.ordem_figurinha,
  ordem_album = excluded.ordem_album,
  updated_at = now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists album_metadata_updated_at on public.album_metadata;
create trigger album_metadata_updated_at
before update on public.album_metadata
for each row execute function public.set_updated_at();

drop trigger if exists album_sessions_updated_at on public.album_sessions;
create trigger album_sessions_updated_at
before update on public.album_sessions
for each row execute function public.set_updated_at();

drop trigger if exists stickers_updated_at on public.stickers;
create trigger stickers_updated_at
before update on public.stickers
for each row execute function public.set_updated_at();

drop trigger if exists sticker_status_updated_at on public.sticker_status;
create trigger sticker_status_updated_at
before update on public.sticker_status
for each row execute function public.set_updated_at();

alter table public.album_metadata enable row level security;
alter table public.album_sessions enable row level security;
alter table public.stickers enable row level security;
alter table public.sticker_status enable row level security;

drop policy if exists "album_metadata_read" on public.album_metadata;
create policy "album_metadata_read"
on public.album_metadata for select
to anon
using (true);

drop policy if exists "album_sessions_read" on public.album_sessions;
create policy "album_sessions_read"
on public.album_sessions for select
to anon
using (true);

drop policy if exists "stickers_read" on public.stickers;
create policy "stickers_read"
on public.stickers for select
to anon
using (true);

drop policy if exists "sticker_status_read_main" on public.sticker_status;
create policy "sticker_status_read_main"
on public.sticker_status for select
to anon
using (session_id = 'album-principal');

drop policy if exists "sticker_status_insert_main" on public.sticker_status;
create policy "sticker_status_insert_main"
on public.sticker_status for insert
to anon
with check (session_id = 'album-principal');

drop policy if exists "sticker_status_update_main" on public.sticker_status;
create policy "sticker_status_update_main"
on public.sticker_status for update
to anon
using (session_id = 'album-principal')
with check (session_id = 'album-principal');

alter table public.sticker_status replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sticker_status'
  ) then
    alter publication supabase_realtime add table public.sticker_status;
  end if;
end;
$$;
