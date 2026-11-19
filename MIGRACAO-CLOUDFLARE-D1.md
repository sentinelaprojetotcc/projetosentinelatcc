# Migração do Sentinel para Cloudflare Workers + D1

> **Estado:** proposta de migração em branch separada. NÃO está validada em produção nem pronta para merge sem os passos abaixo.

## O que foi alterado

- O projeto é um TanStack Start com rotas SSR e funções de servidor. O alvo correto é **Cloudflare Workers with Static Assets**, não uma publicação somente estática do Pages.
- A autenticação e o módulo de registros foram convertidos de `node:sqlite` síncrono para consultas assíncronas ao binding `env.DB` do Cloudflare D1.
- Senhas antigas permanecem no mesmo formato `scrypt` (`salt:hash`). Não redefina ou publique senhas.
- O banco local **NÃO** foi enviado ao GitHub: o `.gitignore` exclui `data/*.db`. Não inclua arquivos de banco ou exportações SQL em commits públicos.

## 1. Preparar o repositório local

Trabalhe nesta branch depois de salvar suas alterações locais:

```powershell
git fetch origin
git switch feat/cloudflare-d1-migracao
bun install
```

**Atenção:** `bun.lock` e `package-lock.json` ainda precisam ser atualizados para refletir as novas dependências. Antes de mesclar a branch, execute `bun install`, confira `bun run build` e envie os arquivos de lock atualizados.

## 2. Criar o banco D1

```powershell
bunx wrangler login
bunx wrangler d1 create sentinela-db
```

O comando devolve um `database_id` UUID. Substitua **00000000-0000-0000-0000-000000000000** por esse ID em `wrangler.jsonc`. O binding deve continuar se chamando **DB**.

O arquivo foi criado com ID provisório: **não execute o deploy sem substituí-lo**.

## 3. Preparar uma exportação privada do SQLite

Use o `data/sentinela.db` **mais recente e íntegro** existente no seu computador; o ZIP enviado é de 09/09/2026 e pode não conter os cadastros mais novos.

Faça uma cópia segura do arquivo original e execute (com o programa `sqlite3` disponível no PATH):

```powershell
sqlite3 data/sentinela.db "PRAGMA integrity_check;"
cmd /c "sqlite3 data\sentinela.db .dump > data\sentinela-export.sql"
```

O teste deve retornar `ok`.

Abra `data/sentinela-export.sql` no VS Code e retire o `BEGIN TRANSACTION;` e o `COMMIT;` do dump, conforme orientação do D1. Confira também SQL de tabelas especiais que não sejam compatíveis com D1.

**Não publique essa exportação:** ela pode conter CPF, telefone, endereço, evidências e hashes de senha. O caminho `data/*.sql` está no `.gitignore`.

## 4. Importar os dados para o banco D1

Só faça a importação em um D1 recém-criado e vazio, sem usuários já cadastrados:

```powershell
bunx wrangler d1 execute sentinela-db --remote --file=data/sentinela-export.sql
```

Confirme as contagens sem exibir dados pessoais:

```powershell
bunx wrangler d1 execute sentinela-db --remote --command="SELECT COUNT(*) AS total FROM users;"
bunx wrangler d1 execute sentinela-db --remote --command="SELECT COUNT(*) AS total FROM occurrences;"
```

Compare com as contagens no SQLite original antes de descartar qualquer backup. Se a importação falhar, **não repita cegamente no mesmo banco**, pois poderia duplicar ou deixar tabelas parcialmente importadas. Avalie novo banco vazio.

## 5. Testar antes de publicar

```powershell
bun run cf-typegen
bun run build
bun run dev
```

Verifique, em um ambiente de teste:

1. Cadastro e login de cidadão.
2. Cadastro e login institucional (agente / auditor).
3. Encerrar sessão e entrar novamente.
4. Alteração de senha e preferências de acessibilidade.
5. Criação, listagem e revisão de ocorrências e contestações.
6. Mapa, relatórios, auditoria e notificações.
7. Segurança de permissões e respostas de erro.

O código foi adaptado, **mas ainda não foi compilado/testado em Workers** durante esta preparação. Podem existir ajustes de versão e tipagem.

## 6. Implantar como Worker (não substitua seu Pages atual automaticamente)

```powershell
bun run deploy
```

Isso implanta um **novo Worker**. Teste o endereço `*.workers.dev` antes de apontar o domínio do Sentinel. Seu site Pages atual permanece independente até você alterar a rota ou domínio.

## Observações importantes

- Não há credenciais do Supabase necessárias nesta proposta.
- O `src/server.ts` (wrapper próprio de erros de SSR) não é o entrypoint do novo Worker; o entrypoint oficial em `wrangler.jsonc` é `@tanstack/react-start/server-entry`.
- O D1 tem limites próprios; evidências base64 grandes gravadas em `evidence_data` talvez precisem ir para Cloudflare R2 posteriormente.
- O SQLite original não é sincronizado automaticamente com o D1 após a importação. Defina uma data de corte antes do lançamento.
- O código existente permite redefinição de senhas com CPF/identificação funcional. **Antes de atender usuários reais, esse fluxo deve ser substituído por verificação forte**, como links temporários e limitados, para evitar apropriação de contas.
- Nunca mescle esta branch ou aponte o domínio de produção sem testar login e integridade dos dados.

Documentação oficial:
- https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://developers.cloudflare.com/d1/get-started/
