# Bibliotech - Gestão Inteligente de Acervos de Livros

Bibliotech é uma aplicação full-stack moderna para organização, catalogação e acompanhamento de acervos pessoais de livros, quadrinhos e mangás, integrada com inteligência artificial para resumos automáticos e recomendações de leitura personalizadas.

---

## 📋 Arquitetura de Configuração por Ambiente

O projeto utiliza uma estratégia centralizada e segura de configurações, dividindo as variáveis entre o **Front-end Público (Vite)** e o **Servidor Privado (Node/Express)**. Essa divisão garante a máxima segurança das informações, impedindo que segredos de backend (como chaves de IA ou senhas de SMTP) sejam incluídos no bundle do navegador.

### Ambientes Suportados

A aplicação pode ser executada em quatro ambientes principais, configurados dinamicamente via variável `VITE_APP_ENV` (ou `NODE_ENV` no servidor):

1. **Desenvolvimento (`desenvolvimento`)**: Ambiente local para testes e codificação ativa. Fallbacks locais são habilitados se variáveis críticas estiverem ausentes.
2. **Teste (`teste`)**: Configurações voltadas para execução de suítes de teste de integração e unidade.
3. **Homologação (`homologação`)**: Ambiente idêntico à produção usado para testes de aceitação e staging.
4. **Produção (`produção`)**: Validação extremamente rigorosa de todas as chaves obrigatórias. Qualquer parâmetro em branco ou fictício (placeholder) causará uma falha de inicialização para proteger a integridade do app.

---

## 🔐 Variáveis de Ambiente

Para rodar a aplicação, copie o arquivo `.env.example` para `.env` no diretório raiz e defina as chaves correspondentes.

```bash
cp .env.example .env
```

### 🖥️ Front-end Público (Vite)

Essas variáveis são acessadas exclusivamente via módulo `/services/config.ts` através de `import.meta.env`.

| Variável | Tipo | Obrigatória? | Valor Padrão | Descrição |
| :--- | :---: | :---: | :---: | :--- |
| `VITE_SUPABASE_URL` | `string` | **Sim** | — | URL da API pública do seu projeto no Supabase. |
| `VITE_SUPABASE_ANON_KEY`| `string` | **Sim** | — | Chave anônima pública (anon key) do Supabase. |
| `VITE_APP_ENV` | `string` | Não | `development` | Define o ambiente (`development`, `staging`, `production`, `test`). |
| `VITE_ENABLE_DEMO_DATA` | `boolean`| Não | `false` | Ativa o preenchimento automático de livros de demonstração na UI se a conta estiver vazia. |
| `VITE_MONITORING_ENABLED` | `boolean`| Não | `false` | Ativa o monitoramento de erros no front-end. |
| `VITE_MONITORING_DSN` | `string` | Condicional | — | DSN do serviço de monitoramento (Obrigatório apenas se `VITE_MONITORING_ENABLED=true`). |

### 🛡️ Servidor Privado (Node/Express)

Essas variáveis são lidas no servidor via `/services/serverConfig.ts` e nunca expostas ao front-end.

| Variável | Tipo | Obrigatória? | Valor Padrão | Descrição |
| :--- | :---: | :---: | :---: | :--- |
| `PORT` | `number` | Não | `3000` | Porta na qual o servidor Express roda. |
| `GEMINI_API_KEY` | `string` | Recomendado | — | Chave secreta de IA do Google Gemini no servidor. |
| `GOOGLE_BOOKS_API_KEY`| `string` | Não | — | Chave opcional para consultas de livros na API do Google Books. |
| `EMAIL_ENABLED` | `boolean` | Não | `false` | Habilita o disparo real de e-mails via SMTP. |
| `EMAIL_USER` | `string` | Condicional | — | Conta SMTP de envio de e-mails (Obrigatório se `EMAIL_ENABLED=true`). |
| `EMAIL_PASS` | `string` | Condicional | — | Senha SMTP de envio de e-mails (Obrigatório se `EMAIL_ENABLED=true`). |

---

## 🛠️ Validação e Inicialização Segura (Fail-Fast)

O projeto implementa uma arquitetura **fail-fast** robusta e segura para o gerenciamento de variáveis de ambiente. Qualquer inconsistência ou configuração inválida interromperá imediatamente a inicialização do aplicativo em tempo de compilação ou carregamento de módulo.

* **No Cliente (`/services/config.ts`)**: 
  * Valida de forma estrita `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` e `VITE_MONITORING_DSN` (condicional).
  * A URL do Supabase deve possuir protocolo válido (`http:` ou `https:`), não pode ser um placeholder e não pode estar vazia.
  * A chave pública anon do Supabase deve possuir um formato de JWT válido (ou iniciar com `eyJ`), não pode ser vazia e não pode ser um placeholder.
  * Se o monitoramento estiver ativo (`VITE_MONITORING_ENABLED=true`), a DSN se torna obrigatória e deve ser uma URL válida.
  * Se houver qualquer falha de validação em produção, homologação ou desenvolvimento, um erro é lançado impedindo a inicialização.
* **No Servidor (`/services/serverConfig.ts`)**: 
  * Valida `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `PORT`, `EMAIL_USER` (condicional) e `EMAIL_PASS` (condicional).
  * A porta deve ser um número inteiro válido entre `1` e `65535`.
  * Se as configurações de e-mail estiverem preenchidas (não-placeholders), a validação condicional exige que ambos `EMAIL_USER` e `EMAIL_PASS` sejam válidos e fornecidos, sendo `EMAIL_USER` um e-mail estruturalmente válido.
  * Se o monitoramento de erros estiver ativado, a DSN correspondente é obrigatória e validada.
  * Qualquer inconsistência lançará uma exceção imediata que interrompe a inicialização do servidor.

* **Ambiente de Testes (`teste`)**: Para garantir que os testes de integração e unitários rodem perfeitamente sem depender do arquivo `.env` físico, a validação imediata é suprimida durante a execução de testes, permitindo o isolamento completo de escopos.

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
* **Node.js**: `>=22.19.0` (Necessário para compatibilidade com `undici` e outras dependências)

1. Instale as dependências:
   ```bash
   npm install
   ```

2.Configure o seu arquivo `.env` usando `.env.example` como guia.

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Construa os arquivos estáticos de produção e compile o servidor backend:
   ```bash
   npm run build
   ```

5. Inicie em modo de produção:
   ```bash
   npm run start
   ```
