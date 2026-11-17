---
name: Sophit
description: App de treino, dieta e cardio do aluno e painel do profissional, em interface neutra com rosa pastel como acento.
colors:
  ground: "#f8f3f2"
  surface: "#fffdfc"
  surface-muted: "#f1e7e6"
  ink: "#2c2325"
  ink-muted: "#6d6566"
  hairline: "#dcd5d4"
  rose: "#e8799f"
  rose-hover: "#e0688f"
  rose-text: "#a3405f"
  dieta: "#3f7a52"
  cardio: "#3a68a8"
  rose-strong: "#d45f88"
  destructive: "#b3261e"
  warning-bg: "#fbefd5"
  warning-ink: "#7a4a0c"
  warning-bg-dark: "rgb(120 74 12 / 0.35)"
  warning-ink-dark: "#f6d28c"
  amber: "#c98a1b"
  scrim: "rgba(44,35,37,0.45)"
  lightbox: "rgba(0,0,0,0.92)"
  panel: "#2c2325"
  panel-raised: "#3a3032"
  panel-ink: "#f8f3f2"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  page:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  heading:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  section:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  small:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0em"
  wordmark:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "4rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
rounded:
  control: "12px"
  tile: "16px"
  card: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.rose-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  summary-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.panel-ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  day-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    width: "42px"
    height: "72px"
  day-chip-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
---

# Design System: Sophit

## Overview

Sophit é usado com pressa: o aluno abre no celular, na academia, entre uma série e outra. Por isso a interface é quase toda neutra (fundo off-white quente, tinta quase-preta) e deixa a cor para o que importa no momento: a próxima ação e o que já foi feito no dia. O rosa pastel da marca é acento, nunca fundo. Cada tela do aluno tem um único bloco escuro, o resumo do dia, que é o ponto de leitura principal. No painel do profissional (desktop), a mesma linguagem fica mais densa e operacional.

## Colors

- **Neutros (90–95% da tela):** `ground` como fundo, `surface` para cartões, `surface-muted` para chips e blocos internos, `hairline` para bordas de 1 px. Texto em `ink`; texto secundário em `ink-muted` (5,3:1 sobre o fundo).
- **Rosa (`rose`):** só no botão principal (com texto `ink`, nunca branco), no item ativo da navegação, no avatar, no treino da vez e no anel de foco. Rosa como texto usa `rose-text` (5,7:1), porque o rosa claro não tem contraste para leitura.
- **Categorias:** treino = `rose`, dieta = `dieta` (verde), cardio = `cardio` (azul). Aparecem em pontos do calendário, barras de progresso e chips de ícone com fundo a ~15% de opacidade.
- **Painel escuro:** `panel`/`panel-raised`/`panel-ink`, apenas no resumo do dia. No tema escuro ele se inverte para claro.
- **Estados e apoio:** `destructive` para excluir e erros; `warning-*` só no selo "pendente"; `amber` como quarta série de gráfico; `rose-strong` no anel de foco e no ponto ativo de gráfico; `scrim` atrás de modais; `lightbox` só no visualizador de fotos.
- **Proibido:** violeta, lilás e degradês (inclusive em botões e texto).

## Typography

Outfit, só nos pesos 400 e 500. Rampa: 44 (número), 34 (título de tela do app), 32 (título de página no desktop), 28 (título compacto e números secundários), 22 (seção), 16 (corpo), 14 (apoio), 13 (rótulo); 64 só na marca da tela de abertura. Títulos em 400 com tracking negativo; o peso nunca carrega hierarquia sozinho: tamanho e espaçamento carregam. Rótulos em 13 px / 500, em caixa normal (sem caixa alta espaçada). Texto de leitura em 16 px; nada abaixo de 13 px. Números grandes (kcal, minutos, peso) usam `display`.

## Layout

- Celular primeiro: margem lateral de 24 px, coluna única, barra inferior fixa de 80 px (Início / Prescrições / Perfil) com folga de `safe-area`.
- Desktop: barra lateral à esquerda, conteúdo com largura máxima e grade fluida.
- Ritmo: grupos apertados (8–12 px), seções separadas por 32 px, mais espaço acima de um título do que abaixo.
- Toques de no mínimo 44 px em tudo que é clicável fora de texto corrido.

## Elevation & Depth

Plano. Profundidade vem de fio de 1 px e de contraste de superfície, não de sombra. Sombras só em menus flutuantes e no painel deslizante de Prescrições.

## Shapes

Raio único por tipo de elemento: controles 12 px, chips/tiles 16 px, cartões e painéis 24 px, pílulas 999 px. Ícones Lucide com traço 1,75.

## Components

- **Botão principal:** rosa, texto `ink`, 48 px de altura no app (44 px mínimo), um por tela. Sobe 1 px no hover e afunda (1 px, escala 0,985) ao clicar.
- **Botão secundário:** superfície clara com fio de 1 px.
- **Cartão:** `surface`, fio de 1 px, raio 24. Cartões clicáveis sobem 2 px no hover. Nunca cartão dentro de cartão.
- **Resumo do dia:** painel escuro com número grande, barra de progresso e alternador de 3 ícones (treino/dieta/cardio).
- **Chip de dia:** 42 × 72 px com dia, número e pontos de categoria; o selecionado fica em `ink`, o de hoje ganha borda rosa.
- **Check de refeição:** círculo de 44 px; feito = verde cheio com ✓ desenhado (SVG).
- **Painel inferior (sheet):** modal de baixo para cima no celular, centralizado no desktop.

## Do's and Don'ts

- **Faça:** um botão cheio por tela; rosa só como acento; texto ≥ 16 px para leitura; foco visível em rosa; respeitar "reduzir movimento".
- **Faça:** uma entrada animada por tela (o título), transições de 150 ms com ease-out.
- **Não faça:** degradês, texto em degradê, violeta/lilás, peso 600/700, caixa alta espaçada, emoji como ícone, rótulo "kicker" acima de títulos, borda colorida grossa na lateral de cartões, sombras decorativas, conteúdo que aparece ao rolar.
