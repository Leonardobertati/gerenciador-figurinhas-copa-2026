drop policy if exists "album_sessions_read" on public.album_sessions;
create policy "album_sessions_read"
on public.album_sessions for select
to anon
using (album_id = 'copa-2026');

drop policy if exists "album_sessions_insert_public" on public.album_sessions;
create policy "album_sessions_insert_public"
on public.album_sessions for insert
to anon
with check (album_id = 'copa-2026');

drop policy if exists "album_sessions_update_public" on public.album_sessions;
create policy "album_sessions_update_public"
on public.album_sessions for update
to anon
using (album_id = 'copa-2026')
with check (album_id = 'copa-2026');

drop policy if exists "album_sessions_delete_public" on public.album_sessions;
create policy "album_sessions_delete_public"
on public.album_sessions for delete
to anon
using (album_id = 'copa-2026');

drop policy if exists "sticker_status_read_main" on public.sticker_status;
drop policy if exists "sticker_status_read_sessions" on public.sticker_status;
create policy "sticker_status_read_sessions"
on public.sticker_status for select
to anon
using (
  exists (
    select 1
    from public.album_sessions
    where album_sessions.id = sticker_status.session_id
      and album_sessions.album_id = 'copa-2026'
  )
);

drop policy if exists "sticker_status_insert_main" on public.sticker_status;
drop policy if exists "sticker_status_insert_sessions" on public.sticker_status;
create policy "sticker_status_insert_sessions"
on public.sticker_status for insert
to anon
with check (
  exists (
    select 1
    from public.album_sessions
    where album_sessions.id = sticker_status.session_id
      and album_sessions.album_id = 'copa-2026'
  )
);

drop policy if exists "sticker_status_update_main" on public.sticker_status;
drop policy if exists "sticker_status_update_sessions" on public.sticker_status;
create policy "sticker_status_update_sessions"
on public.sticker_status for update
to anon
using (
  exists (
    select 1
    from public.album_sessions
    where album_sessions.id = sticker_status.session_id
      and album_sessions.album_id = 'copa-2026'
  )
)
with check (
  exists (
    select 1
    from public.album_sessions
    where album_sessions.id = sticker_status.session_id
      and album_sessions.album_id = 'copa-2026'
  )
);

drop policy if exists "sticker_status_delete_sessions" on public.sticker_status;
create policy "sticker_status_delete_sessions"
on public.sticker_status for delete
to anon
using (
  exists (
    select 1
    from public.album_sessions
    where album_sessions.id = sticker_status.session_id
      and album_sessions.album_id = 'copa-2026'
  )
);
