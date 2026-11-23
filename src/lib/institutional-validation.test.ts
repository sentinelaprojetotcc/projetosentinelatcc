import { describe, expect, it } from "bun:test";
import { cpfValido, emailValido, formatarCPF, orgaoValido, senhaForte } from "./institutional-validation";

describe("Validações do acesso institucional", () => {
  it("aplica máscara em CPF sem alterar os dígitos", () => {
    expect(formatarCPF("52998224725")).toBe("529.982.247-25");
    expect(formatarCPF("529.982.247-25")).toBe("529.982.247-25");
  });

  it("valida dígitos verificadores do CPF", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("52998224726")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
    expect(cpfValido("123")).toBe(false);
  });

  it("rejeita e-mails inválidos e senhas fracas", () => {
    expect(emailValido("auditor@gov.br")).toBe(true);
    expect(emailValido("sem-arroba")).toBe(false);
    expect(senhaForte("Teste@123456")).toBe(true);
    expect(senhaForte("12345678")).toBe(false);
    expect(senhaForte("apenasminusculas1")).toBe(false);
  });

  it("restringe os órgãos de agentes às opções autorizadas", () => {
    expect(orgaoValido("Polícia Militar (PM)")).toBe(true);
    expect(orgaoValido("Polícia Civil (PC)")).toBe(true);
    expect(orgaoValido("Guarda Municipal (GM)")).toBe(true);
    expect(orgaoValido("Polícia Penal")).toBe(true);
    expect(orgaoValido("Qualquer instituição")).toBe(false);
  });
});
