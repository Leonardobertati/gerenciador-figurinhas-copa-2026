create table if not exists public.stickers (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  secao text not null,
  grupo text,
  ordem_secao integer not null,
  ordem_figurinha integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_sticker_status (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'album-principal',
  codigo text not null,
  colada boolean not null default false,
  repetidas integer not null default 0 check (repetidas >= 0),
  quantidade_total integer not null default 0 check (quantidade_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, codigo)
);

alter table public.user_sticker_status
add column if not exists colada boolean not null default false;

alter table public.user_sticker_status
add column if not exists repetidas integer not null default 0 check (repetidas >= 0);

update public.user_sticker_status
set
  colada = quantidade_total >= 1,
  repetidas = greatest(quantidade_total - 1, 0)
where quantidade_total > 0
  and colada = false
  and repetidas = 0;

alter table public.stickers enable row level security;
alter table public.user_sticker_status enable row level security;

drop policy if exists "stickers_read_all" on public.stickers;
create policy "stickers_read_all"
on public.stickers for select
to anon
using (true);

drop policy if exists "status_read_all" on public.user_sticker_status;
create policy "status_read_all"
on public.user_sticker_status for select
to anon
using (true);

drop policy if exists "status_insert_all" on public.user_sticker_status;
create policy "status_insert_all"
on public.user_sticker_status for insert
to anon
with check (user_id = 'album-principal');

drop policy if exists "status_update_all" on public.user_sticker_status;
create policy "status_update_all"
on public.user_sticker_status for update
to anon
using (user_id = 'album-principal')
with check (user_id = 'album-principal');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_sticker_status_updated_at on public.user_sticker_status;
create trigger user_sticker_status_updated_at
before update on public.user_sticker_status
for each row
execute function public.set_updated_at();
