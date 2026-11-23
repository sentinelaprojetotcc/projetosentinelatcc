/** Utilitários compartilhados de validação institucional; não manipulam segredos. */
export type PerfilAcesso = "auditor" | "agente";

export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCPF(valor: string) {
  const n = somenteDigitos(valor).slice(0, 11);
  return n.replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** Protótipo acadêmico: valida apenas a presença de exatamente 11 dígitos. */
export function cpfValido(valor: string) {
  return somenteDigitos(valor).length === 11;
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

export function senhaMinimaValida(senha: string) {
  return senha.length >= 8;
}

export const ORGAOS_SEGURANCA = [
  "Polícia Militar (PM)",
  "Polícia Civil (PC)",
  "Guarda Municipal (GM)",
  "Polícia Penal",
] as const;

export function orgaoValido(valor: string) {
  return (ORGAOS_SEGURANCA as readonly string[]).includes(valor);
}
