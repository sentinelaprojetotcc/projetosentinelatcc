/// <reference types="@cloudflare/workers-types" />
// Gere a definição correta para o binding DB com: bun run cf-typegen
interface Env {
  DB: D1Database;
}
