import "@tanstack/react-start/server-only";
import { env } from "cloudflare:workers";

/**
 * Thin compatibility layer around Cloudflare D1.
 * Calls to get/all/run are async: callers must await each operation.
 *
 * Schema migrations and data imports are performed with Wrangler, never
 * automatically on request (which would be unsafe and inefficient).
 */
type SqlParam = string | number | boolean | null | ArrayBuffer;

export const db = {
  prepare(sql: string) {
    return {
      async get(...values: SqlParam[]) {
        return env.DB.prepare(sql).bind(...values).first();
      },
      async all(...values: SqlParam[]) {
        const result = await env.DB.prepare(sql).bind(...values).all();
        return result.results;
      },
      async run(...values: SqlParam[]) {
        return env.DB.prepare(sql).bind(...values).run();
      },
    };
  },
};
