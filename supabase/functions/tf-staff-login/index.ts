// Torre Fuerte · inicio de sesión por usuario (sin publicar el correo de Auth)
// Este endpoint solo recibe usuario + contraseña; las claves elevadas permanecen en Supabase.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const ALLOWED_ORIGIN = "https://webpagepxm.github.io";
const BASE_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  Vary: "Origin",
};

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: BASE_HEADERS });

Deno.serve(async (req: Request) => {
  if (req.headers.get("origin") !== ALLOWED_ORIGIN) {
    return new Response("Origen no autorizado", { status: 403, headers: BASE_HEADERS });
  }
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: BASE_HEADERS });
  if (req.method !== "POST") return respond({ error: "Método no permitido" }, 405);
  if (!(req.headers.get("content-type") || "").includes("application/json")) {
    return respond({ error: "Contenido inválido" }, 415);
  }
  const size = Number(req.headers.get("content-length") || "0");
  if (size > 2048) return respond({ error: "Solicitud demasiado grande" }, 413);

  let payload: { username?: unknown; password?: unknown };
  try {
    const body = await req.text();
    if (body.length > 2048) return respond({ error: "Solicitud demasiado grande" }, 413);
    payload = JSON.parse(body);
  } catch {
    return respond({ error: "Solicitud inválida" }, 400);
  }
  const username = typeof payload?.username === "string"
    ? payload.username.trim().toLowerCase() : "";
  const password = payload?.password;
  if (!/^[a-z][a-z0-9_]{3,31}$/.test(username) || typeof password !== "string" || !password.length || password.length > 256) {
    return respond({ error: "Usuario o contraseña incorrectos" }, 401);
  }
  if (password.length < 12 || /^\d+$/.test(password)) {
    return respond({ error: "La contraseña debe tener al menos 12 caracteres y no ser solo números. Actualízala desde Supabase → Authentication → Users." }, 422);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceKey || !anonKey) return respond({ error: "Servicio no disponible" }, 503);

  try {
    // El usuario y el correo se resuelven únicamente en el servidor.
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    // Control de intentos atómico en Postgres: máximo 15 por usuario cada 15 minutos.
    // También protege frente a clientes que ignoran las reglas CORS del navegador.
    const { data: allowed, error: throttleError } = await admin.rpc("tf_login_throttle", {p_username: username});
    if (throttleError) return respond({ error: "Servicio no disponible" }, 503);
    if (!allowed) return respond({ error: "Demasiados intentos. Intenta de nuevo en 15 minutos." }, 429);
    const { data: staff, error: staffError } = await admin.from("tf_staff")
      .select("user_id").eq("username", username).maybeSingle();
    if (staffError) return respond({ error: "Servicio no disponible" }, 503);
    if (!staff?.user_id) return respond({ error: "Usuario o contraseña incorrectos" }, 401);

    const { data: authUser, error: userError } = await admin.auth.admin.getUserById(staff.user_id);
    if (userError || !authUser?.user?.email) return respond({ error: "Usuario o contraseña incorrectos" }, 401);

    // La contraseña se valida exclusivamente con Supabase Auth, nunca con SQL propio.
    const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await auth.auth.signInWithPassword({ email: authUser.user.email, password });
    if (error || !data?.session || data.user.id !== staff.user_id) {
      return respond({ error: "Usuario o contraseña incorrectos" }, 401);
    }
    return respond({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
    });
  } catch {
    return respond({ error: "No fue posible iniciar sesión" }, 503);
  }
});
