import "@tanstack/react-start/server-only";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { env } from "cloudflare:workers";
import { db } from "./db.server";
import { cpfValido, emailValido, orgaoValido, senhaForte, somenteDigitos } from "./institutional-validation";

type AgentApplicationInput = {
  name: string;
  cpf: string;
  email: string;
  password: string;
  institution: string;
  documentName: string;
  documentType: string;
  documentBase64: string;
};

type PrivateR2 = {
  put: (key: string, data: Uint8Array, options?: { httpMetadata?: { contentType: string } }) => Promise<unknown>;
  delete: (key: string) => Promise<unknown>;
};

const MAX_PDF_BYTES = 10 * 1024 * 1024;

/**
 * Protocola a análise sem criar conta institucional, sessão ou acesso a /org.
 * Requer tabela do D1 e bucket privado R2, configurados explicitamente.
 */
export async function submitAgentApplication(input: AgentApplicationInput) {
  if (!input || typeof input.name !== "string" || typeof input.email !== "string" ||
    typeof input.cpf !== "string" || typeof input.password !== "string" ||
    typeof input.institution !== "string" || typeof input.documentName !== "string" ||
    typeof input.documentBase64 !== "string" || typeof input.documentType !== "string") {
    throw new Error("Confira os dados do formulário.");
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const cpf = somenteDigitos(input.cpf);
  if (name.length < 3 || name.length > 160) throw new Error("Informe seu nome completo.");
  if (!cpfValido(cpf)) throw new Error("CPF inválido.");
  if (!emailValido(email)) throw new Error("E-mail inválido.");
  if (!senhaForte(input.password)) throw new Error("A senha deve incluir ao menos 10 caracteres, maiúscula, minúscula, número e símbolo.");
  if (!orgaoValido(input.institution)) throw new Error("Selecione um órgão autorizado.");

  const storage = (env as unknown as { AGENT_DOCUMENTS?: PrivateR2 }).AGENT_DOCUMENTS;
  if (!storage) {
    throw new Error("O recebimento seguro de documentos ainda não foi habilitado. Nenhum cadastro foi enviado.");
  }

  const cleanName = input.documentName.trim().replace(/[\\/\x00-\x1f]/g, "").slice(0, 180);
  if (input.documentType !== "application/pdf" || !/\.pdf$/i.test(cleanName)) {
    throw new Error("O documento deve ser um arquivo PDF.");
  }
  if (input.documentBase64.length > Math.ceil(MAX_PDF_BYTES * 4 / 3) + 16 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(input.documentBase64)) {
    throw new Error("O PDF é inválido ou ultrapassa 10 MB.");
  }

  const pdf = Buffer.from(input.documentBase64, "base64");
  if (!pdf.length || pdf.length > MAX_PDF_BYTES || pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("O documento não é um PDF válido de até 10 MB.");
  }

  try {
    await db.prepare("SELECT id FROM agent_applications LIMIT 1").get();
  } catch {
    throw new Error("O cadastro de agentes ainda não está habilitado no banco de testes. Nenhum dado foi enviado.");
  }

  const [existingUser, existingApplication] = await Promise.all([
    db.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE OR cpf = ? LIMIT 1").get(email, cpf),
    db.prepare("SELECT id FROM agent_applications WHERE email = ? COLLATE NOCASE AND status = 'pending' LIMIT 1").get(email),
  ]);
  if (existingUser) throw new Error("Já existe uma conta com este e-mail ou CPF.");
  if (existingApplication) throw new Error("Já existe uma solicitação pendente para este e-mail.");

  const id = randomUUID();
  const documentKey = `agent-applications/${id}.pdf`;
  const salt = randomBytes(16).toString("hex");
  const passwordHash = `${salt}:${scryptSync(input.password, salt, 64).toString("hex")}`;

  const uploaded = await storage.put(documentKey, pdf, { httpMetadata: { contentType: "application/pdf" } });
  if (!uploaded) throw new Error("Não foi possível armazenar o documento com segurança. Tente novamente.");
  try {
    await db.prepare(`INSERT INTO agent_applications
      (id, name, cpf, email, institution, password_hash, document_key, document_name, document_size, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`)
      .run(id, name, cpf, email, input.institution, passwordHash, documentKey, cleanName, pdf.length);
  } catch {
    await storage.delete(documentKey).catch(() => undefined);
    throw new Error("Não foi possível registrar a solicitação. Nenhuma conta foi ativada.");
  }
  // Apenas protocolo de solicitação, sem criar sessão institucional.
  return { status: "pending" as const, protocol: `AGT-${id.slice(0, 8).toUpperCase()}` };
}
