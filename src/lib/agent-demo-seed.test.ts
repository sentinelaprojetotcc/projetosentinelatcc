import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";

const counts: Record<string,number> = {
  users:16, occurrences:280, predictions:28, recommendations:42,
  patrols:56, ai_decisions:42, notifications:42
};
const schema = [
"PRAGMA foreign_keys = ON;",
"CREATE TABLE users (",
"id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('citizen','institutional')),",
"name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,",
"password_hash TEXT NOT NULL, cpf TEXT UNIQUE,",
"birth_date TEXT, phone TEXT, postal_code TEXT,",
"state TEXT NOT NULL DEFAULT 'BA', city TEXT NOT NULL DEFAULT 'Salvador',",
"neighborhood TEXT, address TEXT, institution TEXT, functional_id TEXT UNIQUE,",
"created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, latitude REAL, longitude REAL,",
"location_consent INTEGER NOT NULL DEFAULT 0, institutional_type TEXT);",
].join(" ");
const common = [
"id TEXT PRIMARY KEY, title TEXT NOT NULL, region TEXT NOT NULL DEFAULT 'Salvador',",
"event_date TEXT NOT NULL, event_time TEXT NOT NULL DEFAULT '',",
"source TEXT NOT NULL DEFAULT 'Institucional',",
"status TEXT NOT NULL DEFAULT 'Pendente',",
"confidence INTEGER NOT NULL DEFAULT 0 CHECK(confidence BETWEEN 0 AND 100),",
"details TEXT NOT NULL DEFAULT '',",
"created_by TEXT NOT NULL REFERENCES users(id),",
"created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,",
"updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"
].join(" ");
const extras: Record<string,string> = {
  occurrences: ", priority TEXT NOT NULL DEFAULT 'Normal', evidence_name TEXT, evidence_type TEXT, evidence_data TEXT, contact_authorized INTEGER NOT NULL DEFAULT 0, anonymous INTEGER NOT NULL DEFAULT 0, latitude REAL, longitude REAL, city TEXT, state TEXT",
  patrols: ", result TEXT, recommendation_followed INTEGER NOT NULL DEFAULT 0"
};
const seed = readFileSync("migrations/demo/seed_agentes_2026.sql","utf8");
const undo = readFileSync("migrations/demo/rollback_agentes_2026.sql","utf8");
test("carga Agente 2026: FKs, categorias, datas, confiança e rollback", () => {
 const db = new Database(":memory:");
 try {
  db.exec(schema);
  for(const table of Object.keys(counts).filter(t=>t!=="users"))db.exec("CREATE TABLE " + table + " (" + common + (extras[table]??"") + ");");
  db.query("INSERT INTO users(id,role,name,email,password_hash) VALUES(?,?,?,?,?)")
   .run("usuario-antigo", "citizen", "Usuário existente", "pessoa-anterior@example.com", "hash-do-usuario");
  db.query("INSERT INTO occurrences(id,title,region,event_date,source,status,confidence,details,created_by) VALUES(?,?,?,?,?,?,?,?,?)")
   .run("ocorrencia-antiga","Furto","Salvador","2026-10-01","População","Em análise",0,"Registro anterior.", "usuario-antigo");
  db.exec(seed);
  for(const [table,expected] of Object.entries(counts)) {
   const row=db.query("SELECT COUNT(*) AS total FROM " + table).get() as {total:number};
   expect(row.total).toBe(expected+(["users","occurrences"].includes(table)?1:0));
  }
  for(const [name,total] of Object.entries({Furto:40,Roubo:40,"Violência":40,Dano:40,"Ameaça":40,Acidente:40,Outros:40})) {
   const row=db.query("SELECT COUNT(*) AS total FROM occurrences WHERE title = ? AND source = 'Registro policial (treinamento)'").get(name) as {total:number};
   expect(row.total).toBe(total);
  }
  for(const [min,max] of [[12,42],[48,73],[78,98]]) {
   const row=db.query("SELECT COUNT(*) AS total FROM occurrences WHERE confidence BETWEEN ? AND ? AND source='Registro policial (treinamento)'").get(min,max) as {total:number};
   expect(row.total).toBeGreaterThan(0);
  }
  const priorities = db.query("SELECT DISTINCT priority FROM occurrences WHERE source = 'Registro policial (treinamento)'").all() as Array<{priority:string}>;
  expect(priorities.map(x=>x.priority).sort()).toEqual(["Normal","Urgente"]);
  const authors = db.query("SELECT COUNT(*) AS total FROM users WHERE email LIKE 'agente-tcc-%@sentinela.example.invalid' AND role='institutional' AND institutional_type='agent' AND cpf IS NULL AND password_hash='!CONTA_DESATIVADA_TCC_SEM_LOGIN'").get() as {total:number};
  expect(authors.total).toBe(16);
  for(const table of Object.keys(counts).filter(t=>t!=="users")) {
    const invalidDate = db.query("SELECT COUNT(*) AS total FROM " + table + " WHERE event_date < '2026-01-01' OR event_date > '2026-11-25'").get() as {total:number};
    expect(invalidDate.total).toBe(0);
    const orphan = db.query("SELECT COUNT(*) AS total FROM " + table + " WHERE created_by NOT IN (SELECT id FROM users)").get() as {total:number};
    expect(orphan.total).toBe(0);
    const malformed = db.query("SELECT COUNT(*) AS total FROM " + table + " WHERE created_by IN (SELECT id FROM users WHERE email LIKE 'agente-tcc-%@sentinela.example.invalid') AND (details = '' OR title LIKE '%[DEMO]%' OR details LIKE '%[DEMO]%')").get() as {total:number};
    expect(malformed.total).toBe(0);
  }
  expect(db.query("PRAGMA foreign_key_check").all()).toEqual([]);
  db.exec(seed);
  for(const [table,expected] of Object.entries(counts)) {
   const row=db.query("SELECT COUNT(*) AS total FROM " + table).get() as {total:number};
   expect(row.total).toBe(expected+(["users","occurrences"].includes(table)?1:0));
  }
  db.exec(undo);
  for(const table of Object.keys(counts)) {
   const row=db.query("SELECT COUNT(*) AS total FROM " + table).get() as {total:number};
   expect(row.total).toBe(["users","occurrences"].includes(table)?1:0);
  }
  expect(db.query("SELECT name,email,password_hash FROM users WHERE id='usuario-antigo'").get()).toEqual({name:"Usuário existente",email:"pessoa-anterior@example.com",password_hash:"hash-do-usuario"});
  expect(db.query("SELECT details FROM occurrences WHERE id='ocorrencia-antiga'").get()).toEqual({details:"Registro anterior."});
  expect(db.query("PRAGMA foreign_key_check").all()).toEqual([]);
 } finally { db.close(); }
});
