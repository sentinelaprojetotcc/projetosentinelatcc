import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { CitizenContestForm } from "@/components/sentinela/citizen-contest-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Disclaimer, PageHeader, Panel, StatusPill, Timeline } from "@/components/sentinela/ui-kit";
import { myCitizenContestsFn, type ManagedRecord } from "@/lib/records";

export const Route = createFileRoute("/app/contestacoes")({
  validateSearch: (search: Record<string, unknown>) => ({
    registro: typeof search.registro === "string" ? search.registro : undefined,
  }),
  component: MinhasContestacoes,
});
type Contest = ManagedRecord & { protocol: string };

function MinhasContestacoes() {
  const { registro } = Route.useSearch();
  const [items, setItems] = useState<Contest[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(Boolean(registro));
  const refresh = async () => { const rows = await myCitizenContestsFn(); setItems(rows as Contest[]); };
  useEffect(() => { void refresh(); const timer = window.setInterval(() => { void refresh(); }, 10000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (registro) setShowForm(true); }, [registro]);
  return <div className="mx-auto max-w-4xl space-y-5"><PageHeader title="Minhas contestações" description="Acompanhe protocolos, revisão humana e o resultado de cada solicitação." action={
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" asChild><Link to="/app/decisoes">Ver previsões</Link></Button>
      <Button type="button" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm} aria-controls="form-contestacao">
        {showForm ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
        {showForm ? "Fechar formulário" : "Nova contestação"}
      </Button>
    </div>
  } />
  {showForm && <section id="form-contestacao" className="rounded-xl border border-primary/30 bg-card/40 p-3 sm:p-5">
    <CitizenContestForm key={registro ?? "avulsa"} initialTargetId={registro} onSuccess={refresh} />
  </section>}{items.length === 0 ? <Panel><p className="py-8 text-center text-sm text-muted-foreground">Você ainda não enviou nenhuma contestação.</p></Panel> : items.map((item) => { const current = timelineIndex(item.status); return <Panel key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs text-primary">{item.protocol}</p><h2 className="mt-1 font-semibold">{item.title}</h2>{/Registro contestado:\\s*([0-9a-f-]{36})/i.test(item.details) && <p className="mt-1 font-mono text-xs text-muted-foreground">Referência: {item.details.match(/Registro contestado:\\s*([0-9a-f-]{36})/i)?.[1]}</p>}<p className="mt-1 text-xs text-muted-foreground">{item.eventDate} · {item.region}</p></div><div className="flex items-center gap-2"><StatusPill tone={current >= 4 ? "success" : "warning"}>{item.status}</StatusPill><Button size="sm" variant="secondary" onClick={() => setOpened((value) => value === item.id ? null : item.id)}>{opened === item.id ? "Fechar" : "Abrir"}</Button></div></div>{opened === item.id && <div className="mt-5 grid gap-5 border-t pt-5 md:grid-cols-2"><div><Timeline steps={["Contestação enviada", "Triagem", "Revisão humana", "Resultado", "Encerramento"]} current={current} /></div><div className="space-y-4"><div><p className="text-xs font-semibold text-muted-foreground">Solicitação enviada</p><p className="mt-2 whitespace-pre-line text-sm">{originalDetails(item.details)}</p></div>{item.evidenceName && <div><p className="text-xs font-semibold text-muted-foreground">Evidência anexada</p><p className="mt-1 text-sm">{item.evidenceName}</p></div>}{current >= 3 && <div className="rounded-lg border border-primary/25 bg-primary/5 p-4"><p className="text-xs font-semibold text-primary">Resultado da revisão humana</p><p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{reviewResult(item.details)}</p></div>}</div></div>}</Panel>; })}<Disclaimer>O resultado final deve ser apresentado em linguagem simples. Quando houver correção, a alteração permanece registrada na trilha de auditoria.</Disclaimer></div>;
}
function timelineIndex(status: string) { const value = status.toLocaleLowerCase("pt-BR"); if (value.includes("conclu") || value.includes("encerr")) return 4; if (value.includes("revisão concluída") || value.includes("resultado")) return 3; if (value.includes("revis") || value.includes("informações")) return 2; if (value.includes("triagem") || value.includes("análise")) return 1; return 0; }
function originalDetails(details: string) { return details.split("\n\nDecisão humana:")[0].trim(); }
function reviewResult(details: string) { const decision = details.match(/Decisão humana:\s*(.*?)\./i)?.[1] ?? "Resultado concluído"; const auditor = details.match(/Auditor responsável:\s*(.*?)\.?$/i)?.[1] ?? "Responsável autorizado"; const outcome = /alterar/i.test(decision) ? "Resultado corrigido" : /cancelar/i.test(decision) ? "Decisão cancelada" : /informações/i.test(decision) ? "Mais informações solicitadas" : "Resultado mantido"; return `${outcome}.\nDecisão humana: ${decision}.\nAuditor responsável: ${auditor}.`; }
