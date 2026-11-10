-- TORRE FUERTE · Fase 1: solicitudes, comandas y notas de servicio
-- Ejecutar únicamente en un proyecto Supabase NUEVO e independiente.
create extension if not exists pgcrypto;

create table if not exists public.tf_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.tf_staff enable row level security;
revoke all on public.tf_staff from anon, authenticated;
grant select on public.tf_staff to authenticated;
create policy "tf_staff_own_access" on public.tf_staff for select to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.tf_requests (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity unique,
  folio text generated always as ('TF-' || lpad(seq::text, 6, '0')) stored unique,
  idempotency_key uuid unique,
  source text not null default 'web' check (source in ('web', 'manual')),
  client_name text not null check (char_length(client_name) between 2 and 100),
  client_phone text not null check (char_length(client_phone) between 10 and 20),
  motorcycle text not null check (char_length(motorcycle) between 2 and 100),
  motorcycle_year integer check (motorcycle_year between 1950 and 2100),
  service text not null check (char_length(service) between 2 and 150),
  requested_date date not null,
  requested_slot text not null check (requested_slot in ('Mañana (9:00 a 12:00)', 'Mediodía (12:00 a 15:00)', 'Tarde (15:00 a 18:00)', 'Por acordar')),
  details text not null default '' check (char_length(details) <= 1000),
  internal_notes text not null default '' check (char_length(internal_notes) <= 2000),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'confirmada', 'en_reparacion', 'lista', 'entregada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tf_requests_date_idx on public.tf_requests(requested_date, status);
create index if not exists tf_requests_client_phone_idx on public.tf_requests(client_phone);
alter table public.tf_requests enable row level security;
revoke all on public.tf_requests from anon, authenticated;
grant select, insert, update on public.tf_requests to authenticated;
grant usage, select on sequence public.tf_requests_seq_seq to authenticated;
create policy "tf_staff_read_requests" on public.tf_requests for select to authenticated
  using (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())));
create policy "tf_staff_create_requests" on public.tf_requests for insert to authenticated
  with check (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())));
create policy "tf_staff_update_requests" on public.tf_requests for update to authenticated
  using (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())));

create table if not exists public.tf_service_lines (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tf_requests(id) on delete cascade,
  kind text not null check (kind in ('mano_obra', 'refaccion')),
  description text not null check (char_length(description) between 2 and 200),
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);
create index if not exists tf_service_lines_request_idx on public.tf_service_lines(request_id);
alter table public.tf_service_lines enable row level security;
revoke all on public.tf_service_lines from anon, authenticated;
grant select, insert, update, delete on public.tf_service_lines to authenticated;
create policy "tf_staff_read_lines" on public.tf_service_lines for select to authenticated
  using (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())));
create policy "tf_staff_create_lines" on public.tf_service_lines for insert to authenticated
  with check (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())));
create policy "tf_staff_update_lines" on public.tf_service_lines for update to authenticated
  using (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())));
create policy "tf_staff_delete_lines" on public.tf_service_lines for delete to authenticated
  using (exists (select 1 from public.tf_staff s where s.user_id = (select auth.uid())));

create or replace function public.tf_set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end
$$;
create trigger tf_requests_updated_at before update on public.tf_requests
for each row execute function public.tf_set_updated_at();

comment on table public.tf_requests is 'Solicitudes de cita y órdenes iniciales de Torre Fuerte; folio permanente, no implica cita confirmada.';
comment on table public.tf_service_lines is 'Desglose de refacciones y mano de obra asociado al folio.';
