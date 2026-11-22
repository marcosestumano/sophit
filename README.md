# Sophit

Plataforma para personal trainers e nutricionistas acompanharem seus alunos em um só lugar: anamnese, avaliação física, treinos com progressão de carga, dieta, cardio e fotos de evolução. O profissional prescreve no painel admin (desktop); o aluno segue tudo pelo celular, inclusive como PWA instalável.

Contexto de produto em [`PRODUCT.md`](PRODUCT.md) e sistema visual em [`DESIGN.md`](DESIGN.md).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Backend / Auth / DB / Storage | Supabase (`@supabase/ssr`), com RLS em todas as tabelas |
| Estilização | Tailwind CSS + CSS Variables, fonte Geist |
| Ícones | Lucide React |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| Datas | date-fns |
| PWA | `src/app/manifest.ts`, `public/sw.js`, `public/offline.html` |

---

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.example .env.local
```

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Só servidor.** Usada para excluir usuários (`/api/admin/delete-user`) |

### 3. Banco de dados

No painel do Supabase → **SQL Editor**, rode os arquivos de `supabase/migrations/` **nesta ordem**:

| Arquivo | O que faz |
|---------|-----------|
| `001_initial_schema.sql` | `profiles`, `anamneses`, `avaliacoes_fisicas`, `treinos`, trigger de novo usuário, RLS, bucket `avatars` |
| `002_treinos_ordem.sql` | Ordem manual dos treinos (drag & drop) |
| `003_dieta_cardio.sql` | Dieta (planos, refeições, checks) e cardio (prescrições, registros) |
| `003b_progressao_fotos_templates.sql` | `progressao_exercicios`, `fotos_progresso`, `treino_templates`, bucket `progress-photos` |
| `004_treinos_mensais.sql` | Planejamento mensal (`mes_referencia`) |
| `005_treino_checks.sql` | Check diário dos exercícios dos blocos |
| `006_blocos_livres.sql` | Blocos de treino livres (título e quantidade definidos pelo profissional) |

Da 002 em diante, todas podem ser rodadas mais de uma vez com segurança. A 001 só roda em banco vazio.

### 4. Google OAuth (opcional)

Supabase → **Authentication → Providers → Google**: ative o provider, crie as credenciais no [Google Cloud Console](https://console.cloud.google.com) e adicione `https://<seu-projeto>.supabase.co/auth/v1/callback` como Redirect URI.

### 5. Criar o primeiro admin

Cadastre-se normalmente pela tela `/register` e depois, no SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'seu-email@exemplo.com';
```

### 6. Rodar

```bash
npm run dev          # http://localhost:3000
npm run type-check   # checagem de tipos
npm run lint
npm run build
```

---

## Rotas

```
/login, /register              Autenticação (email/senha + Google)
/onboarding                    Primeiro acesso
/auth/callback                 Callback OAuth

/dashboard                     Home do aluno (treino do dia, dieta, cardio, peso)
/dashboard/treinos             Treinos do mês, registro de cargas, timer de descanso
/dashboard/treinos/evolucao    Evolução anual das cargas
/dashboard/dieta               Plano alimentar e check de refeições
/dashboard/cardio              Cardio prescrito, cronômetro e registros
/dashboard/progresso           Fotos de progresso (antes/depois)
/dashboard/anamnese[/nova]     Histórico e formulário multi-step
/dashboard/perfil              Perfil e avaliações físicas

/admin                         Painel do profissional (somente role = admin)
/admin/usuarios[/id]           Alunos; perfil com treinos, plano anual, dieta, cardio, avaliação, fotos
/admin/treinos                 Criar/atribuir treinos em blocos + biblioteca de templates
/admin/anamneses[/id]          Inbox de anamneses + feedback
/admin/avaliacoes              Histórico de avaliações físicas
/admin/relatorios              Engajamento e evolução dos alunos

/api/admin/delete-user         Exclusão de usuário (service role)
```

O `middleware.ts` exige login nas rotas privadas; `admin/layout.tsx` exige `role = 'admin'`. As permissões sobre os dados ficam no RLS do Supabase.

## Permissões (RLS)

| Tabela | Aluno | Admin |
|--------|-------|-------|
| `profiles` | Lê/edita o próprio | Tudo |
| `anamneses` | Cria e lê as próprias | Tudo |
| `avaliacoes_fisicas` | Lê as próprias | Tudo |
| `treinos`, `cardio_prescricoes` | Lê os próprios | Tudo |
| `progressao_exercicios`, `treino_checks`, `cardio_registros`, `dieta_*`, `fotos_progresso` | Tudo nos próprios | Tudo |
| `treino_templates` | Sem acesso | Tudo |

## Estrutura

```
src/
├── app/             Rotas (App Router): auth, dashboard (aluno), admin, api
├── components/
│   ├── admin/       Editor de blocos, plano anual, avaliação física, relatórios
│   ├── treinos/     Visão de treinos, descanso, evolução anual
│   ├── dieta/       Editor e visão do plano alimentar
│   ├── cardio/      Prescrição, cronômetro, registros
│   ├── home/        Home do aluno
│   └── app/         Shell, navegação mobile, sheet, registro do PWA
├── lib/             Supabase (client/server/auth), periodização, dieta, datas, validações Zod
├── middleware.ts    Proteção de rotas
└── types/           Tipos compartilhados
supabase/migrations/ Schema do banco
```
