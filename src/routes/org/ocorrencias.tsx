import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ManagedRecords } from "@/components/sentinela/managed-records";
import { AgentPopulationRecords } from "./populacao";

export const Route = createFileRoute("/org/ocorrencias")({ component: AgentOccurrences });

function AgentOccurrences() {
  const [view, setView] = useState<"all" | "population">("all");
  return <section className="space-y-5">
    <div role="group" aria-label="Visualizar ocorrências" className="flex flex-wrap gap-2 rounded-xl border border-border bg-card/50 p-2">
      <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")}
        className={`min-h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${view === "all" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
        Todas as ocorrências
      </button>
      <button type="button" aria-pressed={view === "population"} onClick={() => setView("population")}
        className={`min-h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${view === "population" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
        Registros da população
      </button>
    </div>
    {view === "all" ? <ManagedRecords kind="occurrences" title="Ocorrências"
      description="Visualize todas as ocorrências enviadas pela população e os registros institucionais." /> : <AgentPopulationRecords />}
  </section>;
}
