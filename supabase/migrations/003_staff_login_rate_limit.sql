-- Límite de intentos de acceso por usuario; solo el servicio autenticador puede usarlo.
create table if not exists public.tf_login_limits (
 username text primary key,
 window_started_at timestamptz not null default now(),
 attempts integer not null default 0
);
alter table public.tf_login_limits enable row level security;
revoke all on public.tf_login_limits from anon,authenticated;
grant select,insert,update on public.tf_login_limits to service_role;
create or replace function public.tf_login_throttle(p_username text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare next_count integer;
begin
 if p_username is null or char_length(p_username)>32 then return false; end if;
 insert into public.tf_login_limits as limits(username,window_started_at,attempts)
 values (p_username,now(),1)
 on conflict(username) do update set
 attempts=case when limits.window_started_at < now()-interval '15 minutes' then 1 else limits.attempts+1 end,
 window_started_at=case when limits.window_started_at < now()-interval '15 minutes' then now() else limits.window_started_at end
 returning attempts into next_count;
 return next_count<=15;
end; $$;
revoke all on function public.tf_login_throttle(text) from public,anon,authenticated;
grant execute on function public.tf_login_throttle(text) to service_role;