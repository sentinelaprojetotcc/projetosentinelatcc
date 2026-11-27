# Acesso institucional — perfis separados

## Implementação (23/11/2026)

O clique em **Acesso Institucional** em `/acesso` abre `/institucional/entrar`, que apresenta os cards **Auditor** e **Agente de Segurança**. O perfil escolhido é preservado em `?perfil=auditor` ou `?perfil=agente` durante login, cadastro e recuperação de senha.

- Ambos os perfis entram com **e-mail e senha**, validando o tipo real de conta no servidor; contas institucionais já existentes não precisam mais informar matrícula no login.
- Formulário de **Auditor**: dados, CPF com máscara e dígitos verificadores, e-mail, senha forte, confirmação e etapa de código. A etapa de código chama o backend real `registerFn`, que valida `INSTITUTIONAL_SIGNUP_CODE` no Worker antes de cadastrar o auditor, com credenciais protegidas por scrypt. Voltar preserva os campos. Este fluxo herda as limitações de segurança de um código compartilhado; não constitui verificação de vínculo empregatício.
- Formulário de **Agente**: dados, CPF, seletor fixo com quatro instituições, senha forte, arrastar/selecionar PDF até 10 MB, visualização e remoção do arquivo. O backend de solicitação não cria conta nem sessão e retorna protocolo **somente após** persistir documento em R2 privado e registro de análise em D1.
- Recuperação automática de senha continua desabilitada até existir verificação de identidade; a página conserva o perfil e explica o motivo.
- Não há aprovação automática do Agente nem painel administrativo de análise, aprovação ou rejeição nesta etapa. **Nunca** conceda perfil `agent` só pelo preenchimento do formulário.

## Configuração de prévia — solicitação de Agente

O código está preparado, mas a aplicação não simula armazenamento quando os serviços não estão configurados. **Não use documentos ou CPFs reais durante testes.**

### 1. Criar o bucket privado de testes no Cloudflare

No terminal autenticado pelo Wrangler:

```powershell
bunx wrangler r2 bucket create sentinela-documentos-preview
```

Não habilite domínio público no bucket. Permita acesso apenas ao Worker. Em seguida, adicione na seção `previews` do `wrangler.jsonc` (apenas depois de criar o bucket):

```json
"r2_buckets": [
  {
    "binding": "AGENT_DOCUMENTS",
    "bucket_name": "sentinela-documentos-preview"
  }
]
```

O **nome do binding** deve ser `AGENT_DOCUMENTS`; não o altere. O bloco de produção não deve compartilhar esse recurso de testes.

### 2. Aplicar a migração no D1 de testes

```powershell
bunx wrangler d1 execute sentinela-db-preview --remote --file="./migrations/001_agent_applications.sql"
```

A migração é aditiva e cria a tabela `agent_applications`, sem modificar a tabela `users`. **Não aplique** no banco de produção até definir política de privacidade, retenção, acesso aos documentos e aprovação administrativa.

### 3. Validar os dois fluxos

1. Confirmar o segredo `INSTITUTIONAL_SIGNUP_CODE` na prévia (valor nunca no GitHub).
2. Testar cadastro Auditor com CPF fictício válido e código incorreto (deve falhar) e com código correto (deve criar conta); depois testar login/logout e acesso a `/org`.
3. Testar solicitação Agente com PDF fictício sem dados pessoais; conferir protocolo e status `pending` no D1; login deve continuar bloqueado.
4. Testar CPF inválido, senha fraca, PDF que não seja PDF, PDF acima de 10 MB e botão Voltar preservando campos.
5. Conferir que a população não acessa o painel institucional e vice-versa.

## Limitações e controles ainda exigidos antes de produção

- **Identidade institucional:** o código compartilhado de Auditor não equivale a um convite individual/aprovação de vínculo; implementar códigos individuais de uso único e expiração, verificação do órgão e revogação.
- **Aprovação de Agente:** falta a área administrativa para ler e decidir solicitações, verificar a autenticidade dos documentos e criar contas aprovadas. O login de uma solicitação pendente não deve funcionar.
- **Documentos e CPF:** estruturar tratamento LGPD, política de retenção e exclusão, autorização da instituição, antivírus/sandbox para PDF e logs de auditoria de acesso. O bucket R2 deve ser privado e nunca servir PDFs livremente.
- **Segurança adicional:** proteção contra tentativas repetidas, prevenção de spam, rate limiting, gestão de segredos e recuperação de senha por token.
- **Testes integrados:** apenas compilação e testes unitários das validações são automatizados. Login, arquivo R2, fluxo D1 e navegação exigem validação manual da prévia.

## Reversão

A versão original foi preservada na branch `backup/institucional-antes-refatoracao-20261123`, no commit `50e3928cdd44b3b6e1a601b1c2697a90d92b8227`. Para desfazer, restaure os arquivos alterados a partir dessa referência em uma nova revisão, preservando o banco de dados. Não faça force-push nem mexa na produção sem verificar os efeitos.

Documentação oficial de bindings: https://developers.cloudflare.com/workers/previews/configuration/
