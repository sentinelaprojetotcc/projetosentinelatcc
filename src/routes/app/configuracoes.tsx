import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { Eye, Settings2, ShieldCheck } from "lucide-react";
import { SettingsView } from "@/components/sentinela/settings-view";
import { CitizenPrivacyContent } from "@/components/sentinela/citizen-privacy";
import { PublicTransparencyContent } from "@/components/sentinela/public-transparency";

type Section = "gerais" | "privacidade" | "transparencia";

export const Route = createFileRoute("/app/configuracoes")({
  validateSearch: (search: Record<string, unknown>): { secao?: Section } => ({
    secao: search.secao === "gerais" || search.secao === "privacidade" || search.secao === "transparencia"
      ? search.secao : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Configurações da conta — Sentinela" },
      { name: "description", content: "Conta, notificações, privacidade e transparência pública." },
    ],
  }),
  component: Configuracoes,
});

const sections = [
  { key: "gerais" as const, label: "Configurações gerais", icon: Settings2 },
  { key: "privacidade" as const, label: "Privacidade", icon: ShieldCheck },
  { key: "transparencia" as const, label: "Transparência Pública", icon: Eye },
];

function Configuracoes() {
  const { user } = getRouteApi("/app").useRouteContext();
  const { secao } = Route.useSearch();
  const current = secao ?? "gerais";
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <nav aria-label="Seções das configurações" className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-card/70 p-2 sm:grid-cols-3">
        {sections.map(({ key, label, icon: Icon }) => (
          <Link key={key} to="/app/configuracoes" search={{ secao: key }}
            aria-current={current === key ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${current === key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {current === "gerais" && <SettingsView user={user} hidePrivacy />}
      {current === "privacidade" && <CitizenPrivacyContent />}
      {current === "transparencia" && <PublicTransparencyContent />}
    </div>
  );
}
