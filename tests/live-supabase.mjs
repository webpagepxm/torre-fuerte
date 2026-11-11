// Prueba con el Supabase real. Requiere autorización explícita y credencial segura.
// Nunca se ejecuta como parte de las suites locales habituales.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  readLines,
  persistLines,
  totalCents,
} from "../operacion/service-lines.mjs";

if (!process.argv.includes("--allow-test-records")) {
  console.log(
    "Esta prueba crea una orden ficticia. Solo ejecutar con autorización explícita y --allow-test-records.",
  );
  process.exit(78);
}
if (!process.env.TF_STAFF_PASSWORD) {
  console.log(
    "Pendiente: añadir TF_STAFF_PASSWORD como secreto HTTP del entorno para el host Supabase del proyecto. No compartir contraseñas en el chat.",
  );
  process.exit(78);
}
const sdkPath =
  process.env.TF_SUPABASE_SDK_PATH ||
  "/tmp/tf-live-tools/node_modules/@supabase/supabase-js";
const { createClient } = createRequire(import.meta.url)(sdkPath);
const context = { window: {} };
vm.runInNewContext(
  readFileSync(new URL("../tf-config.js", import.meta.url), "utf8"),
  context,
);
const cfg = context.window.TF_CONFIG;
assert(/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl));
const base = cfg.supabaseUrl.replace(/\/$/, "");
const db = createClient(base, cfg.supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
const marker =
  "TF-QA-" +
  new Date().toISOString().replace(/[:.]/g, "-") +
  "-" +
  randomUUID().slice(0, 8);
const clientName = "PRUEBA CODEX " + marker;
const output = "/tmp/torre-fuerte-qa/live";
mkdirSync(output, { recursive: true });
const report = {
  marker,
  host: new URL(base).hostname,
  checks: [],
  cleanup: null,
  createdOrderId: null,
};
let stage = "iniciar sesión",
  created = null,
  passed = false;
const record = (name) => {
  report.checks.push(name);
  console.log("PASS " + name);
};
const unwrap = (result) => {
  if (result.error) throw result.error;
  if (result.data === null) throw Error("Respuesta sin datos");
  return result.data;
};
const ownOrder = async () => {
  const row = unwrap(
    await db
      .from("tf_requests")
      .select("id,client_name,status")
      .eq("id", created.id)
      .single(),
  );
  assert.equal(
    row.client_name,
    clientName,
    "La orden debe pertenecer a esta prueba",
  );
  return row;
};
try {
  // La credencial puede ser un placeholder: usarla únicamente por el HTTPS proxy autorizado.
  const loginPayload = JSON.stringify({
    username: "mecanicolider",
    password: process.env.TF_STAFF_PASSWORD,
  });
  let session;
  if (process.env.TF_LOGIN_TRANSPORT === "curl") {
    // Comparar el cliente HTTP conservando proxy/CA; jamás poner la contraseña en argumentos o archivos.
    const result = execFileSync(
      "curl",
      [
        "--silent",
        "--show-error",
        "--max-time",
        "25",
        "--request",
        "POST",
        "--header",
        "Content-Type: application/json",
        "--header",
        "Origin: https://webpagepxm.github.io",
        "--header",
        "apikey: " + cfg.supabasePublishableKey,
        "--data-binary",
        "@-",
        "--write-out",
        "\n%{http_code}",
        base + "/functions/v1/tf-staff-login",
      ],
      {
        input: loginPayload,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const split = result.lastIndexOf("\n");
    const status = Number(result.slice(split + 1));
    if (status < 200 || status >= 300) {
      const error = Error("No se pudo autenticar");
      error.status = status;
      throw error;
    }
    session = JSON.parse(result.slice(0, split));
  } else {
    const response = await fetch(base + "/functions/v1/tf-staff-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://webpagepxm.github.io",
        apikey: cfg.supabasePublishableKey,
      },
      body: loginPayload,
    });
    if (!response.ok) {
      const error = Error("No se pudo autenticar");
      error.status = response.status;
      throw error;
    }
    session = await response.json();
  }
  assert(
    session.access_token && session.refresh_token,
    "La función debe devolver una sesión",
  );
  const { error: sessionError } = await db.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (sessionError) throw sessionError;
  const user = unwrap(await db.auth.getUser()).user;
  assert(user?.id);
  assert(
    unwrap(
      await db
        .from("tf_staff")
        .select("user_id")
        .eq("user_id", user.id)
        .single(),
    ),
  );
  record("Acceso con usuario y contraseña y rol del taller");

  stage = "crear orden de prueba";
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  const payload = {
    client_name: clientName,
    client_phone: "0000000000",
    motorcycle: "MOTO FICTICIA " + marker.slice(-8),
    motorcycle_year: 2026,
    service: "PRUEBA DE GUARDADO CODEX",
    requested_date:
      dateParts.year + "-" + dateParts.month + "-" + dateParts.day,
    requested_slot: "Por acordar",
    status: "pendiente",
    details:
      "Orden ficticia autorizada para comprobar el portal. No corresponde a una moto real. " +
      marker,
    source: "manual",
  };
  created = unwrap(
    await db.from("tf_requests").insert(payload).select("*").single(),
  );
  assert(created.id && created.folio);
  report.createdOrderId = created.id;
  report.folio = created.folio;
  writeFileSync(
    output + "/" + marker + "-recovery.json",
    JSON.stringify(
      { id: created.id, client_name: clientName, marker },
      null,
      2,
    ),
  );
  await ownOrder();
  record("Crear cliente/moto ficticios y recibir folio del servidor");
  const { count, error: folioError } = await db
    .from("tf_requests")
    .select("id", { count: "exact", head: true })
    .eq("folio", created.folio);
  if (folioError) throw folioError;
  assert.equal(count, 1);
  record("Folio observado una sola vez en la base");

  stage = "guardar desglose";
  let baseline = await readLines(db, created.id);
  const draft = [
    {
      kind: "mano_obra",
      description: "MANO DE OBRA FICTICIA " + marker.slice(-8),
      quantity: 2,
      unit_price: 125.5,
    },
    {
      kind: "refaccion",
      description: "REFACCIÓN FICTICIA " + marker.slice(-8),
      quantity: 1,
      unit_price: 100,
    },
  ];
  let saved = await persistLines(db, created.id, draft, baseline);
  assert.equal(saved.length, 2);
  assert.equal(totalCents(saved), 35100);
  record(
    "Guardar mano de obra/refacción y verificar total $351.00 por lectura real",
  );
  stage = "modificar y recuperar desglose";
  const edited = structuredClone(saved);
  edited[0].unit_price = 135.5;
  saved = await persistLines(db, created.id, edited, saved);
  assert.equal(totalCents(saved), 37100);
  const recovered = await readLines(db, created.id);
  assert.equal(totalCents(recovered), 37100);
  record("Modificar precios y recuperar desglose persistido: $371.00");
  stage = "actualizar estado";
  await ownOrder();
  const changed = unwrap(
    await db
      .from("tf_requests")
      .update({
        status: "en_reparacion",
        internal_notes: "NOTA INTERNA DE PRUEBA " + marker,
      })
      .eq("id", created.id)
      .eq("client_name", clientName)
      .select("id,status")
      .single(),
  );
  assert.equal(changed.status, "en_reparacion");
  record("Cambiar estado de la orden ficticia");
  stage = "quitar concepto de prueba";
  saved = await persistLines(db, created.id, [{ ...saved[0] }], saved);
  assert.equal(saved.length, 1);
  assert.equal(totalCents(saved), 27100);
  record("Eliminar solo la refacción de prueba y verificar nuevo total");
  passed = true;
} catch (error) {
  report.failure = {
    stage,
    code: error.code || error.name || "ERROR",
    status: error.status || null,
  };
  // No imprimir cuerpos, contraseñas, tokens, cabeceras ni expedientes.
  console.error(
    "FAIL " +
      stage +
      " [" +
      report.failure.code +
      (report.failure.status ? " HTTP " + report.failure.status : "") +
      "]",
  );
  process.exitCode = 1;
} finally {
  if (created) {
    let owned = false,
      linesClean = false,
      canceled = false;
    report.cleanupErrorCodes = [];
    try {
      await ownOrder();
      owned = true;
    } catch (error) {
      report.cleanupErrorCodes.push(
        error.code || error.name || "OWNERSHIP_CHECK_FAILED",
      );
    }
    if (owned) {
      try {
        const remaining = await readLines(db, created.id);
        if (remaining.length) await persistLines(db, created.id, [], remaining);
        linesClean = true;
      } catch (error) {
        report.cleanupErrorCodes.push(
          error.code || error.name || "LINES_CLEANUP_FAILED",
        );
      }
      // Cancelar la orden propia incluso si el fallo investigado impide limpiar conceptos.
      try {
        const row = unwrap(
          await db
            .from("tf_requests")
            .update({
              status: "cancelada",
              internal_notes:
                "PRUEBA CODEX FINALIZADA. Sin moto ni cliente real. " + marker,
            })
            .eq("id", created.id)
            .eq("client_name", clientName)
            .select("id,status")
            .single(),
        );
        assert.equal(row.status, "cancelada");
        canceled = true;
      } catch (error) {
        report.cleanupErrorCodes.push(
          error.code || error.name || "CANCEL_FAILED",
        );
      }
      if (linesClean && canceled) {
        try {
          const deleted = await db
            .from("tf_requests")
            .delete()
            .eq("id", created.id)
            .eq("client_name", clientName)
            .select("id");
          const check = await db
            .from("tf_requests")
            .select("id,status,client_name")
            .eq("id", created.id)
            .maybeSingle();
          if (check.error) throw check.error;
          if (!check.data)
            report.cleanup = "Orden y conceptos de esta prueba eliminados";
          else {
            assert.equal(check.data.client_name, clientName);
            assert.equal(check.data.status, "cancelada");
            report.cleanup =
              "Orden de prueba cancelada, sin conceptos; eliminación no disponible con este rol";
          }
        } catch (error) {
          report.cleanupErrorCodes.push(
            error.code || error.name || "DELETE_CHECK_FAILED",
          );
        }
      }
    }
    if (!report.cleanup) {
      report.cleanup =
        "Revisar la orden ficticia " +
        created.id +
        (canceled ? " (cancelada)" : "");
      process.exitCode = 1;
    }
    console.log(report.cleanup);
  }
  await db.auth.signOut({ scope: "local" }).catch(() => {});
  report.completed = passed;
  report.finishedAt = new Date().toISOString();
  writeFileSync(
    output + "/" + marker + "-result.json",
    JSON.stringify(report, null, 2),
  );
  console.log(
    "Resultado sin credenciales: " + output + "/" + marker + "-result.json",
  );
}
