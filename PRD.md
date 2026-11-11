# Documento de Requisitos do Produto (PRD) — BiblioTech

**Nome do Produto:** BiblioTech — Gestor Literário Moderno  
**Versão:** 1.0.0 (Produção Full-Stack)  
**Status:** Implementado & Em Produção  
**Público-Alvo:** Leitores assíduos, colecionadores de livros, HQs e mangás, clubes do livro e entusiastas de literatura  
**Última Atualização:** Novembro de 2026  

---

## 1. Visão Geral e Proposta de Valor

O **BiblioTech** é uma plataforma full-stack moderna de gestão literária e catalogação de acervos pessoais. Ele une o rigor e a estética clássica de bibliotecas editoriais à conveniência de ferramentas de última geração: reconhecimento óptico e inteligência artificial multimodal (Google Gemini), escaneamento de código de barras ISBN via câmera, arquitetura *offline-first* resiliente com sincronização em nuvem (Supabase PostgreSQL), acompanhamento de metas, diário de bordo e comunidade interativa de leitores.

### 1.1 Objetivos de Negócio & Produto
- **Centralização:** Permitir que leitores organizem livros físicos, digitais, histórias em quadrinhos (HQs) e mangás em um único ambiente intuitivo.
- **Automação de Entrada:** Reduzir o tempo de cadastro de novas obras de minutos para segundos por meio de preenchimento automático via ISBN (Brasil API e Google Books) e reconhecimento de fotos de capa por visão computacional com IA.
- **Engajamento & Consistência:** Aumentar a cadência de leitura por meio de metas anuais, desafios gamificados, cálculo de ritmo de leitura e diário de pensamentos.
- **Privacidade & Confiabilidade:** Garantir que o usuário nunca perca seus dados, operando perfeitamente sem internet (local-first) com reconciliação assíncrona com banco de dados na nuvem com Row Level Security (RLS).

---

## 2. Personas de Usuário

| Persona | Perfil | Dores Principais | Solução BiblioTech |
| :--- | :--- | :--- | :--- |
| **Helena, a Colecionadora** | Possui mais de 500 livros físicos, HQs e edições especiais | Dificuldade em lembrar quais volumes de sagas já comprou e onde estão guardados | Módulo de Séries/Coleções com numeração de volumes, controle de localização física e itens lacrados/autografados. |
| **Rodrigo, o Leitor de Metas** | Lê cerca de 25 livros por ano e participa de maratonas | Falta de estatísticas detalhadas de velocidade de leitura e páginas lidas | Dashboard com gráficos por gênero, formato, dias para terminar e histórico cronológico com badges. |
| **Camila, a Entusiasta Prática** | Compra livros em sebos e livrarias de rua | Preguiça de digitar manualmente títulos, autores e sinopses | Leitor de código de barras via câmera do celular e escaneamento fotográfico por IA com 1 toque. |

---

## 3. Arquitetura do Sistema & Stack Tecnológica

### 3.1 Camadas do Sistema
- **Frontend SPA:** React 19, TypeScript, Tailwind CSS, Vite, Motion (animações táteis fluidas).
- **Backend / API Gateway:** Node.js, Express, TypeScript, arquitetura de middlewares seguros, rate limiting adaptativo para IA.
- **Banco de Dados & Autenticação:** Supabase (PostgreSQL 15), autenticação JWT, Row Level Security (RLS), Storage para avatares e capas.
- **Inteligência Artificial:** SDK `@google/genai` (Google Gemini 2.5 Flash), visão computacional multimodal, geração de resumos, recomendações contextuais e análise preditiva de hábitos literários.
- **Provedores de Metadados:** Brasil API (Câmara Brasileira do Livro - CBL), Google Books API com proxies redundantes.

### 3.2 Diagrama de Fluxo de Dados
```text
[Usuário / Câmera]
       │
       ▼
[React 19 SPA (Client)] ──(Offline First)──> [LocalStorage Cache & Pending Queue]
       │                                                      │
 (Auth / Sync)                                        (Auto Reconnect)
       ▼                                                      ▼
[Express Backend / API Gateway] ───────────────────> [Supabase PostgreSQL (RLS)]
       │
       ├──> [Google Gemini AI API (Multimodal OCR & Insights)]
       ├──> [Brasil API / CBL (ISBN Nacional)]
       └──> [Google Books API (Metadados Globais)]
```

---

## 4. Módulos e Requisitos Funcionais Implementados

### 4.1 Autenticação, Perfis & Segurança
- **RF01 - Autenticação Segura:** Cadastro de conta, login com e-mail/senha, logout e recuperação de senha via Supabase Auth.
- **RF02 - Perfil do Leitor:** Edição de nome completo, e-mail de contato, meta de leitura anual personalizada e foto de avatar com corte e compressão automática no cliente.
- **RF03 - Segurança de Dados:** Troca de senha autenticada, confirmação de alteração de e-mail e isolamento estrito de registros via políticas RLS (`auth.uid() = user_id`).
- **RF04 - Exportação & Backup:** Download completo do acervo em formato JSON estruturado e CSV compatível com planilhas; importação em lote com deduplicação.

### 4.2 Gestão de Acervo & Estante Virtual (`BookList` / `ShelfView`)
- **RF05 - Ciclo de Vida da Obra:** Suporte a 5 status canônicos com cores semânticas exclusivas:
  - *Lendo atualmente* (Azul)
  - *Não lido / Quero Ler* (Âmbar)
  - *Lido* (Verde Esmeralda)
  - *Lista de Desejos* (Rosa/Pink)
  - *Abandonado* (Slate)
- **RF06 - Tipologia de Obras:** Classificação entre Livro Tradicional, HQ (História em Quadrinhos) e Mangá.
- **RF07 - Visualizações Flexíveis:** Alternância entre visualização em Grade (Shelf Bento Card com capas e barras de progresso) e Lista Densa tabular.
- **RF08 - Filtragem & Pesquisa:** Filtro por texto livre, gênero literário, status de leitura, tipo de publicação e livros físicos vs. digitais.
- **RF09 - Sorteio da Próxima Leitura (*Random Pick*):** Modal inteligente com animação que seleciona aleatoriamente uma obra com status "Não lido" para combater a paralisia de escolha.

### 4.3 Cadastro Inteligente & Preenchimento Automático (`AddBookModal`)
- **RF10 - Consulta Automática por ISBN:** Digitação do código ISBN-10 ou ISBN-13 com resolução instantânea de título, autores, número de páginas, categorias e sinopse via Brasil API (CBL) e Google Books.
- **RF11 - Leitor de Código de Barras via Câmera:** Escaneamento direto pela câmera do smartphone ou webcam com biblioteca de visão contínua sem necessidade de periféricos externos.
- **RF12 - Escaneamento Fotográfico de Capa (IA Multimodal):** Fotografia ou upload da capa do livro processada pelo Gemini AI para extrair título, autor, volume e sinopse automaticamente.
- **RF13 - Geração Assistida de Sinopse:** Botão dedicado que utiliza IA para sintetizar e redigir resumos atrativos em português caso a obra não possua sinopse cadastrada.
- **RF14 - Ficha Catalográfica de Colecionador:** Registro opcional de:
  - Condição da obra (Novo, Seminovo, Usado, Raro)
  - Localização física (Ex: "Estante Sala - Prateleira 2")
  - Loja de compra, preço estimado e preço pago
  - Detalhes de edição (Número da edição, Edição limitada, Primeira edição, Autografado, Lacrado, Capa variante)
  - Vínculos entre livros relacionados.

### 4.4 Modal de Detalhes da Obra (`BookDetailsModal`)
- **RF15 - Ficha Completa da Obra:** Exibição elegante do título, autor, gênero, páginas, avaliação em estrelas e links de compra externos.
- **RF16 - Edição Rápida de Sinopse:** Adição e edição direta de sinopse no próprio modal de detalhes, com suporte a geração por IA instantânea.
- **RF17 - Transição de Status em 1 Clique:** Atualização de status com preenchimento automático da data de início e de conclusão (`dateStarted` e `dateFinished`).
- **RF18 - Notas Pessoais & Notas Rápidas:** Registro de anotações com número da página de referência (ex: "Pág. 142: citação marcante").

### 4.5 Coleções, Séries & Sagas (`SeriesView`)
- **RF19 - Agrupamento por Série:** Criação de coleções (ex: "Harry Potter", "Sandman", "Berserk") com definição de total de volumes planejados.
- **RF20 - Validação de Numeração:** Validação automática para impedir volumes duplicados ou edições superiores ao teto da série.
- **RF21 - Navegação Cruzada:** A partir do detalhe de um livro, o sistema exibe carrossel com todos os demais volumes daquela coleção presentes na estante.

### 4.6 Diário de Leitura (`ReadingJournal`)
- **RF22 - Registro Cronológico de Reflexões:** Diário dedicado para pensamentos durante o processo de leitura, reflexões por capítulo e citações marcantes vinculadas aos livros da biblioteca.

### 4.7 Gestão de Empréstimos (`LoansView` & Backend de Empréstimos)
- **RF23 - Controle de Obras Emprestadas:** Cadastro do nome do amigo/familiar, data do empréstimo, data prevista para devolução e status do livro.
- **RF24 - Endpoints REST Dedicados:** `POST /api/loans` e `PATCH /api/loans/:id/return` com validação de posse da obra e transação atômica.

### 4.8 Histórico & Métricas Temporais (`HistoryView`)
- **RF25 - Linha do Tempo de Conclusões:** Agrupamento de livros lidos por ano e mês.
- **RF26 - Ritmo de Leitura:** Cálculo de dias decorridos para finalizar cada livro e média ponderada de páginas lidas por dia.
- **RF27 - Releituras:** Contador de quantas vezes uma mesma obra foi relida.

### 4.9 Estatísticas, Metas & Insights de IA (`Dashboard` & `StatsView`)
- **RF28 - Painel de Métricas:** Contador de livros lidos, total de páginas no ano, consistência diária e percentual da meta anual atingida.
- **RF29 - Gráficos Analíticos:**
  - Gráfico de leitura mensal (Janeiro a Dezembro)
  - Gráfico de barras por gênero literário
  - Gráfico de pizza por tipo (Livro vs. HQ vs. Mangá)
  - Distribuição percentual do acervo por status
- **RF30 - Painel de Insights Preditivos por IA (`/api/ai-insights`):** Diagnóstico inteligente que analisa os gêneros favoritos do usuário, sugere autores complementares e estima se a meta anual será atingida com base no ritmo atual.

### 4.10 Comunidade Literária & Social (`CommunityView`)
- **RF31 - Feed Compartilhado:** Compartilhamento opcional de livros concluídos com nota (1 a 5 estrelas), resenha e foto de perfil.
- **RF32 - Filtro Anti-Spoiler:** Flag explícita `contem_spoiler` que oculta o texto da resenha até que o leitor clique conscientemente para revelar.
- **RF33 - Adição Social à Wishlist:** Botão no card da comunidade que permite importar a obra resenhada diretamente para a Lista de Desejos do próprio usuário.

### 4.11 Exploração Global (`BookSearch`)
- **RF34 - Catálogo Mundial Google Books:** Busca aberta por milhões de obras com exibição de autores, páginas, editora, data de publicação e importação para a estante em 1 clique.

### 4.12 Gamificação & Desafios (`ReadingChallenges`)
- **RF35 - Desafios Temáticos:** Desafios integrados como "Clássicos da Literatura Brasileira", "Ficção Científica Essencial", além da criação de desafios personalizados com regras e contadores próprios.
- **RF36 - Conquistas Literárias:** Desbloqueio automático de medalhas (ex: "Devorador de Livros", "Maratonista de Páginas", "Colecionador Dedicado").

### 4.13 Design System & Guia de Estilo (`DesignSystemView`)
- **RF37 - Guia Vivo da Plataforma:** Tela com visualização interativa de cores, tipografia (Lora/Inter), biblioteca de botões, inputs, cards e playground em tempo real com gerador de código Tailwind.

---

## 5. Requisitos Não-Funcionais (RNF)

| Identificador | Categoria | Requisito |
| :--- | :--- | :--- |
| **RNF01** | **Arquitetura Offline-First** | Todas as ações de criação, edição e exclusão devem operar localmente no `localStorage` sem travar caso a conexão falhe, sincronizando com a nuvem assincronamente assim que a rede restabelecer. |
| **RNF02** | **Desempenho & Lazy Loading** | Carregamento inicial do pacote JavaScript otimizado via `React.lazy` e `Suspense`. Tempo de resposta dos endpoints de proxy menor que 500ms (P95). |
| **RNF03** | **Acessibilidade (a11y)** | Aderência aos critérios WCAG 2.1 nível AA: contraste de cor mínimo de 4.5:1 para textos corporais, suporte total à navegação por teclado e foco visível em todos os botões e links. |
| **RNF04** | **Segurança & Mascaramento de Dados** | Nenhum dado sensível de logs (senhas, chaves de API, tokens de acesso) deve ser exposto na saída do console do servidor. Sanitização estrita em `serverLogger.ts`. |
| **RNF05** | **Rate Limiting & Resiliência** | Proteção com rate limit inteligente nos endpoints de IA para evitar abusos de quota, retornando códigos HTTP padronizados (`429 Too Many Requests`). |
| **RNF06** | **Responsividade Universal** | Layout totalmente responsivo para resoluções de 320px (smartphones compactos) até 2560px (monitores ultra-wide), com barra inferior ergonômica em telas móveis e cabeçalho fixo no desktop. |

---

## 6. Modelo de Dados Relacional (PostgreSQL)

### 6.1 Tabelas Principais
- **`books`**: Título, autor, páginas, gênero, tipo, status, avaliação, sinopse, notas pessoais, tags, preços, página atual, datas (adicionado, iniciado, finalizado), volume, edição, flags colecionáveis (autografado, lacrado, etc.), vínculos e chave estrangeira `user_id`.
- **`series`**: Nome da coleção, total de volumes planejados e `user_id`.
- **`profiles`**: Nome completo, avatar URL, meta de leitura anual, tags customizadas e `id` (chave estrangeira de `auth.users`).
- **`loans`**: Vínculo com `book_id`, `borrower_name`, `loan_date`, `due_date`, `return_date`, `status` e `user_id`.
- **`community_posts`**: Resenhas públicas, notas, flag de spoiler, dados do livro e relacionamento com o perfil do leitor.
- **`stories`**: Anotações e narrativas do diário de leitura.

---

## 7. Métricas de Sucesso do Produto (KPIs)
1. **Taxa de Conclusão de Leitura:** Percentual de livros movidos de "Lendo" para "Lido" em relação ao acervo ativo.
2. **Tempo Médio de Catalogação:** Redução do tempo de inserção de uma obra para menos de 10 segundos utilizando ISBN ou leitor de capa.
3. **Aderência à Meta:** Porcentagem de usuários que atingem ou superam a meta anual de leitura estabelecida.
4. **Resiliência Offline:** Zero registros perdidos em interrupções temporárias de conectividade.
