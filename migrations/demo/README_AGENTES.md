# Carga de casos para o perfil Agente de Segurança — Sentinela

**Uso exclusivo do TCC e do ambiente `sentinela-db-preview`. Não execute no banco `sentinela-db` de produção.** Os registros representam situações inteiramente inventadas. Não correspondem a ocorrências, patrulhamentos ou decisões policiais reais.

## O que será inserido

| Tabela | Registros |
|---|---:|
| `users` | 16 |
| `occurrences` | 280 |
| `predictions` | 28 |
| `recommendations` | 42 |
| `patrols` | 56 |
| `ai_decisions` | 42 |
| `notifications` | 42 |
| **Total** | **506** |

- As **280 ocorrências** estão distribuídas entre Furto, Roubo, Violência, Dano, Ameaça, Acidente e Outros, com **40 de cada categoria**.
- Datas de **01/01/2026 a 25/11/2026**, horários diferentes e cidades brasileiras. Coordenadas são aproximadas (não incluem endereços de pessoas).
- Confiabilidade aleatória: **baixa (12–42%)**, **média (48–73%)**, **alta (78–98%)**. Prioridade: **Normal** ou **Urgente**.
- Os 16 autores são **personagens fictícios do perfil Agente**, com e-mails reservados `@sentinela.example.invalid`, CPF nulo e senha inutilizável. Não podem fazer login.
- A origem de ocorrências aparece como **Registro policial (treinamento)**; previsões e outros registros têm uma origem de treinamento/experimentação. É importante manter essa identificação, mesmo que o texto das descrições seja natural, para não apresentar dados inventados como fatos reais.
- A carga atende as páginas **Ocorrências**, **Patrulhamento**, **Recomendações**, **Decisões da IA**, **Previsões**, **Dashboard** e o **sino de notificações**, de acordo com os recursos já existentes no sistema.
- A carga é **aditiva**: não remove nem modifica a carga anterior da População. A reexecução não duplica linhas.

## Como executar no PowerShell

Antes de importar, crie uma cópia privada da prévia. O arquivo conterá dados existentes do banco; **não publique o backup**. A pasta `data/` está ignorada pelo Git:

```powershell
bunx wrangler d1 export sentinela-db-preview --remote --output="./data/backup-preview-antes-agentes-20261127.sql"
```

Atualize a branch de desenvolvimento (não use o comando `git pull` que já apresentou conflito de configuração no seu computador):

```powershell
git fetch origin
git merge --ff-only origin/feat/cloudflare-d1-migracao
```

Importe somente na prévia:

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --file="./migrations/demo/seed_agentes_2026.sql"
```

Valide a contagem, sem consultar informações pessoais:

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --command="SELECT COUNT(*) AS casos_agente FROM occurrences WHERE source = 'Registro policial (treinamento)' AND created_by IN (SELECT id FROM users WHERE email LIKE 'agente-tcc-%@sentinela.example.invalid');"
```

**Resultado esperado:** `casos_agente = 280`.

## Como desfazer

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --file="./migrations/demo/rollback_agentes_2026.sql"
```

Esse arquivo exclui exclusivamente os IDs sintéticos desta carga, inclusive as 16 contas. Se você editar algum desses registros manualmente após a importação, essas alterações também serão excluídas no rollback.

**Aviso acadêmico:** todos os registros e percentuais são apenas exemplos de apresentação. Não devem orientar decisões policiais nem ser usados como estatística de criminalidade.
