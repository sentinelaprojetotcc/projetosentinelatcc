import "@tanstack/react-start/server-only";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { env } from "cloudflare:workers";
import { db } from "./db.server";
import { codigoAuditorValido, cpfValido, emailValido, senhaMinimaValida, somenteDigitos } from "./institutional-validation";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

export type AccountRole = "citizen" | "institutional";
export type InstitutionalType = "agent" | "auditor";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AccountRole;
  city: string;
  state: string;
  neighborhood: string | null;
  institution: string | null;
  functionalId: string | null;
  institutionalType: InstitutionalType | null;
};

export type RegisterInput = {
  role: AccountRole;
  name: string;
  email: string;
  password: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  postalCode?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
  institution?: string;
  functionalId?: string;
  institutionalType?: InstitutionalType;
  // Necessário somente para contas institucionais autorizadas.
  authorizationCode?: string;
  latitude?: number;
  longitude?: number;
  locationConsent?: boolean;
};

export type AccessibilityPreferences = {
  textScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
};

const SESSION_COOKIE = "sentinela_session";
// O esquema e os dados são provisionados por migrações D1, fora das requisições.

function normalize(value?: string) {
  return value?.trim() || null;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function publicUser(row: Record<string, unknown>): SessionUser {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : null,
    role: row.role as AccountRole,
    city: String(row.city),
    state: String(row.state),
    neighborhood: row.neighborhood ? String(row.neighborhood) : null,
    institution: row.institution ? String(row.institution) : null,
    functionalId: row.functional_id ? String(row.functional_id) : null,
    institutionalType: row.institutional_type ? row.institutional_type as InstitutionalType : null,
  };
}

async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expires.toISOString());
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function registerAccount(input: RegisterInput) {
  if (!input || (input.role !== "citizen" && input.role !== "institutional")) {
    throw new Error("Tipo de cadastro inválido.");
  }
  // Agentes solicitam análise; não podem se conceder acesso em registro direto.
  if (input.role === "institutional" && input.institutionalType !== "auditor") {
    throw new Error("Acesso de agente exige análise institucional antes da liberação.");
  }
  if (input.role === "institutional") {
    // Mantém a ativação fora da produção: o segredo de habilitação foi
    // configurado exclusivamente na prévia do Cloudflare.
    const configuredCode = (env as unknown as { INSTITUTIONAL_SIGNUP_CODE?: string }).INSTITUTIONAL_SIGNUP_CODE;
    // Exige habilitação explícita do protótipo. Um segredo antigo ou ausente
    // NÃO pode ativar o código público de demonstração.
    if (!configuredCode || !codigoAuditorValido(configuredCode)) {
      throw new Error("Ativação acadêmica não habilitada neste ambiente.");
    }
    const code = typeof input.authorizationCode === "string" ? input.authorizationCode : "";
    if (!codigoAuditorValido(code)) {
      throw new Error("Código de ativação incorreto.");
    }
  }
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 3) throw new Error("Informe o nome completo.");
  if (!emailValido(email)) throw new Error("Informe um e-mail válido.");
  if (!senhaMinimaValida(input.password)) throw new Error("A senha deve conter no mínimo 8 caracteres.");
  if (!cpfValido(input.cpf ?? "")) throw new Error("O CPF deve conter exatamente 11 números.");
  if (input.role === "institutional" && input.institutionalType !== "auditor") {
    throw new Error("Perfil institucional inválido para ativação de auditor.");
  }

  try {
    const id = randomUUID();
    const functionalId = input.role === "institutional" ? `AUD-${randomUUID()}` : normalize(input.functionalId);
    await db.prepare(`
      INSERT INTO users (
        id, role, name, email, password_hash, cpf, birth_date, phone, postal_code,
        state, city, neighborhood, address, institution, functional_id,
        latitude, longitude, location_consent, institutional_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, input.role, name, email, hashPassword(input.password), input.role === "institutional" ? somenteDigitos(input.cpf ?? "") : normalize(input.cpf),
      normalize(input.birthDate), normalize(input.phone), normalize(input.postalCode),
      normalize(input.state) ?? "BA", normalize(input.city) ?? "Salvador",
      normalize(input.neighborhood), normalize(input.address), input.role === "institutional" ? "Auditoria institucional" : normalize(input.institution),
      functionalId, input.locationConsent ? input.latitude ?? null : null,
      input.locationConsent ? input.longitude ?? null : null, input.locationConsent ? 1 : 0,
      input.role === "institutional" ? input.institutionalType : null,
    );
    await createSession(id);
    const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown>;
    return publicUser(row);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new Error("Já existe uma conta com esse e-mail, CPF ou identificação funcional.");
    }
    throw error;
  }
}

export async function loginAccount(input: { email: string; password: string; role: AccountRole; institutionalType?: InstitutionalType }) {
  const row = await db.prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE").get(input.email.trim()) as Record<string, unknown> | undefined;
  if (!row || row.role !== input.role || !passwordMatches(input.password, String(row.password_hash))) {
    throw new Error("E-mail ou senha incorretos para este tipo de acesso.");
  }
  if (input.role === "institutional" && row.institutional_type !== "agent" && row.institutional_type !== "auditor") {
    throw new Error("Perfil institucional inválido. Procure o responsável pelo Sentinel.");
  }
  if (input.role === "institutional" && input.institutionalType !== row.institutional_type) {
    throw new Error("Esta conta não pertence ao perfil institucional selecionado.");
  }
  await createSession(String(row.id));
  return publicUser(row);
}

export async function currentSession() {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;
  const row = await db.prepare(`
    SELECT users.* FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token = ? AND sessions.expires_at > ?
  `).get(token, new Date().toISOString()) as Record<string, unknown> | undefined;
  if (!row) {
    deleteCookie(SESSION_COOKIE, { path: "/" });
    return null;
  }
  return publicUser(row);
}

export async function endSession() {
  const token = getCookie(SESSION_COOKIE);
  if (token) await db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  deleteCookie(SESSION_COOKIE, { path: "/" });
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const row = await db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string } | undefined;
  if (!row || !passwordMatches(input.currentPassword, row.password_hash)) throw new Error("A senha atual está incorreta.");
  if (!senhaMinimaValida(input.newPassword)) throw new Error("A senha deve conter no mínimo 8 caracteres.");
  if (input.currentPassword === input.newPassword) throw new Error("A nova senha deve ser diferente da senha atual.");
  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(input.newPassword), user.id);
  await db.prepare("DELETE FROM sessions WHERE user_id = ? AND token <> ?").run(user.id, getCookie(SESSION_COOKIE) ?? "");
  return { ok: true };
}

// Recuperação por CPF não prova posse da conta; requer token de uso único enviado por canal verificado.
export async function resetCitizenPassword(_input: { email: string; cpf: string; newPassword: string }) {
  throw new Error("Recuperação de senha temporariamente indisponível. Procure o responsável pelo Sentinel.");
}

export async function updatePhone(phoneInput: string) {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const phone = phoneInput.trim();
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) throw new Error("Informe um telefone válido com DDD.");
  await db.prepare("UPDATE users SET phone = ? WHERE id = ?").run(phone, user.id);
  return { ok: true, phone };
}

// Matrícula funcional, por si só, não é fator seguro para recuperação de senha.
export async function resetInstitutionalPassword(_input: { email: string; functionalId: string; newPassword: string }) {
  throw new Error("Recuperação de senha institucional indisponível. Procure o responsável pelo Sentinel.");
}

export async function getAccessibilityPreferences(): AccessibilityPreferences {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const row = await db.prepare("SELECT * FROM user_accessibility_preferences WHERE user_id = ?").get(user.id) as Record<string, unknown> | undefined;
  return row ? {
    textScale: Number(row.text_scale), highContrast: Boolean(row.high_contrast),
    reduceMotion: Boolean(row.reduce_motion), screenReader: Boolean(row.screen_reader),
  } : { textScale: 100, highContrast: false, reduceMotion: false, screenReader: true };
}

export async function saveAccessibilityPreferences(input: AccessibilityPreferences) {
  const user = await currentSession();
  if (!user) throw new Error("Sessão necessária.");
  const scale = Math.max(80, Math.min(140, Math.round(input.textScale)));
  await db.prepare(`INSERT INTO user_accessibility_preferences
    (user_id,text_scale,high_contrast,reduce_motion,screen_reader) VALUES (?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET text_scale=excluded.text_scale,
    high_contrast=excluded.high_contrast, reduce_motion=excluded.reduce_motion,
    screen_reader=excluded.screen_reader, updated_at=CURRENT_TIMESTAMP`)
    .run(user.id, scale, input.highContrast ? 1 : 0, input.reduceMotion ? 1 : 0, input.screenReader ? 1 : 0);
  return { textScale: scale, highContrast: input.highContrast, reduceMotion: input.reduceMotion, screenReader: input.screenReader };
}
