# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Profissionais (admin):** personal trainer e nutricionista que acompanham os mesmos alunos no mesmo painel. O personal prescreve treinos e cardio e faz avaliações físicas; a nutricionista monta o plano alimentar. Trabalham principalmente no desktop.
- **Alunos (user):** abrem o app principalmente **na academia, no celular**, durante o treino, para ver o treino do dia e registrar cargas entre as séries. Também marcam refeições e registram cardio.

## Product Purpose

Sophit reúne em um só lugar tudo o que o profissional prescreve e acompanha do aluno: anamnese, avaliação física, treinos com progressão de carga, dieta, cardio e fotos de evolução. Sucesso é o aluno seguir o que foi prescrito (treino feito, refeições marcadas, cardio registrado) e o profissional enxergar essa adesão e a evolução sem juntar dados de vários apps.

## Positioning

Tudo num lugar só: anamnese, avaliação, treino, dieta e cardio do mesmo aluno, prescritos por personal e nutricionista no mesmo painel e seguidos pelo aluno em um único app. Concorrentes focados só em treino (MFit, Tecnofit) ou só em dieta não juntam as duas prescrições nem a avaliação física detalhada.

## Operating Context

- Aluno: celular, uma mão, intervalo entre séries, ambiente de academia (luz variada, pressa, suor). Ações principais: iniciar treino, registrar carga, marcar refeição, registrar cardio.
- Profissional: desktop, rotina de atendimento; cria e reordena treinos, monta plano alimentar, prescreve cardio, lança avaliação física (dobras cutâneas, Pollock 7), responde anamneses e vê relatórios de engajamento.
- Idioma: português do Brasil.

## Capabilities and Constraints

- Stack: Next.js 14 (App Router), Supabase (auth + Postgres com RLS), Tailwind CSS, React Hook Form + Zod, Recharts, Lucide. Deploy na Vercel.
- Papéis: `admin` (profissional) e `user` (aluno), separados por RLS.
- Módulos: anamnese multi-etapas, avaliações físicas, treinos (ordem manual, progressão de carga por exercício), dieta (plano + refeições + check diário; admin e aluno editam), cardio (admin prescreve, aluno registra numa semana seg–dom), fotos de evolução, relatórios.
- Navegação do aluno no celular: barra inferior Início / Prescrições (Treinos, Dieta, Cardio) / Perfil. Desktop mantém a barra lateral.
- Em aberto: distinção formal entre personal e nutricionista no painel (hoje ambos são `admin`).

## Brand Commitments

- Nome: Sophit (antes VitalSync). Logo SVG próprio.
- Identidade em rosa pastel (decisão do dono), usado como acento sobre interface neutra.

## Evidence on Hand

- Dados reais vêm do Supabase de cada profissional; não há depoimentos, números de clientes ou métricas públicas. Não inventar provas sociais.

## Product Principles

1. O aluno na academia vem primeiro: a próxima ação (iniciar treino, registrar carga) precisa estar a um toque, legível com pressa e no celular.
2. Uma prescrição, um lugar: treino, dieta e cardio aparecem juntos e com o mesmo peso para o aluno.
3. Adesão visível: o que foi feito no dia fica evidente para o aluno e para o profissional.
4. O profissional opera rápido: criar, reordenar e editar sem telas de confirmação desnecessárias.

## Accessibility & Inclusion

- Toques de no mínimo 44 px e texto legível com uma mão em movimento; respeitar "reduzir movimento".
