// Persistencia sujeta a las políticas RLS del servidor. Nunca simular un guardado.
export const lineTotal = (line) =>
  Math.round(
    (Math.round(Number(line.quantity) * 100) *
      Math.round(Number(line.unit_price) * 100)) /
      100,
  );
export const totalCents = (lines) =>
  lines.reduce((total, line) => total + lineTotal(line), 0);
const canonical = (lines) =>
  JSON.stringify(
    lines
      .map(({ id, kind, description, quantity, unit_price }) => ({
        id,
        kind,
        description: description.trim(),
        quantity: Number(quantity),
        unit_price: Number(unit_price),
      }))
      .sort((a, b) => String(a.id).localeCompare(String(b.id))),
  );
export function validateLines(lines) {
  return lines.every(
    (line) =>
      ["mano_obra", "refaccion"].includes(line.kind) &&
      typeof line.description === "string" &&
      line.description.trim().length >= 2 &&
      line.description.length <= 200 &&
      Number.isFinite(line.quantity) &&
      line.quantity > 0 &&
      line.quantity <= 999999 &&
      Number.isFinite(line.unit_price) &&
      line.unit_price >= 0 &&
      line.unit_price <= 99999999 &&
      Number.isSafeInteger(
        Math.round(line.quantity * 100) * Math.round(line.unit_price * 100),
      ) &&
      Math.abs(line.quantity * 100 - Math.round(line.quantity * 100)) <
        0.000001 &&
      Math.abs(line.unit_price * 100 - Math.round(line.unit_price * 100)) <
        0.000001,
  );
}
export async function readLines(db, requestId) {
  const { data, error } = await db
    .from("tf_service_lines")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at");
  if (error) throw error;
  return (data || []).map((line) => ({
    ...line,
    quantity: Number(line.quantity),
    unit_price: Number(line.unit_price),
  }));
}
export async function persistLines(db, requestId, lines, baseline) {
  if (!validateLines(lines))
    throw Error(
      "Revisa descripción, cantidad y precio (máximo dos decimales).",
    );
  const existing = await readLines(db, requestId);
  if (canonical(existing) !== canonical(baseline))
    throw Error(
      "El desglose cambió en otra sesión. Cierra y vuelve a abrir la orden antes de guardar.",
    );
  // Escribir antes de eliminar: un fallo de inserción no debe borrar conceptos existentes.
  for (const line of lines) {
    const payload = {
      request_id: requestId,
      kind: line.kind,
      description: line.description.trim(),
      quantity: line.quantity,
      unit_price: line.unit_price,
    };
    const result = line.id
      ? await db
          .from("tf_service_lines")
          .update(payload)
          .eq("id", line.id)
          .eq("request_id", requestId)
          .select("id")
          .single()
      : await db.from("tf_service_lines").insert(payload).select("id").single();
    if (result.error) throw result.error;
    if (!result.data?.id)
      throw Error(
        "El servidor no confirmó el concepto. Revisa los permisos del taller.",
      );
    line.id = result.data.id;
    line.description = payload.description;
  }
  const ids = new Set(lines.map((line) => line.id));
  const removed = existing.map((line) => line.id).filter((id) => !ids.has(id));
  if (removed.length) {
    const { data, error } = await db
      .from("tf_service_lines")
      .delete()
      .in("id", removed)
      .eq("request_id", requestId)
      .select("id");
    if (error) throw error;
    if (data?.length !== removed.length)
      throw Error(
        "No se confirmó la eliminación. Revisa los permisos del taller.",
      );
  }
  const saved = await readLines(db, requestId);
  if (canonical(saved) !== canonical(lines))
    throw Error(
      "El servidor devolvió un desglose distinto. Vuelve a abrir la orden para revisarlo.",
    );
  return saved;
}
export function saveError(error) {
  if (error?.code === "42501")
    return "Tu sesión no tiene permiso para guardar conceptos. Vuelve a entrar; si continúa, revisa las políticas RLS de tf_service_lines.";
  if (["42P01", "PGRST205"].includes(error?.code))
    return "Falta la tabla de conceptos en la base de datos. El administrador debe revisar tf_service_lines.";
  if (["23514", "22P02", "23502"].includes(error?.code))
    return "La base de datos rechazó un concepto. Revisa tipo, descripción, cantidad y precio.";
  if (
    error instanceof Error &&
    error.message &&
    !/fetch|network/i.test(error.message)
  )
    return error.message;
  return "No se pudo verificar el guardado. Revisa la conexión y vuelve a abrir la orden antes de reintentar.";
}
