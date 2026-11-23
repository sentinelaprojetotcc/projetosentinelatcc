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

export function cpfValido(valor: string) {
  const n = somenteDigitos(valor);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  for (let tamanho = 9; tamanho < 11; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(n[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    const digito = resto === 10 ? 0 : resto;
    if (digito !== Number(n[tamanho])) return false;
  }
  return true;
}

export function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 254;
}

export function senhaForte(senha: string) {
  return senha.length >= 10 && senha.length <= 128 &&
    /[a-z]/.test(senha) && /[A-Z]/.test(senha) &&
    /\d/.test(senha) && /[^A-Za-z\d]/.test(senha);
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
