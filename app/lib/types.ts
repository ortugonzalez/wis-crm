export type Stage = 'frio' | 'contactado' | 'reunion' | 'propuesta' | 'cliente'
export type Channel = 'whatsapp' | 'linkedin' | 'email' | 'referido' | 'telegram' | 'otro'
export type ActivityType =
  | 'contacto'
  | 'reunion'
  | 'propuesta'
  | 'nota'
  | 'stage_change'
  | 'follow_up'
  | 'recordatorio'
  | 'mensaje'
export type FollowUpStatus = 'pendiente' | 'hecho'
export type ReminderStatus = 'pendiente' | 'enviado' | 'hecho'
export type ReminderCategory = 'manual' | 'cumpleanos' | 'seguimiento' | 'sugerencia_diaria'
export type Priority = 'baja' | 'media' | 'alta'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageKind = 'text' | 'audio' | 'system'
export type GoalStatus = 'activo' | 'pausado' | 'cumplido' | 'cancelado'
export type GoalTaskStatus = 'pendiente' | 'hecho'
export type GoalTaskCategory =
  | 'contactos'
  | 'emails'
  | 'llamadas'
  | 'propuestas'
  | 'reuniones'
  | 'linkedin'
  | 'scraping'
  | 'estrategia'
  | 'follow_up'
  | 'otro'
export type WorkActivityType =
  | 'contacto'
  | 'email'
  | 'llamada'
  | 'propuesta'
  | 'reunion'
  | 'linkedin'
  | 'scraping'
  | 'follow_up'
  | 'estrategia'
  | 'otro'
export type ScoreSource = 'telegram_closeout' | 'manual' | 'system_preview'

export interface Prospect {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  channel: Channel
  stage: Stage
  source: string
  notes: string | null
  estimated_value: number | null
  birthday: string | null
  last_contact_at: string | null
  next_action_at: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  prospect_id: string
  type: ActivityType
  description: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface FollowUp {
  id: string
  prospect_id: string
  title: string
  notes: string | null
  due_at: string
  status: FollowUpStatus
  priority: Priority
  source: string
  created_at: string
  completed_at: string | null
  updated_at: string
  prospect?: Pick<Prospect, 'id' | 'name' | 'company' | 'stage'>
}

export interface Reminder {
  id: string
  prospect_id: string | null
  title: string
  message: string | null
  remind_at: string
  status: ReminderStatus
  category: ReminderCategory
  created_at: string
  completed_at: string | null
  updated_at: string
  prospect?: Pick<Prospect, 'id' | 'name' | 'company' | 'stage'>
}

export interface RawMessage {
  id: string
  prospect_id: string | null
  source: string
  direction: MessageDirection
  kind: MessageKind
  content: string | null
  telegram_message_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  prospect?: Pick<Prospect, 'id' | 'name' | 'company' | 'stage'>
}

export interface MonthlyGoal {
  id: string
  title: string
  description: string | null
  month: string
  target_value: number
  current_value: number
  unit: string
  business_area: string
  status: GoalStatus
  created_at: string
  updated_at: string
  tasks?: GoalTask[]
}

export interface GoalTask {
  id: string
  goal_id: string | null
  title: string
  description: string | null
  category: GoalTaskCategory
  target_count: number
  completed_count: number
  status: GoalTaskStatus
  due_date: string | null
  created_at: string
  updated_at: string
  goal?: Pick<MonthlyGoal, 'id' | 'title' | 'month'>
}

export interface DailyWorkPlan {
  id: string
  plan_date: string
  summary: string
  priorities: {
    title: string
    reason?: string
    goal_id?: string
    prospect_id?: string
  }[]
  score_start: number | null
  generated_by: string
  created_at: string
}

export interface DailyWorkScore {
  id: string
  score_date: string
  score: number
  source: ScoreSource
  closeout_id: string | null
  contacts_count: number
  follow_ups_done: number
  proposals_sent: number
  meetings_count: number
  goal_progress_points: number
  notes: string | null
  recommendations: string | null
  created_at: string
  updated_at: string
}

export interface DailyCloseout {
  id: string
  closeout_date: string
  raw_text: string
  summary: string | null
  wins: string | null
  blockers: string | null
  tomorrow_focus: string | null
  created_at: string
}

export interface WorkActivityLog {
  id: string
  activity_date: string
  type: WorkActivityType
  quantity: number
  title: string
  notes: string | null
  prospect_id: string | null
  goal_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  prospect?: Pick<Prospect, 'id' | 'name' | 'company' | 'stage'>
  goal?: Pick<MonthlyGoal, 'id' | 'title' | 'month'>
}

export interface SalesCampaign {
  id: string
  name: string
  business_area: string
  target_channel: string
  target_count: number
  completed_count: number
  status: 'activa' | 'pausada' | 'cerrada'
  created_at: string
  updated_at: string
}

export interface MessageTemplate {
  id: string
  name: string
  channel: string
  use_case: string
  body: string
  created_at: string
  updated_at: string
}

export const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: 'frio', label: 'Frio', color: '#6b7280', bg: '#6b728015' },
  { id: 'contactado', label: 'Contactado', color: '#3b82f6', bg: '#3b82f615' },
  { id: 'reunion', label: 'Reunion', color: '#f59e0b', bg: '#f59e0b15' },
  { id: 'propuesta', label: 'Propuesta', color: '#7c3aed', bg: '#7c3aed20' },
  { id: 'cliente', label: 'Cliente', color: '#10b981', bg: '#10b98115' },
]

export const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'email', label: 'Email' },
  { id: 'referido', label: 'Referido' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'otro', label: 'Otro' },
]

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  contacto: 'Contacto realizado',
  reunion: 'Reunion agendada',
  propuesta: 'Propuesta enviada',
  nota: 'Nota agregada',
  stage_change: 'Etapa cambiada',
  follow_up: 'Follow-up creado',
  recordatorio: 'Recordatorio creado',
  mensaje: 'Mensaje registrado',
}

export const PRIORITIES: { id: Priority; label: string; color: string; bg: string }[] = [
  { id: 'baja', label: 'Baja', color: '#6b7280', bg: '#6b728015' },
  { id: 'media', label: 'Media', color: '#f59e0b', bg: '#f59e0b20' },
  { id: 'alta', label: 'Alta', color: '#ef4444', bg: '#ef444420' },
]

export const REMINDER_CATEGORIES: { id: ReminderCategory; label: string }[] = [
  { id: 'manual', label: 'Manual' },
  { id: 'cumpleanos', label: 'Cumpleanos' },
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'sugerencia_diaria', label: 'Sugerencia diaria' },
]

export const GOAL_STATUSES: { id: GoalStatus; label: string }[] = [
  { id: 'activo', label: 'Activo' },
  { id: 'pausado', label: 'Pausado' },
  { id: 'cumplido', label: 'Cumplido' },
  { id: 'cancelado', label: 'Cancelado' },
]

export const GOAL_TASK_CATEGORIES: { id: GoalTaskCategory; label: string }[] = [
  { id: 'contactos', label: 'Contactos' },
  { id: 'emails', label: 'Emails' },
  { id: 'llamadas', label: 'Llamadas' },
  { id: 'propuestas', label: 'Propuestas' },
  { id: 'reuniones', label: 'Reuniones' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'scraping', label: 'Scraping' },
  { id: 'estrategia', label: 'Estrategia' },
  { id: 'follow_up', label: 'Follow-up' },
  { id: 'otro', label: 'Otro' },
]

export const WORK_ACTIVITY_TYPES: { id: WorkActivityType; label: string }[] = [
  { id: 'contacto', label: 'Contacto nuevo' },
  { id: 'email', label: 'Email enviado' },
  { id: 'llamada', label: 'Llamada' },
  { id: 'propuesta', label: 'Propuesta enviada' },
  { id: 'reunion', label: 'Reunion' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'scraping', label: 'Scraping/lista' },
  { id: 'follow_up', label: 'Follow-up hecho' },
  { id: 'estrategia', label: 'Estrategia' },
  { id: 'otro', label: 'Otro' },
]
