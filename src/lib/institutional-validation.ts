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

/** Protótipo acadêmico: formato de 11 dígitos, sem verificar dígitos de controle. */
export function cpfValido(valor: string) {
  const input = valor.trim();
  return /^\d{11}$/.test(input) || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(input);
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

export function senhaMinimaValida(senha: string) {
  return senha.length >= 8;
}

/** Código fixo exclusivo do protótipo; não deve autorizar acesso em produção. */
export function codigoAuditorValido(valor: string) {
  return valor.toUpperCase() === "AUDIT26";
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
