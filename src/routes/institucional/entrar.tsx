import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck, Shield, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { InstitutionalField, InstitutionalPassword } from "@/components/institutional/fields";
import { emailValido } from "@/lib/institutional-validation";
import { loginFn } from "@/lib/auth";

export const Route = createFileRoute("/institucional/entrar")({
  validateSearch: (search: Record<string, unknown>) => ({
    perfil: search.perfil === "auditor" || search.perfil === "agente" ? search.perfil : undefined,
  }),
  head: () => ({ meta: [{ title: "Acesso Institucional — Sentinela" }] }),
  component: AcessoInstitucional,
});

const perfis = {
  auditor: {
    label: "Auditor",
    description: "Responsável pela análise, fiscalização e avaliação de possíveis vieses algorítmicos.",
    icon: ClipboardCheck,
    type: "auditor" as const,
  },
  agente: {
    label: "Agente de Segurança",
    description: "Profissional autorizado a utilizar as ferramentas de apoio à segurança pública.",
    icon: ShieldCheck,
    type: "agent" as const,
  },
};

function AcessoInstitucional() {
  const { perfil } = Route.useSearch();
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-10 sm:px-8 sm:py-14">
      <div className="page-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl">
        <Logo subtitle="Acesso institucional" />
        {perfil ? <LoginPerfil key={perfil} perfil={perfil} /> : <SeletorPerfil />}
      </div>
    </main>
  );
}

function SeletorPerfil() {
  return (
    <section className="mx-auto mt-14 max-w-3xl sm:mt-20" aria-labelledby="selecao-titulo">
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <Shield className="size-7" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Ambiente institucional</p>
        <h1 id="selecao-titulo" className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Como você deseja acessar?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Selecione seu perfil profissional para acessar as ferramentas de transparência,
          monitoramento e responsabilidade algorítmica do Sentinela.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {(["auditor", "agente"] as const).map((key) => {
          const data = perfis[key];
          const Icon = data.icon;
          return (
            <Link key={key} to="/institucional/entrar" search={{ perfil: key }}
              aria-label={`Acessar como ${data.label}`}
              className="surface-card group flex min-h-64 flex-col rounded-2xl border border-border p-7 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/70 hover:shadow-[0_16px_42px_-22px_var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transform-none">
              <span className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-foreground">{data.label}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{data.description}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Selecionar perfil <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>
      <Link to="/acesso" className="mx-auto mt-8 flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar aos tipos de acesso
      </Link>
    </section>
  );
}

function LoginPerfil({ perfil }: { perfil: "auditor" | "agente" }) {
  const data = perfis[perfil];
  const Icon = data.icon;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  async function entrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!emailValido(email)) next.email = "Informe um e-mail válido.";
    if (!password) next.password = "Informe sua senha.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await loginFn({ data: {
        role: "institutional", institutionalType: data.type, email: email.trim(), password,
      } });
      await navigate({ to: "/org" });
    } catch (cause) {
      setErrors({ general: cause instanceof Error ? cause.message : "Não foi possível entrar. Verifique seus dados." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto mt-12 max-w-md sm:mt-16" aria-labelledby="login-titulo">
      <Link to="/institucional/entrar" search={{}} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar à seleção de perfil
      </Link>
      <div className="surface-card mt-6 rounded-2xl p-6 sm:p-8">
        <div className="mb-6 flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Acesso institucional</p>
        <h1 id="login-titulo" className="mt-2 font-sans text-2xl font-semibold">Entrar como {data.label}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Entre com as credenciais da sua conta autorizada.</p>
        <form className="mt-7 space-y-5" method="post" noValidate onSubmit={entrar}>
          <InstitutionalField id="email-institucional" label="E-mail" value={email} type="email"
            autoComplete="email" onChange={setEmail} error={errors.email} />
          <InstitutionalPassword id="senha-institucional" label="Senha" value={password}
            onChange={setPassword} autoComplete="current-password" error={errors.password} />
          {errors.general && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{errors.general}</p>}
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? "Verificando acesso..." : "Entrar"} {!loading && <ArrowRight className="ml-2 size-4" />}
          </Button>
        </form>
        <div className="mt-6 flex flex-col items-center gap-4 border-t border-border pt-6 text-sm">
          <Link to="/institucional/cadastro" search={{ perfil }} className="font-medium text-primary transition-colors hover:text-primary/80">
            Criar conta de {data.label}
          </Link>
          <Link to="/institucional/esqueci-senha" search={{ perfil }} className="text-muted-foreground hover:text-primary">
            Esqueci minha senha
          </Link>
        </div>
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">O acesso depende de credenciais e autorização institucional válidas.</p>
    </section>
  );
}
