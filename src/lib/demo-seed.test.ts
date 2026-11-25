import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { test, expect } from "bun:test";

const schema = `
PRAGMA foreign_keys = ON;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('citizen','institutional')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  cpf TEXT UNIQUE,
  birth_date TEXT, phone TEXT, postal_code TEXT,
  state TEXT NOT NULL DEFAULT 'BA', city TEXT NOT NULL DEFAULT 'Salvador',
  neighborhood TEXT, address TEXT, institution TEXT,
  functional_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  latitude REAL, longitude REAL,
  location_consent INTEGER NOT NULL DEFAULT 0, institutional_type TEXT
);
`;

// Replica as colunas e restrições do esquema SQLite original importado ao D1,
// sem acessar nenhum dado pessoal nem banco remoto.
const baseFields = `
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'Salvador',
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Institucional',
  status TEXT NOT NULL DEFAULT 'Pendente',
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  details TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
`;

const extras: Record<string, string> = {
  occurrences: ", priority TEXT NOT NULL DEFAULT 'Normal', evidence_name TEXT, evidence_type TEXT, evidence_data TEXT, contact_authorized INTEGER NOT NULL DEFAULT 0, anonymous INTEGER NOT NULL DEFAULT 0, latitude REAL, longitude REAL, city TEXT, state TEXT",
  contests: ", evidence_name TEXT, evidence_type TEXT, evidence_data TEXT",
  patrols: ", result TEXT, recommendation_followed INTEGER NOT NULL DEFAULT 0",
};
const counts: Record<string, number> = {
  users: 48,
  occurrences: 280,
  predictions: 84,
  recommendations: 42,
  patrols: 36,
  ai_decisions: 28,
  bias_alerts: 24,
  contests: 42,
  notifications: 56,
  audits: 24,
  reports: 16,
  mitigations: 16,
  models: 12,
  data_quality: 18,
};

test("dados fictícios 2026: sintaxe, integridade, idempotência e reversão", () => {
  const db = new Database(":memory:");
  try {
    db.exec(schema);
    for (const table of Object.keys(counts).filter((name) => name !== "users")) {
      db.exec(`CREATE TABLE ${table} (${baseFields}${extras[table] ?? ""});`);
    }
    const seed = readFileSync("migrations/demo/seed_2026_11_25.sql", "utf8");
    const rollback = readFileSync("migrations/demo/rollback_2026_11_25.sql", "utf8");
    db.exec(seed);
    for (const [table, expected] of Object.entries(counts)) {
      const first = db.query(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number };
      expect(first.total).toBe(expected);
    }

    const invalidDates = db.query(`
      SELECT COUNT(*) AS total FROM occurrences
      WHERE event_date < '2026-01-01' OR event_date > '2026-11-25'
    `).get() as { total: number };
    expect(invalidDates.total).toBe(0);
    for (const category of ["Furto","Roubo","Violência","Dano","Ameaça","Acidente","Outros"]) {
      const n = db.query("SELECT COUNT(*) AS total FROM occurrences WHERE title = ?").get(category) as { total: number };
      expect(n.total).toBe(40);
    }
    for (const [min, max] of [[12,42],[48,73],[78,98]]) {
      const n = db.query("SELECT COUNT(*) AS total FROM occurrences WHERE confidence BETWEEN ? AND ?").get(min,max) as { total: number };
      expect(n.total).toBeGreaterThan(0);
    }
    const invalidAccounts = db.query("SELECT COUNT(*) AS total FROM users WHERE email NOT LIKE '%@sentinela.example.invalid' OR name NOT LIKE '%(DEMO)'").get() as { total: number };
    expect(invalidAccounts.total).toBe(0);
    const missingMarkers = db.query("SELECT COUNT(*) AS total FROM occurrences WHERE details NOT LIKE '[DEMO-SENTINELA-2026]%'").get() as { total: number };
    expect(missingMarkers.total).toBe(0);

    db.exec(seed); // reexecução não duplica nenhum registro
    for (const [table, expected] of Object.entries(counts)) {
      const r = db.query(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number };
      expect(r.total).toBe(expected);
    }
    db.exec(rollback);
    for (const table of Object.keys(counts)) {
      const r = db.query(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number };
      expect(r.total).toBe(0);
    }
  } finally {
    db.close();
  }
});
