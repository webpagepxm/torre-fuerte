// Torre Fuerte: recepción pública de citas, sin lectura pública de datos.
// Desplegar como función "tf-create-request" con verify_jwt=false.
// El panel privado utiliza Supabase Auth y RLS; esta función SOLO permite insertar.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const ALLOWED_ORIGINS = new Set(["https://webpagepxm.github.io"]);
const MAX_BODY_BYTES = 4000;

function response(body: unknown, status: number, origin: string) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin" });
  if (ALLOWED_ORIGINS.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "content-type, authorization, apikey");
  return new Response(JSON.stringify(body), { status, headers });
}
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}
function validDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const date = new Date(dateString + "T12:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateString) return false;
  if (date.getUTCDay() === 0) return false;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const today = lookup.year + "-" + lookup.month + "-" + lookup.day;
  return dateString >= today && dateString <= new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  if (origin && !ALLOWED_ORIGINS.has(origin)) return response({ error: "Origen no autorizado." }, 403, origin);
  if (req.method === "OPTIONS") return response({}, 204, origin);
  if (req.method !== "POST") return response({ error: "Método no permitido." }, 405, origin);
  if (!(req.headers.get("content-type") || "").includes("application/json")) return response({ error: "Formato no permitido." }, 415, origin);
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return response({ error: "Solicitud demasiado grande." }, 413, origin);
    let input: Record<string, unknown>;
    try { input = JSON.parse(raw); } catch { return response({ error: "Datos inválidos." }, 400, origin); }
    // Honeypot básico: no sustituye un CAPTCHA/rate limit perimetral de producción.
    if (input.website) return response({ ok: true, message: "Solicitud recibida." }, 200, origin);
    if (input.consent !== true) return response({ error: "Debes aceptar el aviso de privacidad." }, 400, origin);

    const client_name = clean(input.nombre, 100);
    const client_phone = clean(input.telefono, 24).replace(/[^\d]/g, "");
    const motorcycle = clean(input.moto, 100);
    const service = clean(input.servicio, 150);
    const requested_date = clean(input.fecha, 10);
    const requested_slot = clean(input.horario, 50);
    const details = clean(input.detalle, 1000);
    const motorcycle_year = input.anio ? Number(input.anio) : null;
    const idempotency_key = clean(input.idempotency_key, 36);
    const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotency_key);
    const allowedSlots = ["Mañana (9:00 a 12:00)", "Mediodía (12:00 a 15:00)", "Tarde (15:00 a 18:00)"];
    if (client_name.length < 2 || client_phone.length < 10 || client_phone.length > 15 || motorcycle.length < 2 ||
        service.length < 2 || !validDate(requested_date) || !allowedSlots.includes(requested_slot) ||
        (motorcycle_year !== null && (!Number.isInteger(motorcycle_year) || motorcycle_year < 1950 || motorcycle_year > 2100)) ||
        !uuidOk) {
      return response({ error: "Revisa nombre, teléfono, motocicleta, servicio, fecha y horario." }, 400, origin);
    }
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
    if (!url || !key) return response({ error: "Registro no disponible temporalmente." }, 503, origin);
    const db = createClient(url, key, { auth: { persistSession: false } });

    const { data: prior, error: priorError } = await db.from("tf_requests")
      .select("id,folio").eq("idempotency_key", idempotency_key).maybeSingle();
    if (priorError) return response({ error: "No se pudo comprobar la solicitud." }, 503, origin);
    if (prior) return response({ ok: true, id: prior.id, folio: prior.folio, duplicate: true }, 200, origin);

    const limitSince = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recent, error: recentError } = await db.from("tf_requests")
      .select("id").eq("client_phone", client_phone).gte("created_at", limitSince).limit(4);
    if (recentError) return response({ error: "No se pudo procesar la solicitud." }, 503, origin);
    if ((recent || []).length >= 4) return response({ error: "Demasiadas solicitudes recientes. Contacta al taller por WhatsApp." }, 429, origin);

    const { data, error } = await db.from("tf_requests").insert({
      idempotency_key, source: "web", client_name, client_phone, motorcycle,
      motorcycle_year, service, requested_date, requested_slot, details, status: "pendiente"
    }).select("id, folio").single();
    if (error) {
      if (error.code === "23505") {
        const { data: already } = await db.from("tf_requests").select("id,folio")
          .eq("idempotency_key", idempotency_key).maybeSingle();
        if (already) return response({ ok: true, id: already.id, folio: already.folio, duplicate: true }, 200, origin);
      }
      return response({ error: "No se pudo guardar tu solicitud. Intenta nuevamente." }, 503, origin);
    }
    return response({ ok: true, id: data.id, folio: data.folio }, 201, origin);
  } catch {
    return response({ error: "Ocurrió un error. Intenta nuevamente." }, 500, origin);
  }
});
