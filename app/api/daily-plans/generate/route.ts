import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export async function POST() {
  const supabase = getServerSupabase()

  const [goalsRes, tasksRes, followUpsRes, remindersRes, prospectsRes, scoreRes] = await Promise.all([
    supabase.from('monthly_goals').select('*').eq('status', 'activo').limit(20),
    supabase.from('goal_tasks').select('*').eq('status', 'pendiente').limit(30),
    supabase.from('follow_ups').select('*, prospect:prospects(id, name, company, stage)').eq('status', 'pendiente').limit(20),
    supabase.from('reminders').select('*, prospect:prospects(id, name, company, stage)').eq('status', 'pendiente').limit(20),
    supabase.from('prospects').select('*').neq('stage', 'cliente').order('updated_at', { ascending: true }).limit(20),
    supabase.from('crm_work_score_today').select('*').single(),
  ])

  const goals = goalsRes.data ?? []
  const tasks = tasksRes.data ?? []
  const followUps = followUpsRes.data ?? []
  const reminders = remindersRes.data ?? []
  const prospects = prospectsRes.data ?? []
  const score = scoreRes.data?.score ?? 0

  const mainGoal = goals[0]
  const thirdPriority =
    reminders[0]?.title ||
    (prospects[0] ? `Reactivar a ${prospects[0].name}` : 'Definir un canal de prospeccion para esta semana')

  const priorities = [
    tasks[0]?.title || followUps[0]?.title || 'Cargar una tarea palanca concreta para el objetivo principal',
    followUps[0]?.prospect ? `Hacer follow up a ${followUps[0].prospect.name}` : tasks[1]?.title || 'Crear 10 contactos nuevos del segmento objetivo',
    thirdPriority,
  ]

  const summary = [
    'Agenda de hoy',
    '',
    'Objetivo del mes:',
    mainGoal ? `- ${mainGoal.title} (${mainGoal.current_value}/${mainGoal.target_value} ${mainGoal.unit})` : '- Falta cargar al menos 1 objetivo mensual activo.',
    '',
    'Hoy si o si:',
    `1. ${priorities[0]}`,
    `2. ${priorities[1]}`,
    `3. ${priorities[2]}`,
    '',
    `Score operativo de arranque: ${score}/100`,
    '',
    'Para cerrar bien el dia:',
    '- Registrar por Telegram que hiciste hoy para calcular el score final.',
  ].join('\n')

  const { data, error } = await supabase
    .from('daily_work_plans')
    .insert([{
      plan_date: today(),
      summary,
      priorities: priorities.map((title) => ({ title })),
      score_start: score,
      generated_by: 'crm_manual',
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
