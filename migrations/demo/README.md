# Carga de dados fictícios — Sentinela (prévia D1)

**IMPORTANTE:** apenas para `sentinela-db-preview` e para apresentação acadêmica.
Nunca execute os comandos no banco `sentinela-db` (produção).

## O que esta carga faz
- Cria **48 usuários sintéticos** com nomes de personagens e emails `.invalid`. Todas as senhas ficam inutilizáveis.
- Adiciona **280 ocorrências** equilibradas entre Furto, Roubo, Violência, Dano, Ameaça, Acidente e Outros.
- Inclui registros fictícios nas tabelas reais de previsões, contestações, notificações, patrulhamentos, recomendações, decisões, disparidades, auditorias, relatórios, mitigação, modelos e qualidade de dados.
- As ocorrências têm localização aproximada em diversos municípios e bairros do Brasil, **prioridade Normal/Urgente** e faixas de confiabilidade **baixa (12–42%), média (48–73%) e alta (78–98%)**.
- Todas as datas de evento estão entre **01/01/2026** e **25/11/2026**, inclusive.
- O marcador **`[DEMO-SENTINELA-2026]`** identifica cada descrição fictícia. Nomes levam **(DEMO)**.
- Percentuais são gerados aleatoriamente: **não representam cálculos de um modelo, índices reais de crime, auditorias verdadeiras nem probabilidade de risco**.

## Como alimentar a prévia (PowerShell, na branch feat/cloudflare-d1-migracao)

1. Antes de executar, faça um backup privado do D1 (pode conter dados pessoais previamente cadastrados):

```powershell
bunx wrangler d1 export sentinela-db-preview --remote --output="./backup-preview-antes-demo-20261125.sql"
```

2. Atualize o código local sem substituir mudanças locais pendentes:

```powershell
git switch feat/cloudflare-d1-migracao
git pull --ff-only origin feat/cloudflare-d1-migracao
```

3. Execute somente no banco de prévia:

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --file="./migrations/demo/seed_2026_11_25.sql"
```

4. Confira quantos registros foram inseridos:

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --command="SELECT COUNT(*) AS demo_ocorrencias FROM occurrences WHERE details LIKE '[DEMO-SENTINELA-2026]%';"
```

**Pode executar novamente sem duplicar registros** (IDs determinísticos + `INSERT OR IGNORE`). Não sobrescreve registros existentes.

## Como desfazer a carga (somente prévia)

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --file="./migrations/demo/rollback_2026_11_25.sql"
```

O rollback apaga **apenas os IDs criados pelo gerador desta carga**, em todas as tabelas listadas, incluindo os usuários fictícios. Confira se não criou manualmente vínculos novos a esses IDs antes de reverter.

## Limitações importantes

- Estes registros alimentam os painéis, análises, mapa, listagens e sino nos três perfis, **mas não aparecem em "Minhas ocorrências" de uma conta real**, porque pertencem aos perfis sintéticos e a área lista somente ocorrências próprias.
- Os casos de demonstração são ficcionais e não foram enviados pelo formulário normal. Os percentuais exibidos foram sorteados.
- O mapa de calor mostra a distribuição dos incidentes fictícios; uma visualização com esses dados não representa crime real nem deve orientar qualquer operação policial.
- As tabelas existentes no banco de prévia devem manter os nomes e colunas usados em `src/lib/records.server.ts` e `src/lib/auth.server.ts`; caso o Wrangler informe uma incompatibilidade, interrompa a execução e examine o erro. O backup e rollback foram preparados para facilitar a recuperação.
- Nenhum PDF real, CPF de pessoa real, telefone, endereço residencial ou registro policial verdadeiro foi adicionado.

## Contagem prevista
| Tabela | Quantidade |
|---|---:|
| `users` | 48 |
| `occurrences` | 280 |
| `predictions` | 84 |
| `recommendations` | 42 |
| `patrols` | 36 |
| `ai_decisions` | 28 |
| `bias_alerts` | 24 |
| `contests` | 42 |
| `notifications` | 56 |
| `audits` | 24 |
| `reports` | 16 |
| `mitigations` | 16 |
| `models` | 12 |
| `data_quality` | 18 |
| **Total** | **726** |
