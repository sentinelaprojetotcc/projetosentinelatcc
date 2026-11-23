import { useState } from "react";
import { Filter, Search, ChevronDown } from "lucide-react";
import { Panel, Disclaimer } from "@/components/sentinela/ui-kit";
import { TacticalMap } from "@/components/sentinela/tactical-map";
import { MapFilters, defaultMapFilters, type MapFilterState } from "@/components/sentinela/filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Mesmo mapa de calor do Sentinela, compartilhado pela aba Início e pela URL antiga /app/mapa. */
export function CitizenHeatmap() {
  const [place, setPlace] = useState("");
  const [searchedPlace, setSearchedPlace] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [filters, setFilters] = useState<MapFilterState>({ ...defaultMapFilters });
  const [showFilters, setShowFilters] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  return (
    <section className="space-y-3" aria-labelledby="mapa-populacao-titulo">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="mapa-populacao-titulo" className="font-sans text-xl font-semibold">Mapa de calor</h2>
          <p className="mt-1 text-xs text-muted-foreground">Concentração de ocorrências e busca de localidades no Brasil. Posições aproximadas.</p>
        </div>
        <Button type="button" variant="secondary" size="sm"
          aria-expanded={showFilters} aria-controls="filtros-mapa-populacao"
          onClick={() => setShowFilters((value) => !value)}>
          <Filter className="size-4" aria-hidden="true" />
          <span>{showFilters ? "Recolher filtros" : "Abrir filtros"}</span>
          <ChevronDown aria-hidden="true" className={`size-4 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
        </Button>
      </div>
      <div id="filtros-mapa-populacao"
        aria-hidden={!showFilters}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none ${showFilters ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          {showFilters && (
            <div className="space-y-3 pb-2">
              <MapFilters value={filters} onChange={setFilters} citizen />
              <Panel title="Pesquisar local do Brasil" subtitle="Informe cidade, bairro ou estado para consultar a área desejada.">
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={async (event) => {
                  event.preventDefault();
                  const query = place.trim();
                  if (!query) return;
                  setSearching(true); setSearchError("");
                  try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`, { headers: { "Accept-Language": "pt-BR" } });
                    if (!response.ok) throw new Error("Não foi possível pesquisar essa localidade.");
                    const [result] = await response.json() as Array<{ lon: string; lat: string; display_name: string }>;
                    if (!result) throw new Error("Local não encontrado no Brasil.");
                    setSearchedPlace(result.display_name);
                    setCoordinates([Number(result.lon), Number(result.lat)]);
                  } catch (cause) {
                    setSearchError(cause instanceof Error ? cause.message : "Não foi possível pesquisar o local.");
                  } finally { setSearching(false); }
                }}>
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                    <Input className="pl-9" value={place} onChange={(event) => setPlace(event.target.value)}
                      placeholder="Ex.: Salvador — BA" aria-label="Local do Brasil" />
                  </div>
                  <Button type="submit" disabled={searching}>{searching ? "Pesquisando..." : "Pesquisar"}</Button>
                </form>
                {searchError && <p role="alert" className="mt-3 text-sm text-destructive">{searchError}</p>}
                {searchedPlace && <p className="mt-3 text-sm text-muted-foreground">Dados próximos de <strong className="text-foreground">{searchedPlace}</strong>. Sem registros, o mapa ficará sem área de calor.</p>}
              </Panel>
            </div>
          )}
        </div>
      </div>
      <Panel>
        <TacticalMap filters={filters} focusCoordinates={coordinates} className="h-[340px] sm:h-[440px] lg:h-[520px]" />
      </Panel>
      <Disclaimer>
        Para preservar a privacidade, o mapa não mostra endereços exatos nem informações pessoais de quem registrou uma ocorrência.
      </Disclaimer>
    </section>
  );
}
