import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — Sentinela" }] }),
  component: EsqueciSenha,
});

function EsqueciSenha() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <div className="page-glow absolute inset-0" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center"><Logo size={40} /></div>
        <section className="surface-card mt-8 space-y-4 p-6">
          <h1 className="text-xl font-semibold">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground">
            A recuperação automática por CPF foi temporariamente desativada por segurança.
            Solicite ajuda ao responsável pelo Sentinel para verificar sua identidade.
          </p>
          <p className="text-xs text-muted-foreground">
            Se você ainda estiver conectado, pode alterar sua senha nas configurações.
          </p>
          <Link to="/entrar" className="block text-center text-sm text-primary hover:underline">
            Voltar para o login
          </Link>
        </section>
      </div>
    </main>
  );
}
