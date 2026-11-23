# Cadastro institucional com código de autorização

A página **Acesso Institucional > Criar conta institucional** voltou a permitir o cadastro de **Agente policial** e **Auditor**. O formulário fica disponível em `/institucional/cadastro`.

## Regra de segurança

O backend só cadastra uma conta institucional se receber um `authorizationCode` válido. O código é comparado ao secret de ambiente `INSTITUTIONAL_SIGNUP_CODE`, que **não pode ser escrito em `wrangler.jsonc` nem enviado ao GitHub**. Se o secret não estiver configurado, o cadastro falha de maneira segura e os logins já existentes continuam funcionando. O código nunca é armazenado na tabela de usuários.

**Atenção:** um código compartilhado é adequado somente para testes controlados de TCC. Ele não substitui verificação de identidade, vínculo com o órgão, autorização administrativa individual, códigos de uso único e controle de tentativas. Antes de disponibilizar o cadastro ao público real, implemente convites individuais com expiração, aprovação por administrador e prevenção de abuso.

## Configurar na prévia do Cloudflare

O Wrangler já está autenticado e a prévia usa o banco `sentinela-db-preview`.

1. Abra o terminal PowerShell na pasta do projeto.
2. Gere um código aleatório forte. Exemplo compatível com Windows PowerShell:

   ```powershell
   $bytes = New-Object byte[] 32
   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   $rng.Dispose()
   $codigo = -join ($bytes | ForEach-Object { $_.ToString("x2") })
   ```

3. Grave o código **somente na prévia já existente** (o valor não precisa aparecer no histórico do shell):

   ```powershell
   $codigo | bunx wrangler preview secret put INSTITUTIONAL_SIGNUP_CODE --name feat-cloudflare-d1-migracao
   ```

4. Guarde o valor de `$codigo` em gerenciador de senhas protegido. Compartilhe-o somente com pessoas de teste autorizadas. Não o cole no chat, envie em prints, crie arquivos versionados ou use valores previsíveis.
5. Abra a URL da prévia, escolha **Acesso Institucional > Criar conta institucional**, preencha o formulário usando dados *fictícios* e informe o código autorizado. O cadastro cria a conta e a sessão.

> Se o Wrangler solicitar o código de forma interativa apesar do pipe, informe o valor da variável `$codigo` no prompt do CLI, sem mostrá-lo na conversa.

A configuração de segredo é específica da prévia. Ela **não** habilita o cadastro na produção. Para produção, é necessário decidir antes quem poderá autorizar usuários, e configurar uma credencial própria no ambiente de produção.

## Teste recomendado

- Um código incorreto deve impedir o cadastro.
- Um código correto deve criar uma conta institucional no D1 de prévia, permitindo login.
- Uma conta da população não pode acessar `/org`.
- Os perfis Agente e Auditor só acessam os respectivos dados autorizados pelo servidor.
- Remova qualquer conta de demonstração após os testes.

Documentação: https://developers.cloudflare.com/workers/previews/configuration/
