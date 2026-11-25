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
    // Cenário realista: já existe um cidadão com CPF idêntico ao antigo CPF
    // sintético. Nenhum INSERT OR IGNORE deve ocultar conflitos no cadastro.
    const existingId = "cidadão-ja-cadastrado";
    db.query("INSERT INTO users (id, role, name, email, password_hash, cpf) VALUES (?, ?, ?, ?, ?, ?)")
      .run(existingId, "citizen", "Cadastro anterior ao demo", "antes-do-demo@example.invalid", "hash-preexistente", "00000000001");
    const seed = readFileSync("migrations/demo/seed_2026_11_25.sql", "utf8");
    const rollback = readFileSync("migrations/demo/rollback_2026_11_25.sql", "utf8");
    db.exec(seed);
    for (const [table, expected] of Object.entries(counts)) {
      const first = db.query(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number };
      expect(first.total).toBe(expected + (table === "users" ? 1 : 0));
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
    const invalidAccounts = db.query("SELECT COUNT(*) AS total FROM users WHERE name LIKE '%(DEMO)' AND (email NOT LIKE '%@sentinela.example.invalid' OR cpf IS NOT NULL)").get() as { total: number };
    expect(invalidAccounts.total).toBe(0);
    const missingMarkers = db.query("SELECT COUNT(*) AS total FROM occurrences WHERE details NOT LIKE '[DEMO-SENTINELA-2026]%'").get() as { total: number };
    expect(missingMarkers.total).toBe(0);

    db.exec(seed); // reexecução não duplica nenhum registro
    for (const [table, expected] of Object.entries(counts)) {
      const r = db.query(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number };
      expect(r.total).toBe(expected + (table === "users" ? 1 : 0));
    }
    db.exec(rollback);
    for (const table of Object.keys(counts)) {
      const r = db.query(`SELECT COUNT(*) AS total FROM ${table}`).get() as { total: number };
      expect(r.total).toBe(table === "users" ? 1 : 0);
    }
    const existing = db.query("SELECT email, cpf FROM users WHERE id = ?").get(existingId) as {email:string;cpf:string} | undefined;
    expect(existing?.cpf).toBe("00000000001");
    expect(existing?.email).toBe("antes-do-demo@example.invalid");
  } finally {
    db.close();
  }
});


// A apresentação deve mostrar apenas a narrativa de cada caso; o aviso de
// demonstração é exibido fora da descrição e depende das contas .invalid.
test("normaliza descrições de 678 casos sem alterar dados reais nem perder revisão", () => {
  const db = new Database(":memory:");
  try {
    db.exec(schema);
    for (const table of Object.keys(counts).filter((name) => name !== "users")) {
      db.exec(`CREATE TABLE ${table} (${baseFields}${extras[table] ?? ""});`);
    }
    const existingId = "real-existing-account";
    db.query("INSERT INTO users (id, role, name, email, password_hash) VALUES (?, ?, ?, ?, ?)")
      .run(existingId, "citizen", "Registro anterior", "previous-account@example.invalid", "no-login");
    db.query("INSERT INTO occurrences (id, title, region, event_date, event_time, source, status, confidence, details, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("existing-occurrence", "Outro", "Campinas", "2026-10-01", "09:00", "População", "Em análise", 0, "Descrição anterior preservada.", existingId);

    db.exec(readFileSync("migrations/demo/seed_2026_11_25.sql", "utf8"));
    const tables = Object.keys(counts).filter((name) => name !== "users");
    for (const table of tables) {
      db.exec(`UPDATE ${table} SET title = TRIM(REPLACE(title, '[DEMO]', '')), details = TRIM(REPLACE(details, '[DEMO-SENTINELA-2026]', ''));`);
    }
    const oldTexts = new Map<string, string>();
    for (const table of tables) {
      const entries = db.query(`SELECT id, details FROM ${table} WHERE id != 'existing-occurrence'`).all() as Array<{id:string;details:string}>;
      for (const item of entries) oldTexts.set(`${table}:${item.id}`, item.details);
    }
    expect(oldTexts.size).toBe(678);
    const normalizeSql = readFileSync("migrations/demo/normalize_descriptions_2026_11_25.sql", "utf8");
    const restoreSql = readFileSync("migrations/demo/restore_descriptions_2026_11_25.sql", "utf8");

    db.exec(normalizeSql);
    let changed = 0;
    const normalizedTexts = new Map<string, string>();
    const forbidden = /(?:\[DEMO\]|\[DEMO-SENTINELA-2026\]|cenário inteiramente fictício|teste acadêmico|confiabilidade simulada|valor aleatório|boletim de ocorrência ou fato confirmado)/i;
    for (const table of tables) {
      const entries = db.query(`SELECT id, details FROM ${table} WHERE id != 'existing-occurrence'`).all() as Array<{id:string;details:string}>;
      for (const item of entries) {
        const key = `${table}:${item.id}`;
        if (oldTexts.get(key) !== item.details) changed++;
        expect(item.details.length).toBeGreaterThan(45);
        expect(forbidden.test(item.details)).toBe(false);
        normalizedTexts.set(key,item.details);
      }
    }
    expect(changed).toBe(678);
    const example = db.query("SELECT details FROM occurrences WHERE title='Roubo' AND details LIKE '%carteira%' LIMIT 1").get() as {details:string} | null;
    expect(example?.details).toContain("carteira");
    const completed = db.query("SELECT details FROM contests WHERE status='Revisão concluída'").all() as Array<{details:string}>;
    expect(completed.length).toBeGreaterThan(0);
    expect(completed.every((row) => row.details.includes("\n\nDecisão humana:"))).toBe(true);
    const ai = db.query("SELECT details FROM ai_decisions").all() as Array<{details:string}>;
    expect(ai.every(row => row.details.startsWith("Resultado da IA:"))).toBe(true);
    const untouched = db.query("SELECT details FROM occurrences WHERE id='existing-occurrence'").get() as {details:string};
    expect(untouched.details).toBe("Descrição anterior preservada.");

    db.exec(normalizeSql);
    for (const table of tables) {
      const entries = db.query(`SELECT id, details FROM ${table} WHERE id != 'existing-occurrence'`).all() as Array<{id:string;details:string}>;
      for (const item of entries) expect(item.details).toBe(normalizedTexts.get(`${table}:${item.id}`));
    }
    db.exec(restoreSql);
    for (const table of tables) {
      const entries = db.query(`SELECT id, details FROM ${table} WHERE id != 'existing-occurrence'`).all() as Array<{id:string;details:string}>;
      for (const item of entries) expect(item.details).toBe(oldTexts.get(`${table}:${item.id}`));
    }
    expect((db.query("SELECT details FROM occurrences WHERE id='existing-occurrence'").get() as {details:string}).details)
      .toBe("Descrição anterior preservada.");
  } finally { db.close(); }
});


test("rótulos de apresentação: sem DEMO visível, mantendo integridade e origem sintética", () => {
  const db = new Database(":memory:");
  try {
    db.exec(schema);
    for (const table of Object.keys(counts).filter(name => name !== "users")) {
      db.exec(`CREATE TABLE ${table} (${baseFields}${extras[table] ?? ""});`);
    }
    db.query("INSERT INTO users (id, role, name, email, password_hash) VALUES (?, ?, ?, ?, ?)")
      .run("usuario-preexistente", "citizen", "Nome preexistente", "usuario-real@example.com", "hash-original");
    db.query("INSERT INTO occurrences (id,title,region,event_date,event_time,source,status,confidence,details,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)")
      .run("caso-preexistente", "Furto", "Recife", "2026-10-05", "10:00", "População", "Recebida", 51, "Registro preexistente.", "usuario-preexistente");

    db.exec(readFileSync("migrations/demo/seed_2026_11_25.sql", "utf8"));
    const tables = Object.keys(counts).filter(name => name !== "users");
    for (const table of tables) {
      db.exec(`UPDATE ${table} SET title = TRIM(REPLACE(title, '[DEMO]', '')),
        details = TRIM(REPLACE(details, '[DEMO-SENTINELA-2026]', ''));`);
    }
    db.exec(readFileSync("migrations/demo/normalize_descriptions_2026_11_25.sql", "utf8"));
    const before = db.query("SELECT COUNT(*) AS n FROM occurrences").get() as { n:number };
    const apply = readFileSync("migrations/demo/limpar_rotulos_apresentacao_2026_11_25.sql", "utf8");
    db.exec(apply);
    db.exec(apply);

    const origin = db.query("SELECT COUNT(*) AS n FROM users WHERE email LIKE '%@sentinela.example.invalid'").get() as {n:number};
    expect(origin.n).toBe(48);
    const personLabels = db.query(`SELECT COUNT(*) AS n FROM users WHERE
      email LIKE '%@sentinela.example.invalid' AND
      (name LIKE '%DEMO%' OR email LIKE '%demo%' OR
       COALESCE(institution, '') LIKE '%DEMO%' OR
       COALESCE(functional_id, '') LIKE '%DEMO%' OR
       password_hash LIKE '%DEMO%')`).get() as {n:number};
    expect(personLabels.n).toBe(0);

    for (const table of tables) {
      const result = db.query(`SELECT COUNT(*) AS n FROM ${table} WHERE created_by IN (
        SELECT id FROM users WHERE email LIKE '%@sentinela.example.invalid'
      ) AND (title LIKE '%DEMO%' OR source LIKE '%Modelo acadêmico fictício%'
        OR details LIKE '%DEMO%' OR title LIKE '%Modelo acadêmico fictício%'
        OR details LIKE '%Modelo acadêmico fictício%')`).get() as {n:number};
      expect(result.n).toBe(0);
      const n = db.query(`SELECT COUNT(*) AS total FROM ${table}`).get() as {total:number};
      expect(n.total).toBe(counts[table] + (table === "occurrences" ? 1 : 0));
    }
    const pred = db.query("SELECT DISTINCT source FROM predictions WHERE created_by IN (SELECT id FROM users WHERE email LIKE '%@sentinela.example.invalid')").all() as Array<{source:string}>;
    expect(pred).toEqual([{ source: "Análise experimental" }]);
    const existing = db.query("SELECT name, email, password_hash FROM users WHERE id = 'usuario-preexistente'").get();
    expect(existing).toEqual({name:"Nome preexistente",email:"usuario-real@example.com",password_hash:"hash-original"});
    const record = db.query("SELECT details, source FROM occurrences WHERE id = 'caso-preexistente'").get();
    expect(record).toEqual({details:"Registro preexistente.",source:"População"});
    expect(db.query("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(before.n).toBe(281);
  } finally { db.close(); }
});
