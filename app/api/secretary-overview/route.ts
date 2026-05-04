import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'
import { SecretaryEvent, SecretaryPreferences, SecretaryTask, WorkActivityLog } from '@/app/lib/types'

function daysAgo(dateLike: string | null | undefined) {
  if (!dateLike) return null
  return Math.floor((Date.now() - new Date(dateLike).getTime()) / (1000 * 60 * 60 * 24))
}

function sameDate(dateLike: string, target: string) {
  return dateLike.slice(0, 10) === target
}

export async function GET() {
  const supabase = getServerSupabase()
  const today = new Date().toISOString().slice(0, 10)

  const [preferencesRes, tasksRes, eventsRes, activitiesRes, campaignsRes, goalsRes, prospectsRes] = await Promise.all([
    supabase.from('secretary_preferences').select('*').eq('singleton_key', 'ortu').maybeSingle(),
    supabase.from('secretary_tasks').select('*').order('created_at', { ascending: false }).limit(150),
    supabase.from('secretary_events').select('*').order('created_at', { ascending: false }).limit(12),
    supabase.from('work_activity_log').select('*').eq('activity_date', today).limit(200),
    supabase.from('sales_campaigns').select('*').eq('status', 'activa').limit(20),
    supabase.from('monthly_goals').select('*').eq('status', 'activo').limit(20),
    supabase.from('prospects').select('*').order('updated_at', { ascending: true }).limit(120),
  ])

  const errors = [
    preferencesRes.error,
    tasksRes.error,
    eventsRes.error,
    activitiesRes.error,
    campaignsRes.error,
    goalsRes.error,
    prospectsRes.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0]?.message || 'No pude cargar el resumen del secretario.' }, { status: 500 })
  }

  const preferences = (preferencesRes.data ?? null) as SecretaryPreferences | null
  const tasks = (tasksRes.data ?? []) as SecretaryTask[]
  const events = (eventsRes.data ?? []) as SecretaryEvent[]
  const activities = (activitiesRes.data ?? []) as WorkActivityLog[]
  const campaigns = campaignsRes.data ?? []
  const goals = goalsRes.data ?? []
  const prospects = prospectsRes.data ?? []

  const activeTask = tasks.find((task) => ['pendiente', 'en_progreso'].includes(task.status)) ?? null
  const openTasks = tasks.filter((task) => ['pendiente', 'en_progreso', 'postergada'].includes(task.status)).length
  const last7 = tasks.filter((task) => {
    const diff = daysAgo(task.task_date || task.created_at)
    return diff !== null && diff <= 6
  })
  const completed7d = last7.filter((task) => task.status === 'hecha').length
  const total7d = last7.length
  const completionRate7d = total7d > 0 ? Math.round((completed7d / total7d) * 100) : null
  const completedToday = tasks.filter((task) => task.status === 'hecha' && sameDate(task.updated_at, today)).length

  const contactsDone = activities
    .filter((activity) => ['contacto', 'email', 'linkedin'].includes(activity.type))
    .reduce((sum, activity) => sum + activity.quantity, 0)
  const followUpsDone = activities
    .filter((activity) => activity.type === 'follow_up')
    .reduce((sum, activity) => sum + activity.quantity, 0)
  const proposalsDone = activities
    .filter((activity) => activity.type === 'propuesta')
    .reduce((sum, activity) => sum + activity.quantity, 0)

  const birthdays = prospects
    .filter((prospect) => prospect.birthday)
    .map((prospect) => ({
      prospect_id: prospect.id,
      name: prospect.name,
      company: prospect.company,
      birthday: prospect.birthday as string,
      nextBirthday: new Date(
        new Date().getFullYear(),
        new Date(prospect.birthday as string).getMonth(),
        new Date(prospect.birthday as string).getDate()
      ).getTime(),
    }))
    .filter((prospect) => prospect.nextBirthday >= Date.now() && prospect.nextBirthday <= Date.now() + 14 * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.nextBirthday - b.nextBirthday)
    .slice(0, 3)
    .map((prospect) => ({
      prospect_id: prospect.prospect_id,
      name: prospect.name,
      company: prospect.company,
      birthday: prospect.birthday,
    }))

  const staleProspects = prospects
    .filter((prospect) => prospect.stage !== 'cliente')
    .map((prospect) => ({
      prospect_id: prospect.id,
      name: prospect.name,
      company: prospect.company,
      stage: prospect.stage,
      temperature: prospect.temperature,
      decision_status: prospect.decision_status,
      days_without_contact: daysAgo(prospect.last_contact_at || prospect.updated_at || prospect.created_at) ?? 0,
    }))
    .filter((prospect) => prospect.days_without_contact >= 7)
    .sort((a, b) => b.days_without_contact - a.days_without_contact)
    .slice(0, 4)

  const missingFoundations = [
    goals.length === 0 ? 'Falta cargar al menos un objetivo mensual activo.' : '',
    campaigns.length === 0 ? 'No hay campañas activas para ordenar la prospección.' : '',
    prospects.length < 10 ? 'La base de prospects todavía es chica; conviene seguir alimentándola.' : '',
    openTasks === 0 ? 'No hay misiones activas del secretario.' : '',
  ].filter(Boolean)

  const campaignPulse = {
    activeCount: campaigns.length,
    headline: campaigns[0]
      ? `${campaigns[0].name}: ${campaigns[0].completed_count}/${campaigns[0].target_count} acciones completadas.`
      : 'Sin campañas activas.',
  }

  let coachingNote = 'Una tarea por vez. Cerrá la actual antes de abrir otra.'
  if (preferences?.current_state === 'saturado' || preferences?.energy_mode === 'suave') {
    coachingNote = 'Hoy conviene bajar el peso: una sola acción concreta y después reevaluamos.'
  } else if (completionRate7d !== null && completionRate7d < 40) {
    coachingNote = 'La constancia viene floja. Te conviene reducir ambición y aumentar frecuencia de cierres chicos.'
  } else if (campaigns.length > 0) {
    coachingNote = 'Usá la campaña activa como columna vertebral del día; todo lo demás debería apoyarla.'
  }

  let nextSuggestedStep = 'Definir un segmento principal y cargar 3 contactos nuevos.'
  if (activeTask?.instruction) {
    nextSuggestedStep = activeTask.instruction
  } else if (staleProspects[0]) {
    nextSuggestedStep = `Retomar a ${staleProspects[0].name}${staleProspects[0].company ? ` de ${staleProspects[0].company}` : ''}.`
  } else if (campaigns[0]) {
    nextSuggestedStep = `Mover hoy ${campaigns[0].daily_target} acciones de la campaña ${campaigns[0].name}.`
  }

  return NextResponse.json({
    preferences,
    activeTask,
    completionRate7d,
    completed7d,
    total7d,
    openTasks,
    completedToday,
    dailyTargetProgress: {
      contacts: { done: contactsDone, target: preferences?.daily_contact_target ?? 10 },
      followUps: { done: followUpsDone, target: preferences?.daily_followup_target ?? 3 },
      proposals: { done: proposalsDone, target: preferences?.daily_proposal_target ?? 1 },
    },
    missingFoundations,
    coachingNote,
    nextSuggestedStep,
    birthdays,
    staleProspects,
    campaignPulse,
    recentEvents: events,
  })
}
