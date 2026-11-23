import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { PublicTransparencyContent } from "@/components/sentinela/public-transparency";

export const Route = createFileRoute("/transparencia")({
  component: Transparencia,
});

/** Mantém a transparência acessível ao público sem autenticação. */
function Transparencia() {
  return <main className="min-h-screen bg-background px-5 py-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <Button asChild variant="secondary"><Link to="/acesso">Acessar o Sentinela</Link></Button>
      </div>
      <PublicTransparencyContent />
    </div>
  </main>;
}
