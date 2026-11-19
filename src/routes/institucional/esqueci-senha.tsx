import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand";

export const Route = createFileRoute("/institucional/esqueci-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha institucional — Sentinela" }] }),
  component: RecuperarSenhaInstitucional,
});

function RecuperarSenhaInstitucional() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="grid-lines absolute inset-0 opacity-40" />
      <div className="relative z-10 w-full max-w-md">
        <Logo size={34} subtitle="Plataforma institucional" />
        <section className="surface-card mt-6 space-y-4 p-6">
          <h1 className="text-xl font-semibold">Recuperação de senha institucional</h1>
          <p className="text-sm text-muted-foreground">
            A recuperação automática por matrícula funcional está temporariamente desativada.
            Solicite ajuda ao responsável pelo Sentinel para verificar sua identidade.
          </p>
          <p className="text-xs text-muted-foreground">
            Caso ainda esteja conectado, você pode alterar sua senha nas configurações da conta.
          </p>
          <Link to="/institucional/entrar" className="block text-center text-sm text-primary hover:underline">
            Voltar para o login institucional
          </Link>
        </section>
      </div>
    </main>
  );
}
