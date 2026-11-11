# BiblioTech Design System & UI Specification
**Versão:** 1.0.0  
**Plataforma:** BiblioTech — Gestor Literário Moderno  
**Tecnologias:** React 19, TypeScript, Tailwind CSS, Motion (Framer Motion)

---

## 1. Filosofia & Princípios Fundamentais

O BiblioTech foi desenhado para proporcionar uma experiência de leitura e organização editorial elegante, livre de clichês superficiais e ruídos de interfaces genéricas geradas por IA ("anti-AI slop").

1. **Estética Editorial & Literária:** Valorizamos a sensação de uma biblioteca clássica traduzida para a modernidade digital.
2. **Zero-Pill & Disciplina de Metadados:** Rótulos informativos estáticos (como páginas, categorias, datas e tags) não devem ser encapsulados em cápsulas ou pílulas coloridas artificiais. Usamos texto limpo acompanhado de separadores tipográficos discretos (`·` ou `/`).
3. **Equilíbrio Espacial & Matemática de Padding:** 
   - Controles interativos seguem a proporção de padding horizontal $\approx 2 \times$ padding vertical (ex.: `py-2.5 px-5` ou `py-3 px-6`).
   - Raio de curvatura interno obedece à equação: $r_{\text{inner}} = r_{\text{outer}} - \text{padding}$.
4. **Acessibilidade Inegociável (WCAG AA/AAA):** Textos normais garantem contraste $\ge 4.5:1$ e textos grandes/títulos $\ge 3:1$ tanto em modo claro quanto escuro.
5. **Micro-interações Táteis:** Todo elemento interativo reage aos cliques com `active:scale-95`, transições fluídas de `150ms` a `300ms` e anéis de foco acessíveis (`focus-visible:ring-4 focus-visible:ring-primary/20`).

---

## 2. Tokens de Design (Design Tokens)

### 2.1 Paleta de Cores da Marca

| Token Tailwind | HEX | Função no Sistema | Contraste WCAG |
| :--- | :--- | :--- | :--- |
| `primary` | `#274C68` | Azul Naval Prussiano. Usado em cabeçalhos, botões principais e identidade. | AAA (11.8:1 contra branco) |
| `secondary` | `#FFFFFF` | Branco Puro. Superfície de cartões claros e fundos. | Base |
| `tertiary` / `accent` | `#05A0E6` | Ciano Literário. Usado em ações de IA, indicadores ativos e badges. | AA (3.8:1 texto grande) |
| `background` | `#FFFFFF` | Fundo principal em Light Mode. | Base |
| `border-light` | `#E2E8F0` | Divisores e bordas sutis no modo claro (Slate 200). | Estrutural |

### 2.2 Modo Escuro (Dark Mode Tokens)

| Token Tailwind | HEX | Função no Sistema |
| :--- | :--- | :--- |
| `dark:bg-slate-900` | `#0F172A` | Fundo geral da aplicação (Canvas). |
| `dark:bg-slate-800` | `#1E293B` | Superfície de cartões, modais e gavetas. |
| `dark:border-slate-800` | `#1E293B` | Bordas e divisores estruturais sutis. |
| `dark:text-slate-50` | `#F8FAFC` | Texto de alta prioridade (Títulos). |
| `dark:text-slate-400` | `#94A3B8` | Metadados, subtítulos e textos secundários. |

### 2.3 Status Semânticos do Ciclo de Leitura

O ciclo de vida dos livros é categorizado em 5 estados canônicos, cada um com paleta específica para Light e Dark mode:

```ts
export enum BookStatus {
  Reading = 'Lendo atualmente', // Azul (#2563EB)
  TBR = 'Não lido',             // Âmbar (#D97706)
  Read = 'Lido',                 // Verde Esmeralda (#16A34A)
  Wishlist = 'Lista de Desejos', // Rosa / Pink (#DB2777)
  Dropped = 'Abandonado',        // Ardósia / Slate (#64748B)
}
```

- **Lendo (`BookStatus.Reading`):** `bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400`
- **Quero Ler (`BookStatus.TBR`):** `bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400`
- **Lidos (`BookStatus.Read`):** `bg-green-50 text-green-600 border-green-100 dark:bg-green-950/40 dark:text-green-400`
- **Wishlist (`BookStatus.Wishlist`):** `bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-950/40 dark:text-pink-400`
- **Abandonado (`BookStatus.Dropped`):** `bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400`

---

## 3. Tipografia & Escala Hierárquica

O sistema utiliza duas famílias tipográficas complementares carregadas no HTML:

- **Display & Títulos:** `font-serif` (`'Lora', serif`)  
  Pesos: `font-bold` (700) e `font-black` (900), quase sempre estilizado com itálico suave (`italic`) e rastreamento compacto (`tracking-tight`).
- **Interface & Dados:** `font-sans` (`'Inter', sans-serif`)  
  Pesos: `font-normal` (400), `font-medium` (500), `font-bold` (700), `font-black` (900).

### Escala de Tamanhos Recomendada

| Nível | Classes Tailwind | Uso Primário |
| :--- | :--- | :--- |
| **Hero Title (H1)** | `text-3xl sm:text-4xl font-serif font-black italic tracking-tight` | Título da visualização ativa / Estante principal |
| **Section Title (H2)**| `text-2xl font-serif font-black text-slate-900 dark:text-slate-50` | Cabeçalhos de blocos e seções |
| **Card Title (H3)** | `text-xl font-serif font-black italic text-slate-900 dark:text-slate-50` | Nome do livro ou obra |
| **Subtítulo / Autor**| `text-sm font-sans font-bold text-slate-500 dark:text-slate-400` | Linha de autor de livro (`de Machado de Assis`) |
| **Corpo (Sinopse)** | `text-sm font-sans font-medium leading-relaxed text-slate-600` | Resumos, resenhas e anotações pessoais |
| **Micro-copy** | `text-[9px] sm:text-[10px] font-sans font-black uppercase tracking-widest` | Rótulos de formulário, kickers e indicadores |

---

## 4. Componentes Canônicos

### 4.1 Botões

```tsx
// Primário (Navy)
<button className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95">
  Salvar Livro
</button>

// Assistido por IA (Cyan)
<button className="px-6 py-3 bg-tertiary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center gap-2">
  <SparklesIcon className="w-4 h-4" />
  Gerar Sinopse com IA
</button>

// Secundário / Cancelar
<button className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
  Cancelar
</button>
```

### 4.2 Metadados sem Pílulas (Zero-Pill Rule)

```tsx
// ✅ Correto: Separadores tipográficos discretos
<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
  <span className="font-bold text-primary dark:text-cyan-400">Romance</span>
  <span aria-hidden="true">·</span>
  <span>320 págs</span>
  <span aria-hidden="true">·</span>
  <span>Publicado em 2026</span>
</div>
```

### 4.3 Campos de Entrada (Form Controls)

```tsx
<div className="space-y-2">
  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
    Título da Obra
  </label>
  <input
    type="text"
    placeholder="Ex: Cem Anos de Solidão"
    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
  />
</div>
```

### 4.4 Modais & Diálogos

- Superfície do Modal: `bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800`
- Backdrop: `fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 p-4`
- Cabeçalho: `p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center`

---

## 5. Diretrizes Anti-Slop & O que Evitar

- ❌ **Evitar pílulas empilhadas em metadados:** Não colocar tags coloridas redondas para cada campo de texto informativo.
- ❌ **Evitar títulos com sintaxe de código:** Não use `// 01 SEÇÃO` ou `# SECTION`.
- ❌ **Evitar bordas esquerdas grossas de destaque (`border-l-4`):** Use divisores de linha sutis ou cards completos.
- ❌ **Evitar botões sem resposta táctil:** Sempre inclua `active:scale-95` e estados de foco.

---

## 6. Acesso ao Design System na Aplicação

O Design System conta com uma tela viva e interativa embutida no aplicativo, acessível através da aba **Mais > 🎨 Design System** ou pelo painel do usuário, permitindo testar componentes e copiar tokens com um clique.
