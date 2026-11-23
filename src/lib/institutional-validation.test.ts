import { describe, expect, it } from "bun:test";
import {
  codigoAuditorValido, cpfValido, emailValido, formatarCPF,
  orgaoValido, senhaMinimaValida,
} from "./institutional-validation";

describe("Validações de cadastro do protótipo Sentinela", () => {
  it("mantém a máscara de CPF e permite números fictícios", () => {
    expect(formatarCPF("12345678901")).toBe("123.456.789-01");
    expect(formatarCPF("123.456.789-01")).toBe("123.456.789-01");
    expect(cpfValido("123.456.789-01")).toBe(true);
    expect(cpfValido("52998224726")).toBe(true); // dígito verificador incorreto é permitido
    expect(cpfValido("111.111.111-11")).toBe(true); // repetição permitida no protótipo
    expect(cpfValido("123")).toBe(false);
    expect(cpfValido("123456789012")).toBe(false);
    expect(cpfValido("")).toBe(false);
  });

  it("aceita senhas a partir de oito caracteres sem outras regras", () => {
    expect(senhaMinimaValida("12345678")).toBe(true);
    expect(senhaMinimaValida("abcdefgh")).toBe(true);
    expect(senhaMinimaValida("Teste@12")).toBe(true);
    expect(senhaMinimaValida("1234567")).toBe(false);
    expect(senhaMinimaValida("")).toBe(false);
  });

  it("aceita AUDIT26 sem diferenciar maiúsculas e minúsculas", () => {
    expect(codigoAuditorValido("AUDIT26")).toBe(true);
    expect(codigoAuditorValido("Audit26")).toBe(true);
    expect(codigoAuditorValido("audit26")).toBe(true);
    expect(codigoAuditorValido("AUDIT25")).toBe(false);
    expect(codigoAuditorValido("AUDIT26 ")).toBe(false);
    expect(codigoAuditorValido("")).toBe(false);
  });

  it("valida e-mails e restringe as opções de órgãos", () => {
    expect(emailValido("auditor@gov.br")).toBe(true);
    expect(emailValido("sem-arroba")).toBe(false);
    expect(orgaoValido("Polícia Militar (PM)")).toBe(true);
    expect(orgaoValido("Polícia Civil (PC)")).toBe(true);
    expect(orgaoValido("Guarda Municipal (GM)")).toBe(true);
    expect(orgaoValido("Polícia Penal")).toBe(true);
    expect(orgaoValido("Qualquer instituição")).toBe(false);
  });
});
