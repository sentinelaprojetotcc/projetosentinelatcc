import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Paperclip, ShieldQuestion } from "lucide-react";
import { PageHeader, Panel, Timeline, StatusPill, Disclaimer } from "@/components/sentinela/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { addCitizenContestFn, citizenDecisionRecordsFn } from "@/lib/records";

const motivos = [
  "Informação incorreta",
  "Dados desatualizados",
  "Contexto não considerado",
  "Possível tratamento desigual",
  "Possível resultado discriminatório",
  "Outro",
];

export function CitizenContestForm({ initialTargetId, onSuccess }: { initialTargetId?: string; onSuccess?: () => void | Promise<void> }) {
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState(motivos[0]!);
  const [targetType, setTargetType] = useState<"occurrence" | "prediction">("occurrence");
  const [details, setDetails] = useState("");
  const [protocol, setProtocol] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [targets, setTargets] = useState<Array<{ id: string; protocol: string; title: string; kind: "occurrence" | "prediction" }>>([]);
  const [targetId, setTargetId] = useState("");
  const [evidence, setEvidence] = useState<{ name: string; type: string; data: string } | null>(null);
  useEffect(() => {
    void citizenDecisionRecordsFn().then((items) => {
      const values = items as typeof targets;
      setTargets(values);
      const chosen = initialTargetId ? values.find((item) => item.id === initialTargetId) : values[0];
      if (chosen) {
        setTargetId(chosen.id);
        setTargetType(chosen.kind);
      } else if (initialTargetId) {
        setTargetId("");
        setError("A previsão selecionada não está mais disponível. Escolha um registro válido.");
      }
    }).catch(() => setError("Não foi possível carregar as previsões e decisões disponíveis."));
  }, [initialTargetId]);

  if (sent) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="surface-card glow-ring p-8 text-center">
          <ShieldQuestion className="mx-auto size-12 text-primary" />
          <h1 className="mt-4 font-sans text-xl font-semibold">Solicitação enviada</h1>
          <p className="mt-2 font-mono text-sm text-primary">{protocol}</p>
          <div className="mt-3 flex justify-center">
            <StatusPill tone="warning">Aguardando análise humana</StatusPill>
          </div>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sua contestação foi registrada e será analisada por um responsável autorizado. A
            decisão não será considerada definitivamente encerrada enquanto a revisão estiver
            pendente, quando aplicável ao processo.
          </p>
        </div>

        <Panel title="Acompanhamento">
          <Timeline
            steps={["Contestação enviada", "Triagem", "Revisão humana", "Resultado"]}
            current={0}
          />
        </Panel>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setSent(false)}>
            Nova contestação
          </Button>
          <Button asChild className="flex-1">
            <Link to="/app/contestacoes">Minhas contestações</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Contestar uma decisão"
        description="Se você acredita que uma decisão automatizada foi incorreta, injusta ou inadequadamente aplicada ao seu caso, pode solicitar uma revisão."
      />

      <Panel title="O que você deseja contestar?">
        <RadioGroup value={targetType} onValueChange={(value) => {
          const selectedKind = value as "occurrence" | "prediction";
          setTargetType(selectedKind);
          setTargetId(targets.find((item) => item.kind === selectedKind)?.id ?? "");
          setError("");
        }} className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4"><RadioGroupItem value="occurrence" id="target-occurrence" /><Label htmlFor="target-occurrence">Decisão sobre uma ocorrência</Label></label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-4"><RadioGroupItem value="prediction" id="target-prediction" /><Label htmlFor="target-prediction">Previsão da IA</Label></label>
        </RadioGroup>
        <Label className="mt-5 block">Registro ou previsão relacionada</Label>
        <select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={targetId} onChange={(event) => { setTargetId(event.target.value); const selected = targets.find((item) => item.id === event.target.value); if (selected) setTargetType(selected.kind); }}><option value="">Selecione um registro</option>{targets.filter((item) => item.kind === targetType).map((item) => <option key={`${item.kind}-${item.id}`} value={item.id}>{item.protocol} — {item.title}</option>)}</select>
      </Panel>

      <Panel title="Por que você deseja contestar esta decisão?">
        <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
          {motivos.map((m) => (
            <label key={m} className="flex items-center gap-3 text-sm text-muted-foreground">
              <RadioGroupItem value={m} id={m} />
              <Label htmlFor={m} className="cursor-pointer font-normal">
                {m}
              </Label>
            </label>
          ))}
        </RadioGroup>
      </Panel>

      <Panel title="Explique o problema">
        <Textarea rows={5} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Descreva por que você considera a decisão inadequada." />
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground hover:border-primary/50">
          <Paperclip className="size-4 text-primary" /> {evidence ? evidence.name : "Adicionar evidências (opcional, máximo 5 MB)"}
          <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) return setError("A evidência deve ter no máximo 5 MB."); const reader = new FileReader(); reader.onload = () => setEvidence({ name: file.name, type: file.type || "application/octet-stream", data: String(reader.result) }); reader.readAsDataURL(file); }} />
        </label>
      </Panel>

      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button className="w-full" disabled={loading} onClick={async () => {
        setError("");
        if (targetType === "prediction" && !targetId) {
          setError("Selecione a previsão que deseja contestar.");
          return;
        }
        setLoading(true);
        try { const result = await addCitizenContestFn({ data: { targetType, reason, details, targetId: targetId || undefined, evidenceName: evidence?.name, evidenceType: evidence?.type, evidenceData: evidence?.data } }); setProtocol(result.protocol); setSent(true); await onSuccess?.(); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar a contestação."); }
        finally { setLoading(false); }
      }}>
        {loading ? "Enviando..." : "Solicitar revisão humana"}
      </Button>

      <Disclaimer>
        Decisões automatizadas que afetam seu atendimento podem sempre ser explicadas e revisadas
        por uma pessoa responsável.
      </Disclaimer>
    </div>
  );
}
