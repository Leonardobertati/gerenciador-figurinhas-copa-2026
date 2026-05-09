begin;

lock table public.stickers in share row exclusive mode;
lock table public.sticker_status in share row exclusive mode;

alter table public.sticker_status
  drop constraint if exists sticker_status_codigo_fkey;

alter table public.sticker_status
  add constraint sticker_status_codigo_fkey
  foreign key (codigo)
  references public.stickers(codigo)
  on update cascade
  on delete cascade;

-- If SEN rows already exist, merge any old SEM progress into them before
-- removing the obsolete status rows. Use OR/GREATEST to preserve progress
-- without double-counting a sticker that may have been partially migrated.
insert into public.sticker_status (
  session_id,
  codigo,
  possui,
  repetidas,
  created_at,
  updated_at
)
select
  old_status.session_id,
  regexp_replace(old_status.codigo, '^SEM', 'SEN'),
  old_status.possui,
  old_status.repetidas,
  old_status.created_at,
  now()
from public.sticker_status as old_status
where old_status.codigo ~ '^SEM([1-9]|1[0-9]|20)$'
  and exists (
    select 1
    from public.stickers as sen_sticker
    where sen_sticker.codigo = regexp_replace(old_status.codigo, '^SEM', 'SEN')
  )
on conflict (session_id, codigo) do update
set
  possui = sticker_status.possui or excluded.possui,
  repetidas = greatest(sticker_status.repetidas, excluded.repetidas),
  updated_at = now();

delete from public.sticker_status as old_status
where old_status.codigo ~ '^SEM([1-9]|1[0-9]|20)$'
  and exists (
    select 1
    from public.stickers as sen_sticker
    where sen_sticker.codigo = regexp_replace(old_status.codigo, '^SEM', 'SEN')
  );

delete from public.stickers as old_sticker
where old_sticker.codigo ~ '^SEM([1-9]|1[0-9]|20)$'
  and exists (
    select 1
    from public.stickers as sen_sticker
    where sen_sticker.codigo = regexp_replace(old_sticker.codigo, '^SEM', 'SEN')
  );

update public.stickers
set
  codigo = regexp_replace(codigo, '^SEM', 'SEN'),
  secao = 'Senegal',
  updated_at = now()
where codigo ~ '^SEM([1-9]|1[0-9]|20)$';

do $$
declare
  old_sticker_count integer;
  old_status_count integer;
  sen_sticker_count integer;
begin
  select count(*)
  into old_sticker_count
  from public.stickers
  where codigo ~ '^SEM([1-9]|1[0-9]|20)$';

  select count(*)
  into old_status_count
  from public.sticker_status
  where codigo ~ '^SEM([1-9]|1[0-9]|20)$';

  select count(*)
  into sen_sticker_count
  from public.stickers
  where codigo ~ '^SEN([1-9]|1[0-9]|20)$';

  if old_sticker_count > 0 or old_status_count > 0 then
    raise exception 'Senegal code migration incomplete: % SEM stickers and % SEM status rows remain',
      old_sticker_count,
      old_status_count;
  end if;

  if sen_sticker_count <> 20 then
    raise exception 'Senegal code migration expected 20 SEN stickers, found %', sen_sticker_count;
  end if;
end $$;

commit;
