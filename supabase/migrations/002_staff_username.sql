-- La autenticación del portal usa un nombre público de usuario.
-- El correo real permanece en Supabase Auth; nunca se publica en el JavaScript.
alter table public.tf_staff add column if not exists username text;
create unique index if not exists tf_staff_username_unique on public.tf_staff (lower(username));
alter table public.tf_staff add constraint tf_staff_username_format
  check (username ~ '^[a-z][a-z0-9_]{3,31}$');
comment on column public.tf_staff.username is
  'Nombre de usuario visible del taller; correo Auth solo utilizado en servidor.';

-- La fila de mecanicolider se registra con el UUID real de Auth desde el panel;
-- no incluir IDs personales ni direcciones de correo en una migración versionada.
