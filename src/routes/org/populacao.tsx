import { createFileRoute } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";

export function AgentPopulationRecords() {
  return <ManagedRecords kind="occurrences" sourceFilter="População" title="Registros enviados pela população"
    description="Relatos de origem População armazenados na tabela de ocorrências." />;
}

/** Preserva a URL antiga para favoritos e links existentes. */
export const Route = createFileRoute("/org/populacao")({ component: AgentPopulationRecords });
