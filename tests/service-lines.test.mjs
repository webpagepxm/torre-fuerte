import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "./fixtures/supabase.mjs";
import {
  persistLines,
  validateLines,
  totalCents,
} from "../operacion/service-lines.mjs";
const line = {
  id: "old",
  request_id: "order",
  kind: "mano_obra",
  description: "Revisión",
  quantity: 1,
  unit_price: 100,
};
function db(lines = []) {
  globalThis.window = {
    __tfTest: { seq: 0, calls: [], tf_service_lines: structuredClone(lines) },
  };
  return createClient();
}
test("importes en centavos y entradas inválidas", () => {
  assert.equal(totalCents([{ quantity: 0.1, unit_price: 2.55 }]), 26);
  assert.equal(
    totalCents([
      { quantity: 3, unit_price: 0.1 },
      { quantity: 1, unit_price: 0.2 },
    ]),
    50,
  );
  for (const invalid of [
    { quantity: NaN },
    { quantity: -1 },
    { quantity: 1.001 },
    { unit_price: Infinity },
    { unit_price: -1 },
    { kind: "desconocido" },
    { description: "" },
  ])
    assert.equal(validateLines([{ ...line, ...invalid }]), false);
});
test("crear, actualizar y eliminar con lectura verificada", async () => {
  const client = db([line]);
  const next = [
    { ...line, unit_price: 150 },
    { kind: "refaccion", description: "Bujía", quantity: 1, unit_price: 50 },
  ];
  const result = await persistLines(client, "order", next, [line]);
  assert.equal(result.length, 2);
  assert.equal(totalCents(result), 20000);
  assert.deepEqual(await persistLines(client, "order", [], result), []);
});
test("inserción fallida no elimina los conceptos previos", async () => {
  const client = db([line]);
  window.__tfTest.fail = "tf_service_lines:insert";
  await assert.rejects(
    persistLines(
      client,
      "order",
      [
        {
          kind: "refaccion",
          description: "Bujía",
          quantity: 1,
          unit_price: 50,
        },
      ],
      [line],
    ),
  );
  assert.equal(window.__tfTest.tf_service_lines.length, 1);
  assert(!window.__tfTest.calls.some((c) => c.op === "delete"));
});
test("RLS que no devuelve filas no se considera éxito de eliminación", async () => {
  const client = db([line]);
  window.__tfTest.zeroRows = true;
  await assert.rejects(
    persistLines(client, "order", [], [line]),
    /No se confirmó/,
  );
});
test("conflicto entre sesiones rechaza sobrescritura", async () => {
  const client = db([{ ...line, unit_price: 200 }]);
  await assert.rejects(
    persistLines(client, "order", [{ ...line, unit_price: 150 }], [line]),
    /otra sesión/,
  );
  assert(!window.__tfTest.calls.some((c) => c.op === "update"));
});
test("respuesta parcial bloquea éxito y conserva id de inserción confirmado", async () => {
  const client = db();
  const draft = [
    { kind: "mano_obra", description: "Ajuste", quantity: 1, unit_price: 50 },
  ];
  const original = client.from;
  let reads = 0;
  client.from = (table) => {
    const query = original(table),
      select = query.select;
    query.select = (columns) => {
      if (columns === "*" && ++reads === 2)
        window.__tfTest.fail = "tf_service_lines:select";
      return select(columns);
    };
    return query;
  };
  await assert.rejects(persistLines(client, "order", draft, []));
  assert(draft[0].id);
  assert.equal(window.__tfTest.tf_service_lines.length, 1);
});
