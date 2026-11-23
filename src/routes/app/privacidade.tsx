import { createFileRoute } from "@tanstack/react-router";
import { CitizenPrivacyContent } from "@/components/sentinela/citizen-privacy";

/** Endereço antigo mantido como acesso direto, sem duplicar o conteúdo. */
export const Route = createFileRoute("/app/privacidade")({
  head: () => ({ meta: [{ title: "Privacidade e Transparência — Sentinela" }] }),
  component: CitizenPrivacyContent,
});
