// Solo pruebas: ninguna petición se envía a Supabase.
export function createClient() {
  const state = window.__tfTest;
  const clone = (x) => structuredClone(x);
  return {
    auth: {
      getUser: async () => ({
        data: { user: state.authorized ? { id: "test-staff" } : null },
      }),
      setSession: async () => {
        state.authorized = true;
        return {};
      },
      signOut: async () => {
        state.authorized = false;
        return {};
      },
      updateUser: async () => ({}),
    },
    from(table) {
      let op = "select",
        payload,
        filters = [],
        single = false,
        columns = "*";
      const q = {
        select(c = "*") {
          columns = c;
          return q;
        },
        order() {
          return q;
        },
        limit() {
          return q;
        },
        eq(k, v) {
          filters.push((r) => r[k] === v);
          return q;
        },
        in(k, v) {
          filters.push((r) => v.includes(r[k]));
          return q;
        },
        maybeSingle() {
          single = true;
          return q;
        },
        single() {
          single = true;
          return q;
        },
        insert(p) {
          op = "insert";
          payload = p;
          return q;
        },
        update(p) {
          op = "update";
          payload = p;
          return q;
        },
        delete() {
          op = "delete";
          return q;
        },
        then(resolve, reject) {
          return Promise.resolve()
            .then(async () => {
              if (state.delay)
                await new Promise((r) => setTimeout(r, state.delay));
              state.calls.push({ table, op });
              if (state.fail === table + ":" + op)
                return {
                  data: null,
                  error: {
                    code: state.errorCode || "42501",
                    message: "Fixture failure",
                  },
                };
              if (table === "tf_staff")
                return {
                  data: single
                    ? { user_id: "test-staff" }
                    : [{ user_id: "test-staff" }],
                  error: null,
                };
              const rows = state[table];
              let matches = rows.filter((r) => filters.every((f) => f(r)));
              if (op === "insert") {
                const row = {
                  id: "test-" + ++state.seq,
                  folio: "TF-TEST-" + state.seq,
                  created_at: new Date().toISOString(),
                  ...clone(payload),
                };
                rows.push(row);
                matches = [row];
              }
              if (op === "update")
                matches.forEach((r) => Object.assign(r, clone(payload)));
              if (op === "delete") {
                state[table] = rows.filter((r) => !matches.includes(r));
              }
              if (state.zeroRows && op !== "select") matches = [];
              const result = clone(matches);
              return {
                data: single ? result[0] || null : result,
                error: single && !result.length ? { code: "PGRST116" } : null,
              };
            })
            .then(resolve, reject);
        },
      };
      return q;
    },
  };
}
