import { createFileRoute, redirect } from "@tanstack/react-router";
import { OrgDashboard } from "./index";

/** Painel consolidado dos agentes. /org continua sendo o Dashboard dos auditores. */
export const Route = createFileRoute("/org/dashboard")({
  beforeLoad: ({ context }) => {
    if (context.user.institutionalType !== "agent") throw redirect({ to: "/org" });
  },
  head: () => ({ meta: [{ title: "Dashboard e Análises — Agente de Segurança | Sentinela" }] }),
  component: OrgDashboard,
});
