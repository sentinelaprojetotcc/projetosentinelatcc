import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { CitizenHeatmap } from "@/components/sentinela/citizen-heatmap";
import { PageHeader } from "@/components/sentinela/ui-kit";
import { OrgDashboard } from "./index";

export const Route = createFileRoute("/org/mapa")({
  head: () => ({
    meta: [
      { title: "Início — Mapa de calor | Sentinela Institucional" },
      {
        name: "description",
        content: "Mapa de calor das ocorrências e indicadores institucionais do Sentinela.",
      },
      { property: "og:title", content: "Início — Sentinela Institucional" },
      { property: "og:description", content: "Mapa de calor e indicadores institucionais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrgMapa,
});

function OrgMapa() {
  const { user } = getRouteApi("/org").useRouteContext();
  const auditor = user.institutionalType === "auditor";

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <PageHeader
          title="Início"
          description={auditor
            ? "Mapa de calor compartilhado e indicadores para acompanhamento e auditoria do Sentinela."
            : "Mapa de calor compartilhado das ocorrências do Sentinela."}
        />
        <CitizenHeatmap />
      </div>

      {auditor && (
        <section className="space-y-6 border-t border-border pt-7" aria-label="Indicadores e gráficos de auditoria">
          <OrgDashboard />
        </section>
      )}
    </div>
  );
}
