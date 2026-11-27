# Carga de dados fictícios — Sentinela (prévia D1)

**IMPORTANTE:** apenas para `sentinela-db-preview` e para apresentação acadêmica.
Nunca execute os comandos no banco `sentinela-db` (produção).

## O que esta carga faz
- Cria **48 usuários sintéticos** com nomes de personagens, e-mails `.invalid` e **CPF nulo**, evitando colisão com CPFs do banco existente. Todas as senhas ficam inutilizáveis.
- Adiciona **280 ocorrências** equilibradas entre Furto, Roubo, Violência, Dano, Ameaça, Acidente e Outros.
- Inclui registros fictícios nas tabelas reais de previsões, contestações, notificações, patrulhamentos, recomendações, decisões, disparidades, auditorias, relatórios, mitigação, modelos e qualidade de dados.
- As ocorrências têm localização aproximada em diversos municípios e bairros do Brasil, **prioridade Normal/Urgente** e faixas de confiabilidade **baixa (12–42%), média (48–73%) e alta (78–98%)**.
- Todas as datas de evento estão entre **01/01/2026** e **25/11/2026**, inclusive.
- Na carga original, o marcador **`[DEMO-SENTINELA-2026]`** identifica as descrições fictícias. Mesmo que seja retirado para melhorar a leitura, o site detecta os usuários sintéticos pelos e-mails `.invalid` e exibe aviso separado. Nomes dos usuários sintéticos levam **(DEMO)**.
- Percentuais são gerados aleatoriamente: **não representam cálculos de um modelo, índices reais de crime, auditorias verdadeiras nem probabilidade de risco**.

## Como alimentar a prévia (PowerShell, na branch feat/cloudflare-d1-migracao)

1. Antes de executar, faça um backup privado do D1 (pode conter dados pessoais previamente cadastrados). A pasta `data/` está no `.gitignore`; não publique esse arquivo:

```powershell
bunx wrangler d1 export sentinela-db-preview --remote --output="./data/backup-preview-antes-demo-20261125.sql"
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

**Pode executar novamente sem duplicar registros** (IDs determinísticos; nos usuários há `ON CONFLICT(id) DO NOTHING`, e nas demais tabelas há `INSERT OR IGNORE`). Não sobrescreve registros existentes.

## Reescrever somente as descrições para apresentação

Depois da importação e da limpeza dos prefixos executada anteriormente, é possível substituir **apenas as 678 descrições dos registros sintéticos**, incluindo as 280 ocorrências, mantendo categoria, região, status, data, prioridade, percentual de confiabilidade e vínculos entre registros.

O texto passa a relatar de forma direta o que aconteceu e como, sem observações repetitivas sobre testes dentro da descrição. A sinalização de dados simulados fica em um aviso separado no site, identificado pelas contas sintéticas de e-mail `.invalid` (não depende da presença do marcador no campo `details`).

Execute exclusivamente na prévia:

```powershell
git pull --ff-only origin feat/cloudflare-d1-migracao
bunx wrangler d1 execute sentinela-db-preview --remote --file="./migrations/demo/normalize_descriptions_2026_11_25.sql"
```

Confira sem visualizar informações pessoais:

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --command="SELECT COUNT(*) AS textos_antigos FROM occurrences WHERE created_by IN (SELECT id FROM users WHERE email LIKE '%@sentinela.example.invalid') AND details LIKE '%Cenário inteiramente fictício para testes acadêmicos%';"
```

O resultado esperado para `textos_antigos` é **0**. Isso confirma a remoção do texto repetitivo dessas ocorrências, sem exigir que a simulação seja apresentada como fato real.

Para restaurar **somente essas descrições** ao estado posterior à limpeza dos prefixos, sem apagar registros:

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --file="./migrations/demo/restore_descriptions_2026_11_25.sql"
```

Os scripts verificam o ID, a conta de demonstração relacionada e o conteúdo anterior esperado para evitar sobrescrever alterações de outros usuários. Não são executados automaticamente pelo deploy.

## Limpeza de rótulos para apresentação

O arquivo `limpar_rotulos_apresentacao_2026_11_25.sql` atua exclusivamente sobre os IDs sintéticos criados pela carga de 25/11/2026. Remove marcadores como `(DEMO)` e `[DEMO]` e substitui `Modelo acadêmico fictício` por **Análise experimental**.

As contas fictícias continuam com e-mails reservados `@sentinela.example.invalid`, mas o prefixo público é alterado para `participante-`. O acesso às contas continua desabilitado, e o aviso separado de dados simulados permanece no site.

Faça backup do banco de prévia atualizado antes de executar (o arquivo privado fica na pasta `data/` ignorada pelo Git):

```powershell
bunx wrangler d1 export sentinela-db-preview --remote --output="./data/backup-preview-antes-rotulos-20261125.sql"
```

Atualize os arquivos e execute somente em `sentinela-db-preview`:

```powershell
git pull --ff-only origin feat/cloudflare-d1-migracao
bunx wrangler d1 execute sentinela-db-preview --remote --file="./migrations/demo/limpar_rotulos_apresentacao_2026_11_25.sql"
```

Confira se os nomes ainda contêm o marcador:

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --command="SELECT COUNT(*) AS nomes_com_demo FROM users WHERE email LIKE '%@sentinela.example.invalid' AND name LIKE '%DEMO%';"
```

O esperado é `nomes_com_demo = 0`. O SQL também preserva status, datas, prioridades, percentuais e relacionamentos entre registros. Não execute em produção nem apresente os casos sintéticos como fatos policiais reais.

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
- O teste automatizado inclui um cidadão já existente com CPF que causaria colisão na versão antiga do arquivo, para garantir compatibilidade com bancos que não estão vazios.

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
