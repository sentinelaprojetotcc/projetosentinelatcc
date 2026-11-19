import "@tanstack/react-start/server-only";
import { env } from "cloudflare:workers";

/**
 * Adaptador D1. Consultas são assíncronas e executadas apenas no servidor.
 * A estrutura e os dados são migrados com Wrangler antes da implantação.
 */
type SqlParam = string | number | boolean | null | ArrayBuffer;

function statement(sql: string, values: SqlParam[]) {
  const prepared = env.DB.prepare(sql);
  return values.length ? prepared.bind(...values) : prepared;
}

export const db = {
  prepare(sql: string) {
    return {
      async get(...values: SqlParam[]) {
        return statement(sql, values).first();
      },
      async all(...values: SqlParam[]) {
        const result = await statement(sql, values).all();
        return result.results;
      },
      async run(...values: SqlParam[]) {
        return statement(sql, values).run();
      },
    };
  },
};
