import { createFileRoute } from "@tanstack/react-router";
import { CitizenOccurrenceForm } from "@/components/sentinela/citizen-occurrence-form";

export const Route = createFileRoute("/app/registrar")({
  head: () => ({
    meta: [
      { title: "Registrar ocorrência — Sentinela" },
      { name: "description", content: "Registre uma ocorrência em poucos passos e acompanhe o protocolo." },
    ],
  }),
  component: CitizenOccurrenceForm,
});
