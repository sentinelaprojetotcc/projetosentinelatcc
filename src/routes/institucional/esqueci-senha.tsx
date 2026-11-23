import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand";

export const Route = createFileRoute("/institucional/esqueci-senha")({
  validateSearch: (search: Record<string, unknown>) => ({
    perfil: search.perfil === "auditor" || search.perfil === "agente" ? search.perfil : undefined,
  }),
  head: () => ({ meta: [{ title: "Recuperar senha institucional — Sentinela" }] }),
  component: RecuperarSenhaInstitucional,
});

function RecuperarSenhaInstitucional() {
  const { perfil } = Route.useSearch();
  const nome = perfil === "auditor" ? "Auditor" : perfil === "agente" ? "Agente de Segurança" : "institucional";
  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <div className="page-glow absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <Logo size={34} subtitle="Plataforma institucional" />
        <section className="surface-card mt-6 space-y-5 rounded-2xl p-7">
          <span className="flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold">Recuperação de senha — {nome}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A recuperação automática permanece temporariamente indisponível até que exista verificação
            segura da identidade. Procure o responsável pelo Sentinela para recuperar seu acesso.
          </p>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            Por segurança, CPF ou matrícula isoladamente não permitem trocar a senha.
          </p>
          <Link to="/institucional/entrar" search={perfil ? { perfil } : {}}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao login {perfil ? "de " + nome : "institucional"}
          </Link>
        </section>
      </div>
    </main>
  );
}
