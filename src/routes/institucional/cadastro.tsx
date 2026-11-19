import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand";

export const Route = createFileRoute("/institucional/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro Institucional — Sentinela" }] }),
  component: CadastroInstitucional,
});

function CadastroInstitucional() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="grid-lines absolute inset-0 opacity-40" />
      <div className="relative z-10 w-full max-w-md">
        <Logo size={34} subtitle="Plataforma institucional" />
        <section className="surface-card mt-6 space-y-4 p-6">
          <h1 className="text-xl font-semibold">Cadastro institucional restrito</h1>
          <p className="text-sm text-muted-foreground">
            Contas de agente policial e auditor precisam ser verificadas e aprovadas pelo
            responsável pelo Sentinel. O autocadastro institucional foi desativado por segurança.
          </p>
          <p className="text-sm text-muted-foreground">
            As contas institucionais existentes continuam podendo acessar o sistema.
          </p>
          <Link to="/institucional/entrar" className="block text-center text-sm text-primary hover:underline">
            Voltar para o login institucional
          </Link>
        </section>
      </div>
    </main>
  );
}
