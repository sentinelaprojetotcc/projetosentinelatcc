import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ManagedRecords } from "@/components/sentinela/managed-records";

export const Route = createFileRoute("/org/notificacoes")({
  component: InstitutionalNotifications,
});

function InstitutionalNotifications() {
  const { user } = getRouteApi("/org").useRouteContext();
  return <ManagedRecords
    kind="notifications"
    title="Notificações"
    description="Novas ocorrências e contestações enviadas pela população aparecem automaticamente aqui."
    allowCreate={false}
    allowMarkRead={user.institutionalType === "agent"}
  />;
}
