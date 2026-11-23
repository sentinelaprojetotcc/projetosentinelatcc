-- Aplicar somente depois de criar e vincular um bucket privado R2 AGENT_DOCUMENTS.
-- Não concede acesso a /org e não altera a tabela users existente.
CREATE TABLE IF NOT EXISTS agent_applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  institution TEXT NOT NULL CHECK (institution IN (
    'Polícia Militar (PM)', 'Polícia Civil (PC)',
    'Guarda Municipal (GM)', 'Polícia Penal'
  )),
  password_hash TEXT NOT NULL,
  document_key TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_size INTEGER NOT NULL CHECK (document_size BETWEEN 1 AND 10485760),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewed_by TEXT,
  review_notes TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_applications_email_pending
  ON agent_applications(email) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON agent_applications(status, created_at);
