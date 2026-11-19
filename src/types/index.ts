// ============================================================
// Database Types
// ============================================================

export type UserRole = 'admin' | 'user'
export type AnamneseStatus = 'pendente' | 'respondido'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Anamnese {
  id: string
  user_id: string
  data: AnamneseData
  feedback_admin: string | null
  status: AnamneseStatus
  created_at: string
  updated_at: string
  // Joined
  profiles?: Profile
}

export interface AnamneseData {
  objetivo_principal?: string
  nivel_atividade?: string
  historico_doencas?: string
  medicamentos?: string
  cirurgias?: string
  dores_lesoes?: string
  qualidade_sono?: string
  nivel_estresse?: string
  hidratacao?: string
  alimentacao?: string
  disponibilidade_treino?: string
  observacoes_adicionais?: string
}

export interface AvaliacaoFisica {
  id: string
  user_id: string
  peso: number | null
  altura: number | null
  medidas: Medidas
  dobras_cutaneas: DobrasCutaneas
  percentual_gordura: number | null
  massa_magra: number | null
  imc: number | null
  created_at: string
  // Joined
  profiles?: Profile
}

export interface Medidas {
  braco_d?: number
  braco_e?: number
  cintura?: number
  quadril?: number
  coxa_d?: number
  coxa_e?: number
  peitoral?: number
  panturrilha?: number
}

export interface DobrasCutaneas {
  tricipital?: number
  subescapular?: number
  suprailíaca?: number
  abdominal?: number
  coxa?: number
  peitoral?: number
}

export interface Exercicio {
  nome: string
  series: number
  reps: string
  carga?: string
  observacoes?: string
  /** Bloco do treino; sem valor = 'treino' */
  secao?: 'mobilidade' | 'ativacao' | 'treino'
}

export interface Treino {
  id: string
  user_id: string
  admin_id: string
  titulo: string
  descricao: string | null
  lista_exercicios: Exercicio[]
  data_atribuicao: string
  ativo: boolean
  created_at: string
  // Joined
  profiles?: Profile
}

// ============================================================
// Form Schemas (used with Zod)
// ============================================================

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  full_name: string
}

export interface OnboardingFormData {
  full_name: string
}

export interface AnamneseFormData extends AnamneseData {}

export interface AvaliacaoFormData {
  peso: number
  altura: number
  medidas: Medidas
  dobras_cutaneas: DobrasCutaneas
  percentual_gordura?: number
  massa_magra?: number
}

export interface TreinoFormData {
  user_id: string
  titulo: string
  descricao?: string
  lista_exercicios: Exercicio[]
  data_atribuicao: string
}

// ============================================================
// Dashboard Stats
// ============================================================

export interface DashboardStats {
  totalAnamneses: number
  anamnesesPendentes: number
  totalTreinos: number
  totalAvaliacoes: number
  totalUsers: number
}

// ============================================================
// Dieta & Cardio
// ============================================================
export interface Alimento {
  nome: string
  quantidade?: string
  kcal?: number
  proteina?: number
  carbo?: number
  gordura?: number
}

export interface DietaPlano {
  id: string
  user_id: string
  titulo: string
  meta_kcal: number | null
  meta_proteina: number | null
  meta_carbo: number | null
  meta_gordura: number | null
  agua_litros: number | null
  dias_semana: string
  prescricao: string | null
  observacoes: string | null
  refeicao_livre: string | null
  ativo: boolean
  created_at: string
}

export interface DietaRefeicao {
  id: string
  plano_id: string
  user_id: string
  nome: string
  horario: string | null
  alimentos: Alimento[]
  observacoes: string | null
  ordem: number
  criado_por: string | null
}

export interface DietaCheck {
  id: string
  refeicao_id: string
  user_id: string
  data: string
}

export interface CardioPrescricao {
  id: string
  user_id: string
  tipo: string
  duracao_min: number | null
  frequencia_semana: number | null
  intensidade: string | null
  observacoes: string | null
  ativo: boolean
}

export interface CardioRegistro {
  id: string
  user_id: string
  prescricao_id: string | null
  data: string
  tipo: string
  duracao_min: number | null
  distancia_km: number | null
  calorias: number | null
  intensidade: string | null
  observacoes: string | null
}
