// TORRE FUERTE · Operación V1 · Supabase Auth + RLS
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.95.0/+esm";
import {
  readLines,
  persistLines,
  validateLines,
  totalCents,
  lineTotal,
  saveError,
} from "./service-lines.mjs?v=unslop-20261111-1";
const $ = (id) => document.getElementById(id);
// La dirección de correo de Auth nunca forma parte del código público.
const STAFF_USERNAME = "mecanicolider";
const TOUR_SEEN_KEY = "tf-portal-recorrido-v1";
const cfg = window.TF_CONFIG || {};
const configured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl || "") &&
  typeof cfg.supabasePublishableKey === "string" &&
  cfg.supabasePublishableKey.length > 25;
const db = configured
  ? createClient(cfg.supabaseUrl, cfg.supabasePublishableKey)
  : null;
let records = [],
  grid = null,
  calendar = null,
  selected = null,
  serviceLines = [];
let currentUser = null;
let recordsLoaded = false;
let recordsFailed = false;
const mobileCalendar = matchMedia("(max-width: 760px)");
let savedLines = [],
  linesLoaded = false,
  linesDirty = false,
  savingLines = false;
let orderLoadVersion = 0,
  mobileLimit = 10,
  documentBusy = false,
  savingOrder = false;
const states = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  en_reparacion: "En reparación",
  lista: "Lista",
  entregada: "Entregada",
  cancelada: "Cancelada",
};
const currency = (value) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    Number(value) || 0,
  );
const formatDate = (input) => {
  const p = String(input || "")
    .slice(0, 10)
    .split("-");
  return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : input || "—";
};
const value = (obj, field) => String(obj[field] ?? "");
function message(content, bad = false) {
  $("statusMessage").textContent = content;
  $("statusMessage").className = content ? "alert" + (bad ? " err" : "") : "";
}
function showOrderFeedback(target, content, bad = false) {
  const node = $(target);
  node.textContent = content;
  node.className = "inline-feedback" + (bad ? " is-error" : "");
  node.hidden = !content;
}
// El foco nativo no descuenta las barras fijas de un diálogo. Mantener el
// campo fuera de ellas también cuando el teclado reduce el área visible.
function revealDialogField() {
  const field = document.activeElement;
  if (!field?.matches("input,select,textarea")) return;
  const dialog = field.closest("dialog[open]");
  if (!dialog) return;
  const frame = dialog.getBoundingClientRect();
  const top =
    dialog.querySelector(".dialoghead").getBoundingClientRect().bottom + 12;
  const actions = dialog.querySelector(".dialogactions");
  const viewportBottom = window.visualViewport
    ? visualViewport.offsetTop + visualViewport.height
    : innerHeight;
  const bottom =
    Math.min(
      actions?.getBoundingClientRect().top ?? frame.bottom,
      viewportBottom,
    ) - 12;
  const box = field.getBoundingClientRect();
  if (box.bottom > bottom) dialog.scrollTop += box.bottom - bottom;
  else if (box.top < top) dialog.scrollTop -= top - box.top;
}
document.addEventListener("focusin", revealDialogField);
window.visualViewport?.addEventListener("resize", revealDialogField);
function textRow(parent, title, content) {
  const p = document.createElement("p"),
    strong = document.createElement("strong");
  strong.textContent = title;
  p.append(strong, document.createTextNode(String(content ?? "—")));
  parent.append(p);
  return p;
}
function updateConnectionState() {
  $("connectionMessage").hidden = navigator.onLine || !currentUser;
  $("connectionMessage").textContent =
    "Sin conexión. La lista puede estar desactualizada; los cambios necesitan internet para guardarse.";
}
window.addEventListener("offline", updateConnectionState);
window.addEventListener("online", () => {
  updateConnectionState();
  if (currentUser)
    message("La conexión volvió. Pulsa Actualizar para consultar las órdenes.");
});
function todayLocal() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const data = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return data.year + "-" + data.month + "-" + data.day;
}
async function loginStaff(username, password) {
  if (!db || !configured) throw Error("No se ha configurado la base de datos.");
  const baseUrl = cfg.supabaseUrl.endsWith("/")
    ? cfg.supabaseUrl.slice(0, -1)
    : cfg.supabaseUrl;
  const response = await fetch(baseUrl + "/functions/v1/tf-staff-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: cfg.supabasePublishableKey,
    },
    cache: "no-store",
    body: JSON.stringify({ username, password }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw Error(
      response.status === 401
        ? "Usuario o contraseña incorrectos."
        : response.status === 429
          ? "Demasiados intentos. Intenta de nuevo en 15 minutos."
          : "No se pudo iniciar sesión. Verifica la conexión.",
    );
  }
  const { error } = await db.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
  if (error) throw error;
}
async function hasAccess() {
  if (!db) return false;
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return false;
  const { data: role, error: roleError } = await db
    .from("tf_staff")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (roleError || !role) {
    $("loginMessage").textContent = "Esta cuenta no tiene acceso al taller.";
    await db.auth.signOut();
    return false;
  }
  currentUser = data.user;
  return true;
}
async function enter() {
  if (!(await hasAccess())) return false;
  $("gate").hidden = true;
  $("workspace").hidden = false;
  $("signout").hidden = false;
  $("accountMenu").hidden = false;
  $("restartTour").hidden = false;
  $("changePass").hidden = false;
  $("password").value = "";
  updateConnectionState();
  $("workspaceDate").textContent = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  await loadRecords();
  return true;
}
function leave() {
  currentUser = null;
  records = [];
  recordsLoaded = false;
  recordsFailed = false;
  selected = null;
  serviceLines = [];
  savedLines = [];
  orderLoadVersion++;
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  grid?.clearData();
  calendar?.removeAllEvents();
  $("mobileOrders").replaceChildren();
  $("todayOrders").replaceChildren();
  $("gate").hidden = false;
  $("workspace").hidden = true;
  $("signout").hidden = true;
  $("accountMenu").hidden = true;
  $("accountMenu").open = false;
  $("restartTour").hidden = true;
  $("changePass").hidden = true;
  updateConnectionState();
}
if (!db) {
  $("setupNotice").hidden = false;
  $("loginForm").querySelector("button").disabled = true;
} else {
  try {
    await enter();
  } catch {
    $("loginMessage").textContent =
      "No se pudo conectar. Intenta iniciar sesión.";
  }
}
$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!db) return;
  const submit = $("loginForm").querySelector("button");
  submit.disabled = true;
  $("loginMessage").textContent = "";
  try {
    const username = $("username").value.trim().toLocaleLowerCase("es-MX");
    if (username !== STAFF_USERNAME) throw Error("Usuario no válido.");
    await loginStaff(username, $("password").value);
    if (!(await enter()))
      $("loginMessage").textContent ||= "No autorizado para este taller.";
  } catch (error) {
    $("loginMessage").textContent =
      error?.message ||
      "No se pudo iniciar sesión. Revisa tus datos y conexión.";
  } finally {
    submit.disabled = false;
  }
});
$("signout").addEventListener("click", async () => {
  if (db) await db.auth.signOut();
  leave();
});

document.addEventListener("click", (event) => {
  if ($("accountMenu").open && !$("accountMenu").contains(event.target))
    $("accountMenu").open = false;
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    $("accountMenu").open &&
    !document.querySelector("dialog[open]")
  ) {
    $("accountMenu").open = false;
    $("accountMenu").querySelector("summary").focus();
  }
});
function startWelcomeTour(auto = false) {
  const driverFactory = window.driver?.js?.driver;
  if (typeof driverFactory !== "function") {
    if (!auto)
      message(
        "La guía interactiva no pudo cargarse. Revisa la conexión a internet.",
        true,
      );
    return;
  }
  // Todas las referencias de la guía apuntan a controles visibles, aun con cero solicitudes.
  document.querySelector('[data-tab="orders"]')?.click();
  const tour = driverFactory({
    showProgress: true,
    animate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
    allowClose: true,
    nextBtnText: "Siguiente",
    prevBtnText: "Atrás",
    doneBtnText: "Terminar",
    progressText: "Paso {{current}} de {{total}}",
    steps: [
      {
        element: ".workspacehead",
        popover: {
          title: "Bienvenido a tu taller",
          description:
            "Aquí encuentras las motos registradas, su estado y las solicitudes del día.",
        },
      },
      {
        element: "#newOrder",
        popover: {
          title: "Crear una orden",
          description:
            "Usa este botón cuando una moto llegue directamente al taller. Ingresa cliente, moto y servicio; el folio se crea automáticamente.",
        },
      },
      {
        element: ".activity-summary",
        popover: {
          title: "Cada moto, en su etapa",
          description:
            "Estos números vienen de tus órdenes. Toca un estado para ver solo las motos que necesitan esa atención.",
        },
      },
      {
        element: '[data-tab="orders"]',
        popover: {
          title: "Todas tus órdenes",
          description:
            "Abre la tabla de órdenes para ver datos, modificar estados y generar documentos.",
        },
      },
      {
        element: "#search",
        popover: {
          title: "Encontrar un cliente",
          description:
            "Busca por folio, nombre, teléfono o motocicleta. También puedes filtrar por fecha y estado.",
        },
      },
      {
        element: "#exportCsv",
        popover: {
          title: "Guardar una lista",
          description:
            "Descarga un archivo compatible con Excel. Solo exporta las órdenes visibles según los filtros.",
        },
      },
      {
        element: '[data-tab="calendar"]',
        popover: {
          title: "Tu calendario",
          description:
            "Cambia a Calendario para consultar las fechas solicitadas. Recuerda confirmar las citas antes de recibir la moto.",
        },
      },
      {
        element: "#refresh",
        popover: {
          title: "Actualizar información",
          description:
            "Pulsa aquí para cargar nuevas citas. En el detalle de una orden puedes imprimir la comanda y crear la nota PDF.",
        },
      },
      {
        element: "#restartTour",
        popover: {
          title: "Vuelve cuando quieras",
          description:
            "Con este botón puedes repetir la guía todas las veces que necesites. ¡Listo!",
        },
      },
    ],
  });
  try {
    tour.drive();
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    if (!auto) message("No fue posible iniciar la guía.", true);
  }
}
$("restartTour").addEventListener("click", () => startWelcomeTour());
$("changePass").addEventListener("click", () => {
  $("changePasswordForm").reset();
  $("passwordFeedback").textContent = "";
  $("accountMenu").open = false;
  $("passwordDialog").showModal();
});
$("changePasswordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!db || !currentUser) return;
  const current = $("currentPassword").value;
  const next = $("newPassword").value;
  const feedback = $("passwordFeedback");
  feedback.textContent = "";
  if (next.length < 12 || /^\d+$/.test(next)) {
    feedback.textContent =
      "Usa al menos 12 caracteres y combina palabras, letras o símbolos. Evita claves solo numéricas.";
    return;
  }
  if (next !== $("confirmNewPassword").value) {
    feedback.textContent = "La confirmación no coincide.";
    return;
  }
  if (current === next) {
    feedback.textContent = "La nueva contraseña debe ser distinta a la actual.";
    return;
  }
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    // Revalidar la clave vigente antes de intentar cambiarla.
    try {
      await loginStaff(STAFF_USERNAME, current);
    } catch {
      throw Error("La contraseña actual es incorrecta.");
    }
    const { error } = await db.auth.updateUser({ password: next });
    if (error)
      throw Error(
        "Supabase no permitió cambiar la contraseña. Inténtalo de nuevo.",
      );
    await db.auth.signOut();
    $("passwordDialog").close();
    leave();
    $("loginMessage").textContent =
      "Contraseña actualizada. Vuelve a entrar con tu nueva clave.";
    $("password").value = "";
  } catch (error) {
    feedback.textContent =
      error?.message || "No se pudo guardar la contraseña.";
  } finally {
    button.disabled = false;
  }
});

function renderActivity() {
  $("kpiAll").textContent = String(records.length);
  for (const [id, state] of [
    ["kpiPending", "pendiente"],
    ["kpiConfirmed", "confirmada"],
    ["kpiWorking", "en_reparacion"],
    ["kpiReady", "lista"],
  ]) {
    $(id).textContent = String(
      records.filter((r) => r.status === state).length,
    );
  }
  const today = records.filter(
    (r) =>
      r.requested_date === todayLocal() &&
      !["cancelada", "entregada"].includes(r.status),
  );
  $("todayCount").textContent = today.length
    ? today.length + (today.length === 1 ? " solicitud" : " solicitudes")
    : "Sin solicitudes";
  const holder = $("todayOrders");
  holder.replaceChildren();
  if (!today.length) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "No hay citas solicitadas para hoy.";
    holder.append(p);
  }
  today.slice(0, 3).forEach((record) => {
    const button = document.createElement("button");
    button.className = "day-order";
    const folio = document.createElement("small");
    folio.textContent = record.folio;
    const moto = document.createElement("strong");
    moto.textContent = record.motorcycle;
    const detail = document.createElement("span");
    detail.textContent =
      (states[record.status] || record.status) + " · " + record.requested_slot;
    button.append(folio, moto, detail);
    button.addEventListener("click", () => openOrder(record.id));
    holder.append(button);
  });
}
document.querySelectorAll("[data-state]").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelector('[data-tab="orders"]').click();
    $("filterStatus").value = button.dataset.state;
    grid?.setFilter(filterRow);
    renderMobileOrders();
    $("ordersSection").scrollIntoView({ block: "start", behavior: "instant" });
  }),
);

async function loadRecords() {
  const user = currentUser;
  if (!user) return;
  $("refresh").disabled = true;
  $("refresh").querySelector(".refresh-label").textContent = "Actualizando…";
  $("refresh").setAttribute("aria-label", "Actualizando órdenes");
  $("ordersSection").setAttribute("aria-busy", "true");
  try {
    const { data, error } = await db
      .from("tf_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (currentUser !== user) return;
    if (error) {
      throw error;
    }
    records = data || [];
    recordsLoaded = true;
    recordsFailed = false;
    renderActivity();
    renderMobileOrders();
    renderGrid();
    if (calendar || !$("calendarSection").hidden) renderCalendar();
    if (window.Tabulator)
      message(
        records.length === 1000
          ? "Se muestran las últimas 1000 órdenes; los contadores corresponden a esa lista."
          : "",
      );
  } catch {
    recordsFailed = true;
    renderMobileOrders();
    message(
      recordsLoaded
        ? "No pudimos actualizar. Se conserva la última lista cargada; pulsa Actualizar para reintentar."
        : "No pudimos consultar las órdenes. Revisa la conexión y pulsa Actualizar para reintentar.",
      true,
    );
  } finally {
    $("refresh").disabled = false;
    $("refresh").querySelector(".refresh-label").textContent = "Actualizar";
    $("refresh").setAttribute("aria-label", "Actualizar órdenes");
    $("ordersSection").setAttribute("aria-busy", "false");
  }
}
function filterRow(row) {
  const term = $("search").value.trim().toLocaleLowerCase("es");
  const matches =
    !term ||
    ["folio", "client_name", "client_phone", "motorcycle", "service"].some(
      (k) => value(row, k).toLocaleLowerCase("es").includes(term),
    );
  return (
    matches &&
    (!$("filterStatus").value || row.status === $("filterStatus").value) &&
    (!$("filterDate").value || row.requested_date === $("filterDate").value)
  );
}
function renderGrid() {
  if (!window.Tabulator) {
    message(
      "No se pudo cargar la tabla. Revisa la conexión y pulsa Actualizar.",
      true,
    );
    return;
  }
  if (!grid) {
    grid = new Tabulator("#ordersTable", {
      data: records,
      layout: "fitColumns",
      responsiveLayout: "collapse",
      pagination: true,
      paginationSize: 10,
      paginationElement: $("ordersPagination"),
      placeholder:
        "Sin órdenes para estos filtros. Puedes limpiarlos o recibir una moto.",
      paginationCounter: "rows",
      locale: "es",
      langs: {
        es: {
          pagination: {
            first: "Primera",
            last: "Última",
            prev: "Anterior",
            next: "Siguiente",
            counter: {
              showing: "Mostrando",
              of: "de",
              rows: "órdenes",
              pages: "páginas",
            },
          },
        },
      },
      columns: [
        {
          title: "Folio",
          field: "folio",
          responsive: 0,
          minWidth: 110,
          width: 140,
          formatter: "plaintext",
        },
        {
          title: "Motocicleta",
          field: "motorcycle",
          responsive: 0,
          minWidth: 155,
          formatter: "plaintext",
        },
        {
          title: "Cliente",
          field: "client_name",
          minWidth: 130,
          formatter: "plaintext",
        },
        {
          title: "Fecha",
          field: "requested_date",
          width: 125,
          formatter: (cell) => formatDate(cell.getValue()),
        },
        {
          title: "Estado",
          field: "status",
          width: 150,
          formatter: (cell) => stateBadge(cell.getValue()),
        },
        {
          title: "Abrir",
          responsive: 0,
          width: 86,
          headerSort: false,
          formatter: () => {
            const b = document.createElement("button");
            b.textContent = "Abrir";
            b.type = "button";
            return b;
          },
          cellClick: (_, cell) => openOrder(cell.getRow().getData().id),
        },
      ],
    });
    const labelGrid = () => {
      $("ordersTable").setAttribute(
        "aria-label",
        "Órdenes y solicitudes del taller",
      );
      // Tabulator 6.3.1 anida dos rowgroup en su cabecera. El contenedor interior es solo estructural.
      $("ordersTable")
        .querySelector(".tabulator-header-contents")
        ?.removeAttribute("role");
      $("ordersTable")
        .querySelector(".tabulator-tableholder")
        ?.setAttribute("role", "rowgroup");
      $("ordersTable")
        .querySelector(".tabulator-table")
        ?.setAttribute("role", "presentation");
      const names = {
        first: "Primera página",
        prev: "Página anterior",
        next: "Página siguiente",
        last: "Última página",
      };
      $("ordersPagination")
        .querySelectorAll("button[data-page]")
        .forEach((button) => {
          const name =
            names[button.dataset.page] || "Página " + button.dataset.page;
          button.setAttribute("aria-label", name);
          button.title = name;
        });
    };
    grid.on("tableBuilt", labelGrid);
    grid.on("renderComplete", labelGrid);
  } else grid.replaceData(records);
  grid.setFilter(filterRow);
  renderMobileOrders();
}
function stateBadge(state) {
  const badge = document.createElement("span");
  badge.className =
    "state-badge state--" + (Object.hasOwn(states, state) ? state : "unknown");
  badge.textContent = states[state] || "Sin estado";
  return badge;
}
function renderMobileOrders() {
  const holder = $("mobileOrders");
  holder.replaceChildren();
  const rows = records.filter(filterRow);
  $("listCount").textContent = rows.length
    ? rows.length + (rows.length === 1 ? " orden" : " órdenes")
    : records.length
      ? "Sin coincidencias"
      : "Aún no hay órdenes";
  if (recordsFailed)
    $("listCount").textContent = recordsLoaded
      ? $("listCount").textContent + " · sin actualizar"
      : "Órdenes no disponibles";
  $("ordersLoadError").hidden = recordsLoaded || !recordsFailed;
  const activeFilters = ["filterStatus", "filterDate"].filter(
    (id) => $(id).value,
  ).length;
  $("toggleFilters").textContent = activeFilters
    ? "Filtros (" + activeFilters + ")"
    : "Filtros";
  $("toggleFilters")
    .closest(".filters")
    .classList.toggle(
      "has-filter",
      Boolean(activeFilters || $("search").value.trim()),
    );
  document.querySelectorAll("[data-state]").forEach((button) => {
    const current = button.dataset.state === $("filterStatus").value;
    button.classList.toggle("is-current", current);
    button.setAttribute("aria-pressed", String(current));
  });
  if (!rows.length && recordsLoaded) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = records.length
      ? "No encontramos esa moto. Prueba otro dato o pulsa Limpiar para quitar los filtros."
      : "Aún no hay motos registradas. Pulsa Recibir moto para crear la primera orden.";
    holder.append(p);
  }
  rows.slice(0, mobileLimit).forEach((record) => {
    const article = document.createElement("article");
    article.className = "order-card";
    const header = document.createElement("div");
    header.className = "order-card-head";
    const folio = document.createElement("strong");
    folio.textContent = record.folio;
    header.append(folio, stateBadge(record.status));
    const title = document.createElement("h3");
    title.textContent = record.motorcycle;
    const client = document.createElement("p");
    client.textContent =
      record.client_name + " · " + formatDate(record.requested_date);
    const service = document.createElement("p");
    service.textContent = record.service;
    const open = document.createElement("button");
    open.textContent = "Abrir";
    open.setAttribute("aria-label", "Abrir orden " + record.folio);
    open.addEventListener("click", () => openOrder(record.id));
    article.append(header, title, client, service, open);
    holder.append(article);
  });
  $("moreOrders").hidden = rows.length <= mobileLimit;
}
$("moreOrders").addEventListener("click", () => {
  mobileLimit += 10;
  renderMobileOrders();
});
let calendarAssets;
function ensureCalendarAssets() {
  if (!calendarAssets) {
    const load = (src) =>
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(Error("Calendario no disponible"));
        };
        document.head.append(script);
      });
    calendarAssets = (async () => {
      if (!window.FullCalendar)
        await load(
          "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.19/index.global.min.js",
        );
      await load(
        "https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.19/locales/es.global.min.js",
      );
    })().catch((error) => {
      calendarAssets = null;
      throw error;
    });
  }
  return calendarAssets;
}
// El calendario presenta las mismas órdenes; no crea citas ni reserva horarios.
let calendarSelectedDay = todayLocal();
const calendarDateKey = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
function calendarDayRecords(key) {
  return records.filter(
    (record) => record.status !== "cancelada" && record.requested_date === key,
  );
}
function renderCalendarDay() {
  const date = new Date(calendarSelectedDay + "T12:00:00");
  $("calendarDayTitle").textContent = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  $("calendarDayTitle").textContent =
    $("calendarDayTitle").textContent.charAt(0).toLocaleUpperCase("es") +
    $("calendarDayTitle").textContent.slice(1);
  const day = calendarDayRecords(calendarSelectedDay);
  $("calendarDayCount").textContent = recordsLoaded
    ? day.length +
      (day.length === 1 ? " orden" : " órdenes") +
      (recordsFailed ? " · sin actualizar" : "")
    : "Órdenes no disponibles";
  const holder = $("calendarDayOrders");
  holder.replaceChildren();
  if (!recordsLoaded || !day.length) {
    const empty = document.createElement("p");
    empty.className = "calendar-day-empty";
    empty.textContent = !recordsLoaded
      ? "No pudimos consultar las órdenes. Pulsa Actualizar para reintentar."
      : "No hay órdenes para este día. Elige otra fecha o usa Recibir moto para registrar una orden.";
    holder.append(empty);
  }
  for (const record of day) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day-order";
    button.setAttribute(
      "aria-label",
      "Abrir orden " + record.folio + ", " + record.motorcycle,
    );
    const folio = document.createElement("span");
    folio.className = "calendar-order-folio";
    folio.textContent = record.folio;
    const title = document.createElement("strong");
    title.textContent = record.motorcycle;
    const client = document.createElement("span");
    client.textContent = record.client_name;
    const slot = document.createElement("span");
    slot.className = "calendar-order-slot";
    slot.textContent = "Franja: " + (record.requested_slot || "Por acordar");
    const action = document.createElement("span");
    action.className = "calendar-order-open";
    action.textContent = "Abrir orden";
    button.append(
      folio,
      title,
      client,
      stateBadge(record.status),
      slot,
      action,
    );
    button.addEventListener("click", () => openOrder(record.id));
    holder.append(button);
  }
  const counts = new Map();
  for (const record of records)
    if (record.status !== "cancelada")
      counts.set(
        record.requested_date,
        (counts.get(record.requested_date) || 0) + 1,
      );
  document.querySelectorAll(".calendar-day-number").forEach((button) => {
    const key = button.dataset.date;
    const selected = key === calendarSelectedDay;
    button.tabIndex = selected ? 0 : -1;
    button.setAttribute("aria-pressed", String(selected));
    button
      .closest(".fc-daygrid-day")
      .classList.toggle("calendar-day-selected", selected);
    const count = counts.get(key) || 0;
    button.querySelector(".calendar-day-count").textContent = count
      ? String(count)
      : "";
    button.setAttribute(
      "aria-label",
      new Intl.DateTimeFormat("es-MX", { dateStyle: "full" }).format(
        new Date(key + "T12:00:00"),
      ) +
        ", " +
        count +
        (count === 1 ? " orden" : " órdenes"),
    );
  });
}
function selectCalendarDay(key, focus = false) {
  calendarSelectedDay = key;
  if (
    calendar &&
    (key < calendarDateKey(calendar.view.currentStart) ||
      key >= calendarDateKey(calendar.view.currentEnd))
  )
    calendar.gotoDate(key);
  renderCalendarDay();
  if (focus)
    requestAnimationFrame(() =>
      document
        .querySelector('.calendar-day-number[data-date="' + key + '"]')
        ?.focus(),
    );
}
function calendarDayContent(info) {
  const key = calendarDateKey(info.date);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "calendar-day-number";
  button.dataset.date = key;
  button.tabIndex = key === calendarSelectedDay ? 0 : -1;
  const number = document.createElement("span");
  number.className = "calendar-date-value";
  number.textContent = String(info.date.getDate());
  const count = document.createElement("small");
  count.className = "calendar-day-count";
  count.setAttribute("aria-hidden", "true");
  button.append(number, count);
  button.addEventListener("click", () => selectCalendarDay(key));
  button.addEventListener("keydown", (event) => {
    const shifts = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let shift = shifts[event.key];
    if (event.key === "Home") shift = -((info.date.getDay() + 6) % 7);
    if (event.key === "End") shift = 6 - ((info.date.getDay() + 6) % 7);
    if (shift === undefined) return;
    event.preventDefault();
    const next = new Date(
      info.date.getFullYear(),
      info.date.getMonth(),
      info.date.getDate() + shift,
      12,
    );
    selectCalendarDay(calendarDateKey(next), true);
  });
  return { domNodes: [button] };
}
function calendarEventContent(info) {
  const data = info.event.extendedProps;
  const content = document.createElement("div");
  content.className = "calendar-event-copy";
  const motorcycle = document.createElement("strong");
  motorcycle.textContent = data.motorcycle;
  const detail = document.createElement("span");
  detail.textContent =
    (states[data.status] || "Sin estado") +
    (info.view.type === "listWeek" ? " · " + (data.slot || "Por acordar") : "");
  content.append(motorcycle, detail);
  if (info.view.type === "listWeek") {
    const service = document.createElement("span");
    service.className = "calendar-event-service";
    service.textContent = data.client + " · " + data.service;
    content.append(service);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-event-button";
    button.append(content);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openOrder(info.event.id);
    });
    return { domNodes: [button] };
  }
  return { domNodes: [content] };
}
function syncCalendarView(info) {
  if (
    calendarSelectedDay < calendarDateKey(info.view.currentStart) ||
    calendarSelectedDay >= calendarDateKey(info.view.currentEnd)
  )
    calendarSelectedDay = calendarDateKey(info.view.currentStart);
  $("calendarPeriod").textContent =
    info.view.title.charAt(0).toLocaleUpperCase("es") +
    info.view.title.slice(1);
  const count = records.filter(
    (r) =>
      r.status !== "cancelada" &&
      r.requested_date >= calendarDateKey(info.view.currentStart) &&
      r.requested_date < calendarDateKey(info.view.currentEnd),
  ).length;
  $("calendarPeriodSummary").textContent = recordsLoaded
    ? count +
      (count === 1 ? " orden en este periodo" : " órdenes en este periodo") +
      (recordsFailed ? " · sin actualizar" : "")
    : "Órdenes no disponibles";
  $("calendarWorkspace").dataset.view = info.view.type;
  $("calendarMonth").setAttribute(
    "aria-pressed",
    String(info.view.type === "dayGridMonth"),
  );
  $("calendarAgenda").setAttribute(
    "aria-pressed",
    String(info.view.type === "listWeek"),
  );
  for (const id of [
    "calendarPrev",
    "calendarToday",
    "calendarNext",
    "calendarMonth",
    "calendarAgenda",
  ])
    $(id).disabled = false;
  renderCalendarDay();
}
function wireCalendarPopover(trigger) {
  let cleanup;
  const attach = () => {
    const close = $("calendar").querySelector(".fc-popover-close");
    if (!close) return false;
    if (!close.dataset.keyboardReady) {
      close.dataset.keyboardReady = "true";
      close.tabIndex = 0;
      close.setAttribute("role", "button");
      close.setAttribute("aria-label", "Cerrar órdenes adicionales");
      close.addEventListener("keydown", (event) => {
        if (!["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        close.click();
      });
      close.addEventListener("click", () => trigger?.focus());
    }
    return true;
  };
  if (attach()) return;
  // FullCalendar monta el panel después del callback, también al usar teclado.
  const observer = new MutationObserver(() => {
    if (attach()) {
      observer.disconnect();
      clearTimeout(cleanup);
    }
  });
  observer.observe($("calendar"), { childList: true, subtree: true });
  cleanup = setTimeout(() => observer.disconnect(), 2000);
}
$("calendar").addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || document.querySelector("dialog[open]")) return;
  const close = $("calendar").querySelector(".fc-popover-close");
  if (close) {
    event.preventDefault();
    event.stopPropagation();
    close.click();
  }
});
function calendarTransition() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  $("calendar")
    .getAnimations()
    .forEach((animation) => animation.cancel());
  $("calendar").animate([{ opacity: 0.65 }, { opacity: 1 }], {
    duration: 180,
    easing: "cubic-bezier(.22,1,.36,1)",
  });
}
$("calendarPrev").addEventListener("click", () => {
  calendar?.prev();
  calendarTransition();
});
$("calendarNext").addEventListener("click", () => {
  calendar?.next();
  calendarTransition();
});
$("calendarToday").addEventListener("click", () => {
  calendarSelectedDay = todayLocal();
  calendar?.today();
  renderCalendarDay();
  calendarTransition();
});
$("calendarMonth").addEventListener("click", () => {
  calendar?.changeView("dayGridMonth", calendarSelectedDay);
  calendarTransition();
});
$("calendarAgenda").addEventListener("click", () => {
  calendar?.changeView("listWeek", calendarSelectedDay);
  calendarTransition();
});

async function renderCalendar() {
  if (!currentUser) return;
  if (!recordsLoaded && recordsFailed) {
    $("calendarState").hidden = false;
    $("calendarState").textContent =
      "No pudimos consultar las órdenes. Pulsa Actualizar para reintentar.";
    $("calendarPeriodSummary").textContent = "Órdenes no disponibles";
    $("calendarWorkspace").hidden = true;
    for (const id of [
      "calendarPrev",
      "calendarToday",
      "calendarNext",
      "calendarMonth",
      "calendarAgenda",
    ])
      $(id).disabled = true;
    return;
  }
  if (!calendar) {
    $("calendarState").hidden = false;
    $("calendarState").textContent = "Cargando calendario…";
    $("calendarSection").setAttribute("aria-busy", "true");
  }
  try {
    await ensureCalendarAssets();
  } catch {
    $("calendarState").hidden = false;
    $("calendarState").textContent =
      "No pudimos cargar el calendario. Revisa la conexión y pulsa Actualizar para reintentar.";
    $("calendarPeriodSummary").textContent = "Calendario no disponible";
    $("calendarSection").setAttribute("aria-busy", "false");
    return;
  }
  $("calendarSection").setAttribute("aria-busy", "false");
  $("calendarState").hidden = true;
  if (!currentUser) return;
  $("calendarWorkspace").hidden = false;
  const theme = getComputedStyle(document.documentElement);
  const calendarColors = Object.fromEntries(
    [
      ["pendiente", "--pending"],
      ["confirmada", "--confirmed"],
      ["en_reparacion", "--working"],
      ["lista", "--ready"],
    ].map(([state, token]) => [state, theme.getPropertyValue(token).trim()]),
  );
  const events = records
    .filter((r) => r.status !== "cancelada")
    .map((r) => ({
      id: r.id,
      title:
        r.motorcycle +
        " · " +
        r.client_name +
        " · " +
        r.service +
        " · " +
        (states[r.status] || "Sin estado") +
        " · " +
        r.requested_slot,
      start: r.requested_date,
      allDay: true,
      backgroundColor:
        calendarColors[r.status] || theme.getPropertyValue("--muted").trim(),
      textColor:
        calendarColors[r.status] || theme.getPropertyValue("--muted").trim(),
      borderColor: "transparent",
      extendedProps: {
        motorcycle: r.motorcycle,
        client: r.client_name,
        service: r.service,
        status: r.status,
        slot: r.requested_slot,
        folio: r.folio,
      },
    }));
  if (!calendar) {
    calendar = new FullCalendar.Calendar($("calendar"), {
      initialView: mobileCalendar.matches ? "listWeek" : "dayGridMonth",
      locale: "es",
      firstDay: 1,
      initialDate: calendarSelectedDay,
      fixedWeekCount: false,
      dayMaxEvents: 2,
      moreLinkClick: (info) => {
        wireCalendarPopover(
          info.jsEvent.target.closest(".fc-daygrid-more-link"),
        );
        return "popover";
      },
      moreLinkDidMount: (info) => {
        info.el.setAttribute("role", "button");
        info.el.setAttribute(
          "aria-label",
          info.el.textContent + ". Ver órdenes del día.",
        );
        if (!info.el.getAttribute("aria-controls"))
          info.el.removeAttribute("aria-controls");
        info.el.addEventListener("keydown", (event) => {
          if (!["Enter", " "].includes(event.key) || event.defaultPrevented)
            return;
          event.preventDefault();
          event.stopPropagation();
          info.el.click();
        });
      },
      dayHeaderFormat: { weekday: "short" },
      dayCellContent: calendarDayContent,
      eventContent: calendarEventContent,
      eventClassNames: (info) => [
        "calendar-entry",
        "calendar-entry--" +
          (Object.hasOwn(states, info.event.extendedProps.status)
            ? info.event.extendedProps.status
            : "unknown"),
      ],
      eventDidMount: (info) => {
        const target = info.el.matches("tr")
          ? info.el.querySelector(".calendar-event-button")
          : info.el;
        if (!target) return;
        target.setAttribute("role", "button");
        target.tabIndex = 0;
        target.setAttribute("aria-label", info.event.title + ". Abrir orden.");
        target.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          openOrder(info.event.id);
        });
      },
      datesSet: syncCalendarView,
      buttonText: { today: "Hoy", month: "Mes", list: "Semana" },
      noEventsContent: "No hay citas solicitadas para esta semana",
      allDayText: "Franja",
      viewDidMount: () =>
        $("calendar")
          .querySelectorAll(".fc-icon")
          .forEach((icon) => icon.setAttribute("aria-hidden", "true")),
      height: "auto",
      headerToolbar: false,
      eventClick: (e) => openOrder(e.event.id),
      events,
    });
    calendar.render();
  } else {
    calendar.removeAllEvents();
    calendar.addEventSource(events);
  }
  syncCalendarView({ view: calendar.view });
}
mobileCalendar.addEventListener("change", () => {
  calendar?.changeView(mobileCalendar.matches ? "listWeek" : "dayGridMonth");
});
document.querySelectorAll("[data-tab]").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((b) => {
      b.classList.toggle("active", b === button);
      b.setAttribute("aria-selected", String(b === button));
      b.tabIndex = b === button ? 0 : -1;
    });
    $("workspaceViewName").textContent =
      button.dataset.tab === "orders" ? "Órdenes" : "Calendario";
    document.querySelector(".activity-summary").hidden =
      button.dataset.tab !== "orders";
    $("ordersSection").hidden = button.dataset.tab !== "orders";
    $("calendarSection").hidden = button.dataset.tab !== "calendar";
    if (button.dataset.tab === "calendar") {
      calendar?.updateSize();
      renderCalendar();
    }
  }),
);
document.querySelectorAll('[role="tab"]').forEach((tab) =>
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? $("ordersTab")
        : event.key === "End"
          ? $("calendarTab")
          : tab.id === "ordersTab"
            ? $("calendarTab")
            : $("ordersTab");
    next.click();
    next.focus();
  }),
);
["search", "filterStatus", "filterDate"].forEach((id) =>
  $(id).addEventListener("input", () => {
    mobileLimit = 10;
    grid?.setFilter(filterRow);
    renderMobileOrders();
  }),
);
$("toggleFilters").addEventListener("click", () => {
  const expanded = $("toggleFilters").getAttribute("aria-expanded") !== "true";
  $("toggleFilters").setAttribute("aria-expanded", String(expanded));
  $("toggleFilters")
    .closest(".filters")
    .classList.toggle("is-expanded", expanded);
});
$("resetFilters").addEventListener("click", () => {
  ["search", "filterStatus", "filterDate"].forEach((id) => ($(id).value = ""));
  grid?.setFilter(filterRow);
  renderMobileOrders();
});
$("refresh").addEventListener("click", loadRecords);
// Actualizar solicitudes nuevas sin interrumpir al mecánico.
let lastAutomaticRefresh = Date.now();
let automaticRefreshBusy = false;
async function checkIncomingRequests() {
  if (
    automaticRefreshBusy ||
    !currentUser ||
    document.hidden ||
    $("orderDialog").open ||
    $("newDialog").open ||
    $("passwordDialog").open
  )
    return;
  if (Date.now() - lastAutomaticRefresh < 25000) return;
  lastAutomaticRefresh = Date.now();
  automaticRefreshBusy = true;
  try {
    await loadRecords();
  } finally {
    automaticRefreshBusy = false;
  }
}
window.setInterval(checkIncomingRequests, 45000);
window.addEventListener("focus", checkIncomingRequests);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkIncomingRequests();
});
function csvCell(input) {
  const val = String(input ?? "");
  const neutralized = /^[\s]*[=+\-@\t\r]/.test(val) ? "'" + val : val;
  return '"' + neutralized.replace(/"/g, '""') + '"';
}
$("exportCsv").addEventListener("click", () => {
  const keys = [
    "folio",
    "client_name",
    "client_phone",
    "motorcycle",
    "motorcycle_year",
    "service",
    "requested_date",
    "requested_slot",
    "details",
    "status",
    "created_at",
  ];
  const headings = [
    "Folio",
    "Cliente",
    "Teléfono",
    "Motocicleta",
    "Año",
    "Servicio",
    "Fecha",
    "Horario",
    "Observaciones",
    "Estado",
    "Registro",
  ];
  const content = [
    headings.map(csvCell).join(","),
    ...records
      .filter(filterRow)
      .map((record) => keys.map((k) => csvCell(record[k])).join(",")),
  ].join("\r\n");
  const file = new Blob(["\ufeff" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "torre-fuerte-comandas.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
});
function hasUnsavedOrderChanges() {
  return (
    linesDirty ||
    Boolean(
      selected &&
        ($("orderStatus").value !== selected.status ||
          $("internalNotes").value !== (selected.internal_notes || "")),
    )
  );
}
function hasNewOrderDraft() {
  return [
    "client_name",
    "client_phone",
    "motorcycle",
    "motorcycle_year",
    "service",
    "details",
  ].some((name) => String($("newForm").elements.namedItem(name).value).trim());
}
$("newDialog").addEventListener("cancel", (event) => {
  if (
    $("saveNew").disabled ||
    (hasNewOrderDraft() &&
      !confirm("Hay una orden sin guardar. ¿Cerrar y descartar esos datos?"))
  )
    event.preventDefault();
});
document.querySelectorAll("[data-close]").forEach((b) =>
  b.addEventListener("click", () => {
    if (
      b.dataset.close === "orderDialog" &&
      (savingLines ||
        documentBusy ||
        savingOrder ||
        (hasUnsavedOrderChanges() &&
          !confirm("Hay cambios sin guardar. ¿Cerrar y descartarlos?")))
    )
      return;
    if (
      b.dataset.close === "newDialog" &&
      ($("saveNew").disabled ||
        (hasNewOrderDraft() &&
          !confirm(
            "Hay una orden sin guardar. ¿Cerrar y descartar esos datos?",
          )))
    )
      return;
    $(b.dataset.close).close();
  }),
);
$("newOrder").addEventListener("click", () => {
  showOrderFeedback("newMessage", "");
  $("newForm").reset();
  $("newForm")
    .querySelectorAll("[aria-invalid]")
    .forEach((input) => input.removeAttribute("aria-invalid"));
  $("newForm").elements.namedItem("requested_date").value = todayLocal();
  $("newDialog").showModal();
});
$("newForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("saveNew");
  if (btn.disabled) return;
  btn.disabled = true;
  const fields = Object.fromEntries(new FormData(e.currentTarget).entries());
  for (const name of ["client_name", "motorcycle", "service"]) {
    fields[name] = String(fields[name] || "").trim();
    if (fields[name].length < 2) {
      showOrderFeedback(
        "newMessage",
        "Completa el nombre, la moto y el servicio con al menos 2 caracteres.",
        true,
      );
      const input = $("newForm").elements.namedItem(name);
      input.setAttribute("aria-invalid", "true");
      input.focus();
      btn.disabled = false;
      return;
    }
  }
  const phone = String(fields.client_phone || "").replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 15) {
    showOrderFeedback(
      "newMessage",
      "El teléfono debe tener entre 10 y 15 dígitos.",
      true,
    );
    $("newForm")
      .elements.namedItem("client_phone")
      .setAttribute("aria-invalid", "true");
    $("newForm").elements.namedItem("client_phone").focus();
    btn.disabled = false;
    return;
  }
  const payload = {
    ...fields,
    client_phone: phone,
    source: "manual",
    motorcycle_year: fields.motorcycle_year
      ? Number(fields.motorcycle_year)
      : null,
  };
  btn.textContent = "Guardando…";
  $("newForm").setAttribute("aria-busy", "true");
  const inputs = $("newForm").querySelectorAll("input,select,textarea");
  inputs.forEach((input) => (input.disabled = true));
  try {
    const { data, error } = await db
      .from("tf_requests")
      .insert(payload)
      .select("id,folio")
      .single();
    if (error || !data?.id || !data?.folio)
      throw error || Error("Sin confirmación");
    $("newDialog").close();
    await loadRecords();
    message("Orden " + data.folio + " guardada.");
    await openOrder(data.id);
  } catch {
    showOrderFeedback(
      "newMessage",
      "No pudimos confirmar el guardado. Antes de repetir, cierra y actualiza la lista para comprobar si la moto ya aparece.",
      true,
    );
  } finally {
    btn.disabled = false;
    btn.textContent = "Guardar orden";
    inputs.forEach((input) => (input.disabled = false));
    $("newForm").setAttribute("aria-busy", "false");
  }
});
$("newForm").addEventListener("input", (event) => {
  event.target.removeAttribute("aria-invalid");
});

const ORDER_TOUR_SEEN_KEY = "tf-orden-recorrido-v1";
const orderTourSteps = [
  {
    id: "orderInfo",
    title: "Datos de la orden",
    text: "Aquí aparecen el folio, nombre del cliente, motocicleta, servicio y cita solicitada. Compruébalos antes de continuar.",
  },
  {
    id: "orderStatus",
    title: "Estado de la moto",
    text: "Selecciona si está pendiente, en reparación, lista o entregada. El cambio no se guarda hasta pulsar el botón siguiente.",
  },
  {
    id: "internalNotes",
    title: "Anota los avances",
    text: "Escribe aquí lo que encontraste al revisar la moto o las indicaciones para el trabajo.",
  },
  {
    id: "saveOrder",
    title: "Guardar cambios",
    text: "Pulsa aquí cuando hayas cambiado el estado o las notas internas de la moto.",
  },
  {
    id: "printOrder",
    title: "Comanda para la moto",
    text: "Es el ticket interno que pegas o sujetas a la moto para identificar el trabajo. No lleva precios.",
  },
  {
    id: "addItem",
    title: "Nota · Agregar trabajos",
    text: "La nota es para el cliente. Aquí escribes cada trabajo o refacción, cantidad y precio.",
  },
  {
    id: "saveItems",
    title: "Guardar precios de la nota",
    text: "Guarda los conceptos y el total que verá el cliente. La comanda se imprime desde su propio botón.",
  },
  {
    id: "pdfDownload",
    title: "Descargar nota para el cliente",
    text: "Genera el PDF con los conceptos y el total. No es una factura fiscal.",
  },
  {
    id: "pdfShare",
    title: "Compartir nota con el cliente",
    text: "En teléfonos compatibles puedes compartir el PDF a WhatsApp u otra app. Si no, descárgalo y adjúntalo.",
  },
];
let orderGuideIndex = 0;
function hideOrderGuide() {
  $("orderTourPanel").hidden = true;
  document
    .querySelectorAll(".guide-highlight")
    .forEach((el) => el.classList.remove("guide-highlight"));
}
function renderOrderGuide() {
  const step = orderTourSteps[orderGuideIndex];
  if (!step) return;
  $("orderTourPanel").hidden = false;
  $("orderTourTitle").textContent = step.title;
  $("orderTourText").textContent = step.text;
  $("orderTourCounter").textContent =
    orderGuideIndex + 1 + " / " + orderTourSteps.length;
  $("orderTourPrev").disabled = orderGuideIndex === 0;
  $("orderTourNext").textContent =
    orderGuideIndex === orderTourSteps.length - 1 ? "Terminar" : "Siguiente";
  document
    .querySelectorAll(".guide-highlight")
    .forEach((el) => el.classList.remove("guide-highlight"));
  const highlight = $(step.id);
  if (highlight) {
    highlight.classList.add("guide-highlight");
    highlight.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }
}
function startOrderGuide(auto = false) {
  if (!$("orderDialog").open) return;
  orderGuideIndex = 0;
  renderOrderGuide();
  if (auto) localStorage.setItem(ORDER_TOUR_SEEN_KEY, "1");
}
$("orderTutorialButton").addEventListener("click", () => startOrderGuide());
$("orderTourNext").addEventListener("click", () => {
  if (orderGuideIndex === orderTourSteps.length - 1) {
    hideOrderGuide();
    return;
  }
  orderGuideIndex++;
  renderOrderGuide();
});
$("orderTourPrev").addEventListener("click", () => {
  orderGuideIndex = Math.max(0, orderGuideIndex - 1);
  renderOrderGuide();
});
$("orderTourClose").addEventListener("click", hideOrderGuide);
$("orderDialog").addEventListener("close", hideOrderGuide);

async function openOrder(id) {
  selected = records.find((record) => record.id === id);
  if (!selected) {
    message("La orden ya no está disponible; actualiza el panel.", true);
    return;
  }
  $("orderTitle").textContent = selected.folio;
  const container = $("orderInfo");
  container.replaceChildren();
  textRow(
    container,
    "Motocicleta",
    selected.motorcycle +
      (selected.motorcycle_year ? " · " + selected.motorcycle_year : ""),
  ).className = "order-motorcycle";
  textRow(container, "Cliente", selected.client_name);
  textRow(container, "Teléfono", selected.client_phone);
  textRow(container, "Servicio solicitado", selected.service).className =
    "order-service";
  textRow(
    container,
    "Fecha solicitada",
    formatDate(selected.requested_date) + " · " + selected.requested_slot,
  ).className = "order-service";
  if (selected.details)
    textRow(container, "Observaciones", selected.details).className =
      "order-details";
  $("orderStatus").value = selected.status;
  $("internalNotes").value = selected.internal_notes || "";
  updateOrderSaveState();
  $("items").replaceChildren();
  showOrderFeedback("itemsMessage", "");
  showOrderFeedback("orderMessage", "");
  showOrderFeedback("pdfMessage", "");
  showOrderFeedback("printMessage", "");
  $("orderCompletion").hidden = true;
  linesLoaded = false;
  linesDirty = false;
  savedLines = [];
  serviceLines = [];
  const version = ++orderLoadVersion;
  $("linesState").textContent = "Cargando desglose…";
  setLineControls(true);
  hideOrderGuide();
  $("orderDialog").showModal();
  $("orderDialog").scrollTop = 0;
  try {
    const data = await readLines(db, id);
    if (version !== orderLoadVersion || !$("orderDialog").open) return;
    serviceLines = data;
    savedLines = structuredClone(data);
    linesLoaded = true;
    renderLines();
    setLineControls(false);
  } catch (error) {
    if (version !== orderLoadVersion) return;
    $("linesState").textContent =
      "Desglose no disponible. Cierra y vuelve a abrir la orden para reintentar.";
    showOrderFeedback("itemsMessage", saveError(error), true);
  }
}
function updateOrderSaveState() {
  const changed =
    selected &&
    ($("orderStatus").value !== selected.status ||
      $("internalNotes").value !== (selected.internal_notes || ""));
  $("orderSaveState").textContent = savingOrder
    ? "Guardando…"
    : changed
      ? "Cambios sin guardar"
      : "Sin cambios pendientes";
}
for (const id of ["orderStatus", "internalNotes"]) {
  $(id).addEventListener("input", () => {
    showOrderFeedback("orderMessage", "");
    $("orderCompletion").hidden = true;
    updateOrderSaveState();
  });
}
$("jumpToNote").addEventListener("click", (event) => {
  event.preventDefault();
  $("docClientHeading").focus({ preventScroll: true });
  $("docClientHeading").scrollIntoView({ block: "start", behavior: "instant" });
});
$("completionNote").addEventListener("click", () => $("jumpToNote").click());
$("saveOrder").addEventListener("click", async () => {
  if (!selected || savingOrder) return;
  savingOrder = true;
  const previousStatus = selected.status;
  $("orderCompletion").hidden = true;
  updateOrderSaveState();
  $("orderEditing").setAttribute("aria-busy", "true");
  showOrderFeedback("orderMessage", "");
  $("orderStatus").disabled = true;
  $("internalNotes").disabled = true;
  $("saveOrder").disabled = true;
  try {
    const { data, error } = await db
      .from("tf_requests")
      .update({
        status: $("orderStatus").value,
        internal_notes: $("internalNotes").value,
      })
      .eq("id", selected.id)
      .select("*")
      .single();
    if (error || !data?.id) {
      showOrderFeedback(
        "orderMessage",
        "No se pudo actualizar la orden. Revisa la conexión.",
        true,
      );
      return;
    }
    selected = data;
    await loadRecords();
    showOrderFeedback("orderMessage", "Estado y notas guardados");
    if (
      selected.status !== previousStatus &&
      ["lista", "entregada"].includes(selected.status)
    ) {
      const ready = selected.status === "lista";
      $("completionTitle").textContent = ready
        ? "Lista para entregar"
        : "Entrega registrada";
      $("completionSummary").textContent =
        selected.folio + " · " + selected.motorcycle + " · " + selected.service;
      $("orderCompletion").hidden = false;
      showOrderFeedback(
        "orderMessage",
        ready
          ? "Estado y notas guardados. La orden está lista para entregar."
          : "Estado y notas guardados. La entrega quedó registrada.",
      );
      $("orderCompletion").scrollIntoView({
        block: "nearest",
        behavior: "instant",
      });
    }
    message("Cambios guardados en " + selected.folio + ".");
  } catch {
    showOrderFeedback(
      "orderMessage",
      "No se pudo conectar para guardar los cambios.",
      true,
    );
  } finally {
    savingOrder = false;
    updateOrderSaveState();
    $("orderEditing").setAttribute("aria-busy", "false");
    $("orderStatus").disabled = false;
    $("internalNotes").disabled = false;
    $("saveOrder").disabled = false;
  }
});
function lineElement(line, i) {
  const div = document.createElement("div");
  div.className = "itemrow";
  const make = (title, el) => {
    const label = document.createElement("label");
    label.textContent = title;
    label.appendChild(el);
    div.appendChild(label);
  };
  const type = document.createElement("select");
  [
    ["mano_obra", "Mano de obra"],
    ["refaccion", "Refacción"],
  ].forEach(([v, t]) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = t;
    type.appendChild(o);
  });
  type.value = line.kind;
  type.addEventListener("change", () => {
    serviceLines[i].kind = type.value;
    markLinesDirty();
  });
  make("Tipo", type);
  const description = document.createElement("input");
  description.placeholder = "Descripción";
  description.maxLength = 200;
  description.minLength = 2;
  description.required = true;
  description.value = line.description;
  description.addEventListener("input", () => {
    serviceLines[i].description = description.value;
    markLinesDirty();
  });
  make("Concepto", description);
  const quantity = document.createElement("input");
  quantity.type = "number";
  quantity.step = "0.01";
  quantity.required = true;
  quantity.inputMode = "decimal";
  quantity.min = "0.01";
  quantity.max = "999999";
  quantity.value = Number.isFinite(line.quantity) ? line.quantity : "";
  quantity.addEventListener("input", () => {
    serviceLines[i].quantity =
      quantity.value === "" ? NaN : Number(quantity.value);
    markLinesDirty();
    updateTotal();
  });
  make("Cantidad", quantity);
  const price = document.createElement("input");
  price.type = "number";
  price.min = "0";
  price.step = "0.01";
  price.required = true;
  price.inputMode = "decimal";
  price.max = "99999999";
  price.value = Number.isFinite(line.unit_price) ? line.unit_price : "";
  price.addEventListener("input", () => {
    serviceLines[i].unit_price = price.value === "" ? NaN : Number(price.value);
    markLinesDirty();
    updateTotal();
  });
  make("Precio", price);
  const remove = document.createElement("button");
  remove.type = "button";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "icon");
  icon.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#icon-close");
  icon.append(use);
  remove.append(icon);
  remove.setAttribute("aria-label", "Quitar concepto");
  remove.addEventListener("click", () => {
    serviceLines.splice(i, 1);
    markLinesDirty();
    renderLines();
    const adjacent = $("items").children[Math.min(i, serviceLines.length - 1)];
    (adjacent?.querySelector("button") || $("addItem")).focus();
  });
  div.appendChild(remove);
  return div;
}
function renderLines() {
  const holder = $("items");
  holder.replaceChildren();
  serviceLines.forEach((line, i) => holder.append(lineElement(line, i)));
  $("linesState").textContent = serviceLines.length
    ? "Importes en MXN · hasta dos decimales"
    : "Aún sin conceptos. Agrega el primer trabajo o refacción.";
  updateTotal();
}
function updateTotal() {
  const total = totalCents(serviceLines) / 100;
  $("total").textContent = Number.isFinite(total)
    ? currency(total)
    : "Importes pendientes";
  $("total").classList.toggle("is-incomplete", !Number.isFinite(total));
}
$("addItem").addEventListener("click", () => {
  if (!linesLoaded || savingLines) return;
  markLinesDirty();
  serviceLines.push({
    kind: "mano_obra",
    description: "",
    quantity: 1,
    unit_price: 0,
  });
  showOrderFeedback("itemsMessage", "");
  renderLines();
  $("items").lastElementChild?.querySelector("input")?.focus();
});
$("saveItems").addEventListener("click", saveLines);
function markLinesDirty() {
  linesDirty = true;
  showOrderFeedback("itemsMessage", "");
  showOrderFeedback("pdfMessage", "");
  $("linesState").textContent = "Cambios sin guardar · importes en MXN";
}
function setLineControls(disabled) {
  document
    .querySelectorAll(
      ".document-panel--client button,.document-panel--client input,.document-panel--client select",
    )
    .forEach((control) => (control.disabled = disabled));
}
$("orderDialog").addEventListener("cancel", (event) => {
  if (
    savingLines ||
    documentBusy ||
    savingOrder ||
    (hasUnsavedOrderChanges() &&
      !confirm("Hay cambios sin guardar. ¿Cerrar y descartarlos?"))
  )
    event.preventDefault();
});
async function saveLines() {
  if (!selected || !linesLoaded || savingLines) return false;
  if (!serviceLines.length && !savedLines.length) {
    showOrderFeedback(
      "itemsMessage",
      "Agrega un trabajo o refacción antes de guardar o generar la nota.",
      true,
    );
    return false;
  }
  if (!validateLines(serviceLines)) {
    const invalid = Array.from($("items").querySelectorAll("input")).find(
      (input) =>
        !input.checkValidity() ||
        (input.type === "text" && input.value.trim().length < 2),
    );
    invalid?.focus();
    showOrderFeedback(
      "itemsMessage",
      "Completa la descripción (mínimo 2 letras), cantidad mayor que cero y precio válido. Usa como máximo dos decimales.",
      true,
    );
    return false;
  }
  if (!linesDirty) return true;
  showOrderFeedback("itemsMessage", "");
  savingLines = true;
  setLineControls(true);
  $("saveItems").textContent = "Guardando y verificando…";
  try {
    serviceLines = await persistLines(
      db,
      selected.id,
      serviceLines,
      savedLines,
    );
    savedLines = structuredClone(serviceLines);
    linesDirty = false;
    showOrderFeedback("pdfMessage", "");
    renderLines();
    showOrderFeedback(
      "itemsMessage",
      serviceLines.length
        ? "Desglose guardado y verificado. Total: " +
            currency(totalCents(serviceLines) / 100) +
            "."
        : "Desglose eliminado y verificado.",
    );
    return true;
  } catch (error) {
    // REST no es transaccional. Bloquear reintentos a ciegas tras un resultado parcial o incierto.
    linesLoaded = false;
    showOrderFeedback(
      "itemsMessage",
      saveError(error) +
        " Tus cambios siguen visibles; revísalos antes de cerrar. Es posible que algunos conceptos sí se hayan guardado.",
      true,
    );
    return false;
  } finally {
    savingLines = false;
    setLineControls(!linesLoaded);
    $("saveItems").textContent = "Guardar desglose de precios";
  }
}

function generateTicket() {
  if (!selected) return;
  const div = $("printReceipt");
  div.replaceChildren();
  const add = (tag, txt, cl = "") => {
    const el = document.createElement(tag);
    el.textContent = txt;
    if (cl) el.className = cl;
    div.append(el);
  };
  add("h1", "TORRE FUERTE");
  add("p", "TALLER DE MOTOCICLETAS · PUERTO ESCONDIDO", "center");
  add("hr", "");
  add("p", "COMANDA PARA LA MOTO", "center");
  add("p", "USO INTERNO · SIN PRECIOS", "center");
  add("p", "FOLIO: " + selected.folio);
  add(
    "p",
    "Registrada: " +
      new Date(selected.created_at).toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
      }),
  );
  add("hr", "");
  add("p", "CLIENTE: " + selected.client_name);
  add("p", "TELÉFONO: " + selected.client_phone);
  add(
    "p",
    "MOTO: " +
      selected.motorcycle +
      (selected.motorcycle_year ? " (" + selected.motorcycle_year + ")" : ""),
  );
  add("p", "SERVICIO: " + selected.service);
  add("p", "FECHA SOLICITADA: " + formatDate(selected.requested_date));
  add("p", "HORARIO SOLICITADO: " + selected.requested_slot);
  if (selected.details) add("p", "OBSERVACIONES: " + selected.details);
  add("hr", "");
  add("p", "ESTADO: " + (states[selected.status] || selected.status));
  add("p", "PARA SUJETAR A LA MOTO DURANTE EL SERVICIO", "center");
  add("p", "No es nota de cobro ni factura.", "center");
  if (selected.status === "pendiente")
    add("p", "Cita pendiente de confirmar.", "center");
}
$("printOrder").addEventListener("click", () => {
  if (!selected) return;
  generateTicket();
  showOrderFeedback(
    "printMessage",
    "Comanda preparada. Elige tu impresora en el diálogo del navegador; comprueba la impresión en la impresora.",
  );
  window.print();
});
let pdfLibrary;
async function ensurePdfLibrary() {
  if (window.pdfMake?.vfs) return;
  if (!pdfLibrary) {
    const load = (src) =>
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(
            Error(
              "No se pudo cargar la herramienta PDF. Revisa internet y reintenta.",
            ),
          );
        };
        document.head.append(script);
      });
    pdfLibrary = (async () => {
      if (!window.pdfMake)
        await load(
          "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js",
        );
      if (!window.pdfMake.vfs)
        await load(
          "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.min.js",
        );
    })().catch((error) => {
      pdfLibrary = null;
      throw error;
    });
  }
  await pdfLibrary;
}
async function buildPdfBlob() {
  if (!selected) throw new Error("Selecciona una orden.");
  await ensurePdfLibrary();
  const ok = await saveLines();
  if (!ok)
    throw new Error(
      "No se pudo verificar el desglose. Revisa el mensaje de guardado.",
    );
  if (!serviceLines.length)
    throw Error("La nota necesita al menos un concepto.");
  const body = [
    [
      { text: "Concepto", bold: true },
      { text: "Tipo", bold: true },
      { text: "Cant.", bold: true, alignment: "right" },
      { text: "P. unit.", bold: true, alignment: "right" },
      { text: "Subtotal", bold: true, alignment: "right" },
    ],
    ...serviceLines.map((item) => [
      item.description,
      item.kind === "refaccion" ? "Refacción" : "Mano de obra",
      { text: String(item.quantity), alignment: "right" },
      { text: currency(item.unit_price), alignment: "right" },
      {
        text: currency(lineTotal(item) / 100),
        alignment: "right",
      },
    ]),
  ];
  const total = totalCents(serviceLines) / 100;
  const doc = {
    pageSize: "A4",
    pageMargins: [36, 46, 36, 45],
    content: [
      { text: "TORRE FUERTE", bold: true, fontSize: 25, color: "#b52329" },
      {
        text: "Taller de motocicletas · Puerto Escondido, Oaxaca",
        fontSize: 10,
        color: "#646c74",
        margin: [0, 0, 0, 20],
      },
      {
        text: "NOTA DE SERVICIO  ·  " + selected.folio,
        bold: true,
        fontSize: 14,
        margin: [0, 0, 0, 16],
      },
      {
        text:
          "Cliente: " +
          selected.client_name +
          "\nTeléfono: " +
          selected.client_phone +
          "\nMotocicleta: " +
          selected.motorcycle +
          (selected.motorcycle_year ? " · " + selected.motorcycle_year : "") +
          "\nServicio solicitado: " +
          selected.service +
          "\nFecha solicitada: " +
          formatDate(selected.requested_date) +
          " · " +
          selected.requested_slot,
        margin: [0, 0, 0, 17],
      },
      {
        text: "DESGLOSE DE TRABAJOS Y REFACCIONES",
        bold: true,
        fontSize: 10,
        margin: [0, 0, 0, 7],
      },
      {
        table: { headerRows: 1, widths: ["*", "auto", 38, 66, 74], body },
        layout: {
          fillColor: (row) => (row === 0 ? "#f0f2f3" : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#d9dfe3",
          paddingTop: () => 10,
          paddingBottom: () => 10,
        },
      },
      {
        text: "TOTAL: " + currency(total),
        alignment: "right",
        bold: true,
        fontSize: 16,
        margin: [0, 18, 0, 18],
      },
      {
        text:
          "Solicitud del cliente: " + (selected.details || "Sin observaciones"),
        fontSize: 10,
      },
      {
        text: "Documento informativo de servicio. No sustituye una factura fiscal.",
        fontSize: 9,
        color: "#626b72",
        margin: [0, 30, 0, 0],
      },
    ],
    defaultStyle: { fontSize: 10 },
  };
  return await new Promise((resolve, reject) => {
    try {
      window.pdfMake.createPdf(doc).getBlob((blob) => resolve(blob));
    } catch (err) {
      reject(err);
    }
  });
}
$("pdfDownload").addEventListener("click", async () => {
  if (documentBusy) return;
  documentBusy = true;
  showOrderFeedback("pdfMessage", "Preparando la nota…");
  try {
    const blob = await buildPdfBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selected.folio + "-nota-servicio.pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    showOrderFeedback(
      "pdfMessage",
      "Nota PDF preparada con precios y total. Se inició la descarga; revisa Descargas en tu navegador.",
    );
    message("Nota PDF generada.");
  } catch (err) {
    showOrderFeedback(
      "pdfMessage",
      "No se pudo crear la nota PDF. " +
        (err?.message || "Revisa los conceptos y vuelve a intentar."),
      true,
    );
    message(err?.message || "No se pudo crear el PDF.", true);
  } finally {
    documentBusy = false;
  }
});
$("pdfShare").addEventListener("click", async () => {
  if (documentBusy) return;
  documentBusy = true;
  showOrderFeedback("pdfMessage", "Preparando la nota…");
  try {
    const blob = await buildPdfBlob();
    const file = new File([blob], selected.folio + "-nota-servicio.pdf", {
      type: "application/pdf",
    });
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({
        files: [file],
        title: "Torre Fuerte · " + selected.folio,
        text: "Nota de servicio " + selected.folio,
      });
      showOrderFeedback(
        "pdfMessage",
        "El menú del teléfono recibió la nota. Confirma el envío en la app que elegiste.",
      );
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      showOrderFeedback(
        "pdfMessage",
        "Se inició la descarga de la nota. Adjúntala al chat del cliente en WhatsApp.",
      );
      message(
        "Descarga de PDF iniciada. Adjúntalo en WhatsApp cuando esté disponible.",
      );
    }
  } catch (err) {
    if (err?.name === "AbortError") {
      showOrderFeedback(
        "pdfMessage",
        "Se canceló compartir. La nota sigue disponible para descargar.",
      );
    } else {
      showOrderFeedback(
        "pdfMessage",
        "No fue posible compartir la nota. Prueba «Descargar nota PDF para el cliente».",
        true,
      );
      message("No fue posible compartir el PDF; prueba Descargar PDF.", true);
    }
  } finally {
    documentBusy = false;
  }
});
