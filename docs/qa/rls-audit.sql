-- Auditoría de metadatos, solo lectura. Ejecutar por un administrador autorizado
-- en el editor SQL del proyecto correcto. No devuelve expedientes ni credenciales.
BEGIN READ ONLY;
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('tf_requests','tf_staff','tf_service_lines');
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
AND tablename IN ('tf_requests','tf_staff','tf_service_lines')
ORDER BY tablename, policyname;
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants WHERE table_schema = 'public'
AND table_name IN ('tf_requests','tf_staff','tf_service_lines')
AND grantee IN ('anon','authenticated','PUBLIC')
ORDER BY table_name, grantee, privilege_type;
SELECT table_name, column_name, data_type, udt_name, is_nullable
FROM information_schema.columns WHERE table_schema='public'
AND table_name IN ('tf_requests','tf_staff','tf_service_lines')
ORDER BY table_name, ordinal_position;
SELECT c.relname AS table_name, con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN ('tf_requests','tf_staff','tf_service_lines');
COMMIT;
