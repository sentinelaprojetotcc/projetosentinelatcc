import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/sentinela/ui-kit";
import { CitizenHeatmap } from "@/components/sentinela/citizen-heatmap";

export const Route = createFileRoute("/app/mapa")({
  head: () => ({ meta: [{ title: "Mapa de Segurança — Sentinela" }] }),
  component: MapaPopulacao,
});

/** Mantém os links antigos funcionando; o mapa principal também está em /app. */
function MapaPopulacao() {
  return <div className="space-y-6">
    <PageHeader title="Mapa de Segurança" description="Mapa interativo com filtros compactos. Localizações aproximadas." />
    <CitizenHeatmap />
  </div>;
}
