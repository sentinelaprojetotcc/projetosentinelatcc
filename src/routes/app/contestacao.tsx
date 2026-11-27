import { createFileRoute } from "@tanstack/react-router";
import { CitizenContestForm } from "@/components/sentinela/citizen-contest-form";

/** Rota antiga preservada para links diretos e compatibilidade. */
export const Route = createFileRoute("/app/contestacao")({
  validateSearch: (search: Record<string, unknown>) => ({
    registro: typeof search.registro === "string" ? search.registro : undefined,
  }),
  head: () => ({ meta: [{ title: "Contestar uma decisão — Sentinela" }] }),
  component: Contestacao,
});

function Contestacao() {
  const { registro } = Route.useSearch();
  return <CitizenContestForm initialTargetId={registro} />;
}
