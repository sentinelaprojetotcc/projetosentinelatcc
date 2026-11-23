import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type DragEvent, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, ClipboardCheck, FileText, ShieldCheck, UploadCloud, X } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { InstitutionalField, InstitutionalPassword } from "@/components/institutional/fields";
import { cpfValido, emailValido, formatarCPF, orgaoValido, ORGAOS_SEGURANCA, senhaForte } from "@/lib/institutional-validation";
import { registerFn, submitAgentApplicationFn } from "@/lib/auth";

export const Route = createFileRoute("/institucional/cadastro")({
  validateSearch: (search: Record<string, unknown>) => ({
    perfil: search.perfil === "auditor" || search.perfil === "agente" ? search.perfil : undefined,
  }),
  head: () => ({ meta: [{ title: "Cadastro institucional — Sentinela" }] }),
  component: CadastroInstitucional,
});

const MAX_PDF = 10 * 1024 * 1024;
type FormState = {
  name: string; cpf: string; email: string; password: string; confirm: string;
  institution: string; activationCode: string;
};
type ErrorState = Partial<Record<keyof FormState | "file" | "general", string>>;

function validar(form: FormState, perfil: "auditor" | "agente"): ErrorState {
  const errors: ErrorState = {};
  if (form.name.trim().length < 3) errors.name = "Informe seu nome completo.";
  if (!cpfValido(form.cpf)) errors.cpf = "CPF inválido. Verifique os 11 dígitos.";
  if (!emailValido(form.email)) errors.email = "Informe um e-mail válido.";
  if (!senhaForte(form.password)) errors.password = "Use 10 a 128 caracteres com maiúscula, minúscula, número e símbolo.";
  if (form.password !== form.confirm) errors.confirm = "As senhas não coincidem.";
  if (perfil === "agente" && !orgaoValido(form.institution)) errors.institution = "Selecione uma instituição da lista.";
  return errors;
}

function pdfValido(file: File): string | undefined {
  if (file.type !== "application/pdf" || !/\.pdf$/i.test(file.name)) return "Selecione somente arquivos PDF.";
  if (!file.size || file.size > MAX_PDF) return "O documento deve ter no máximo 10 MB.";
  return undefined;
}

function lerPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o PDF."));
    reader.onload = () => {
      if (typeof reader.result !== "string") return reject(new Error("Não foi possível ler o PDF."));
      resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

function CadastroInstitucional() {
  const { perfil } = Route.useSearch();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "", cpf: "", email: "", password: "", confirm: "", institution: "", activationCode: "",
  });
  const [errors, setErrors] = useState<ErrorState>({});
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [protocol, setProtocol] = useState("");

  if (!perfil) {
    return <main className="flex min-h-screen items-center justify-center px-5">
      <section className="surface-card max-w-md space-y-4 p-8 text-center">
        <h1 className="text-xl font-semibold">Selecione seu perfil institucional</h1>
        <p className="text-sm text-muted-foreground">O cadastro precisa estar vinculado ao perfil escolhido anteriormente.</p>
        <Button asChild><Link to="/institucional/entrar" search={{}}>Escolher perfil</Link></Button>
      </section>
    </main>;
  }

  const auditor = perfil === "auditor";
  const title = auditor ? "Cadastro de Auditor" : "Cadastro de Agente de Segurança";
  const change = (field: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  };
  const setCpf = (value: string) => change("cpf")(formatarCPF(value));

  function selecionarPDF(candidate?: File | null) {
    if (!candidate) return;
    const issue = pdfValido(candidate);
    if (issue) {
      setFile(null);
      setErrors((current) => ({ ...current, file: issue }));
      return;
    }
    setFile(candidate);
    setErrors((current) => ({ ...current, file: undefined, general: undefined }));
  }

  function soltarPDF(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    selecionarPDF(event.dataTransfer.files?.[0]);
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || protocol) return;
    if (auditor && step === 1) {
      const issues = validar(form, "auditor");
      setErrors(issues);
      if (!Object.keys(issues).length) setStep(2);
      return;
    }

    const issues = validar(form, perfil);
    if (auditor && !form.activationCode.trim()) issues.activationCode = "Informe o código fornecido pela administração.";
    if (!auditor && !file) issues.file = "Anexe o documento de identificação em PDF.";
    setErrors(issues);
    if (Object.keys(issues).length) {
      if (auditor && Object.keys(issues).some((key) => key !== "activationCode")) setStep(1);
      return;
    }

    setLoading(true);
    try {
      if (auditor) {
        await registerFn({ data: {
          role: "institutional", institutionalType: "auditor",
          name: form.name.trim(), cpf: form.cpf, email: form.email.trim(),
          password: form.password, authorizationCode: form.activationCode.trim(),
          state: "BA", city: "Salvador",
        } });
        await navigate({ to: "/org" });
      } else {
        if (!file) throw new Error("Selecione o documento de identificação.");
        const documentBase64 = await lerPDF(file);
        const result = await submitAgentApplicationFn({ data: {
          name: form.name.trim(), cpf: form.cpf, email: form.email.trim(),
          password: form.password, institution: form.institution,
          documentName: file.name, documentType: file.type, documentBase64,
        } });
        if (result.status === "pending") setProtocol(result.protocol);
      }
    } catch (cause) {
      setErrors((previous) => ({
        ...previous,
        general: cause instanceof Error ? cause.message : "Não foi possível concluir o cadastro. Tente novamente.",
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8 sm:py-12">
      <div className="page-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl">
        <Logo subtitle="Cadastro institucional" />
        <Link to="/institucional/entrar" search={{ perfil }}
          className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para login de {auditor ? "Auditor" : "Agente de Segurança"}
        </Link>
        <div className="surface-card mt-5 rounded-2xl p-6 sm:p-9">
          {protocol ? (
            <section className="space-y-5 text-center" role="status">
              <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden="true" />
              <h1 className="text-2xl font-semibold">Solicitação recebida</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Seu pedido de acesso como Agente de Segurança foi enviado para análise institucional.
                <strong className="text-foreground"> A conta ainda não está ativa e não pode acessar o painel.</strong>
              </p>
              <p className="rounded-lg border border-border bg-secondary/50 p-3 text-sm">Protocolo: <strong>{protocol}</strong></p>
              <Button asChild className="w-full"><Link to="/institucional/entrar" search={{ perfil }}>Voltar ao login</Link></Button>
            </section>
          ) : (
            <>
              <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                {auditor ? <ClipboardCheck className="size-6" aria-hidden="true" /> : <ShieldCheck className="size-6" aria-hidden="true" />}
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Acesso institucional</p>
              <h1 className="mt-2 font-sans text-2xl font-semibold">{auditor && step === 2 ? "Ativação da conta" : title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {auditor
                  ? (step === 1 ? "Preencha seus dados para solicitar a ativação de acesso como auditor." : "Insira o código de ativação fornecido pela administração responsável para validar seu acesso como auditor.")
                  : "Seus dados e documento serão encaminhados para análise. O acesso só será liberado após aprovação."}
              </p>

              {auditor && <div className="mt-6 flex items-center gap-2" aria-label={"Etapa " + step + " de 2"}>
                <div className={"h-1.5 flex-1 rounded-full " + (step >= 1 ? "bg-primary" : "bg-secondary")} />
                <div className={"h-1.5 flex-1 rounded-full " + (step === 2 ? "bg-primary" : "bg-secondary")} />
                <span className="ml-2 text-xs font-medium text-muted-foreground">{step} de 2</span>
              </div>}

              <form className="mt-7 space-y-5" method="post" noValidate onSubmit={enviar}>
                {(!auditor || step === 1) && (
                  <>
                    <InstitutionalField id="nome-institucional" label="Nome completo" value={form.name}
                      onChange={change("name")} error={errors.name} autoComplete="name" maxLength={160} />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <InstitutionalField id="cpf-institucional" label="CPF" value={form.cpf}
                        onChange={setCpf} error={errors.cpf} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} />
                      <InstitutionalField id="email-cadastro" label={auditor ? "E-mail institucional ou Gov.br" : "E-mail"}
                        value={form.email} onChange={change("email")} type="email"
                        autoComplete="email" error={errors.email} />
                    </div>
                    {!auditor && <div className="space-y-2">
                      <label htmlFor="orgao-agente" className="text-sm font-medium">
                        Instituição / órgão de segurança <span className="text-primary" aria-hidden="true">*</span>
                      </label>
                      <select id="orgao-agente" value={form.institution} onChange={(event) => change("institution")(event.target.value)}
                        required aria-invalid={Boolean(errors.institution)}
                        aria-describedby={errors.institution ? "orgao-erro" : undefined}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary">
                        <option value="">Selecione o órgão</option>
                        {ORGAOS_SEGURANCA.map((orgao) => <option key={orgao} value={orgao}>{orgao}</option>)}
                      </select>
                      {errors.institution && <p id="orgao-erro" role="alert" className="text-xs text-destructive">{errors.institution}</p>}
                    </div>}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <InstitutionalPassword id="senha-cadastro" label="Senha" value={form.password}
                        onChange={change("password")} error={errors.password} />
                      <InstitutionalPassword id="confirmar-senha" label="Confirmar senha" value={form.confirm}
                        onChange={change("confirm")} error={errors.confirm} />
                    </div>
                    <p className="text-xs text-muted-foreground">Use pelo menos 10 caracteres com letra maiúscula, minúscula, número e símbolo.</p>
                    {!auditor && <section className="space-y-3" aria-labelledby="documento-titulo">
                      <h2 id="documento-titulo" className="text-sm font-medium">Documento de identificação <span className="text-primary">*</span></h2>
                      <label htmlFor="documento-agente" onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                        onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
                        onDrop={soltarPDF}
                        className={"flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-colors focus-within:border-primary " +
                          (dragging ? "border-primary bg-primary/10" : errors.file ? "border-destructive/70" : "border-border hover:border-primary/60 hover:bg-secondary/30")}>
                        {file ? <FileText className="size-8 text-primary" aria-hidden="true" /> : <UploadCloud className="size-8 text-primary" aria-hidden="true" />}
                        <span className="mt-3 text-sm font-semibold">{file ? "Documento selecionado" : "Anexe seu documento de identificação (PDF)"}</span>
                        <span className="mt-1 text-xs text-muted-foreground">{file ? file.name : "Arraste o arquivo até aqui ou clique para selecionar"}</span>
                        <span className="mt-2 text-xs text-muted-foreground">{file ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : "Somente PDF • Máximo de 10 MB"}</span>
                        <input id="documento-agente" type="file" accept=".pdf,application/pdf" className="sr-only"
                          onChange={(event) => { selecionarPDF(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                      </label>
                      {file && <button type="button" onClick={() => setFile(null)}
                        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive">
                        <X className="size-4" /> Remover ou substituir documento
                      </button>}
                      {errors.file && <p role="alert" className="text-xs text-destructive">{errors.file}</p>}
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        O documento deve ser enviado para armazenamento privado e analisado pela instituição.
                        Não há liberação automática de acesso.
                      </p>
                    </section>}
                  </>
                )}

                {auditor && step === 2 && <div className="space-y-3">
                  <InstitutionalPassword id="codigo-ativacao" label="Código de Ativação" value={form.activationCode}
                    onChange={change("activationCode")} autoComplete="off" error={errors.activationCode} />
                  <p className="text-xs text-muted-foreground">O código é validado pelo servidor. Não compartilhe o código nem o informe em solicitações desconhecidas.</p>
                </div>}

                {errors.general && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{errors.general}</p>}
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  {auditor && step === 2 && <Button type="button" variant="secondary" className="h-11 sm:flex-1"
                    disabled={loading} onClick={() => { setStep(1); setErrors({}); }}>
                    <ArrowLeft className="mr-2 size-4" /> Voltar
                  </Button>}
                  <Button type="submit" className="h-11 w-full sm:flex-1" disabled={loading}>
                    {loading ? "Enviando com segurança..." : auditor ? (step === 1 ? "Continuar" : "Finalizar cadastro") : "Criar conta"}
                    {!loading && (auditor && step === 2 ? <BadgeCheck className="ml-2 size-4" /> : <ArrowRight className="ml-2 size-4" />)}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
