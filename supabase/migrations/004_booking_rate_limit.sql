-- Protección técnica para recepción pública: contador por ventana de 15 min.
-- Nunca almacena IP ni nombre de cliente; la función Edge entrega una huella hash.
create table if not exists public.tf_booking_rate_limits(
  bucket text primary key check(char_length(bucket) between 16 and 128),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check(attempts >= 0)
);
alter table public.tf_booking_rate_limits enable row level security;
revoke all on public.tf_booking_rate_limits from anon, authenticated;
grant select,insert,update on public.tf_booking_rate_limits to service_role;

create or replace function public.tf_booking_allow(p_bucket text,p_limit integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
  if p_bucket is null or char_length(p_bucket) not between 16 and 128
     or p_limit is null or p_limit < 1 or p_limit > 100 then
    return false;
  end if;
  insert into public.tf_booking_rate_limits as r(bucket,window_started_at,attempts)
  values(p_bucket,now(),1)
  on conflict(bucket) do update set
    attempts=case when r.window_started_at < now()-interval '15 minutes'
      then 1 else r.attempts+1 end,
    window_started_at=case when r.window_started_at < now()-interval '15 minutes'
      then now() else r.window_started_at end
  returning attempts into n;
  return n<=p_limit;
end; $$;
revoke all on function public.tf_booking_allow(text,integer) from public, anon, authenticated;
grant execute on function public.tf_booking_allow(text,integer) to service_role;
