import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export async function POST() {
  const supabase = getServerSupabase()

  const [goalsRes, tasksRes, followUpsRes, remindersRes, prospectsRes, scoreRes, preferencesRes, campaignsRes] = await Promise.all([
    supabase.from('monthly_goals').select('*').eq('status', 'activo').limit(20),
    supabase.from('goal_tasks').select('*').eq('status', 'pendiente').limit(30),
    supabase.from('follow_ups').select('*, prospect:prospects(id, name, company, stage)').eq('status', 'pendiente').limit(20),
    supabase.from('reminders').select('*, prospect:prospects(id, name, company, stage)').eq('status', 'pendiente').limit(20),
    supabase.from('prospects').select('*').neq('stage', 'cliente').order('updated_at', { ascending: true }).limit(20),
    supabase.from('crm_work_score_today').select('*').single(),
    supabase.from('secretary_preferences').select('*').eq('singleton_key', 'ortu').maybeSingle(),
    supabase.from('sales_campaigns').select('*').eq('status', 'activa').limit(10),
  ])

  const goals = goalsRes.data ?? []
  const tasks = tasksRes.data ?? []
  const followUps = followUpsRes.data ?? []
  const reminders = remindersRes.data ?? []
  const prospects = prospectsRes.data ?? []
  const score = scoreRes.data?.score ?? 0
  const preferences = preferencesRes.data ?? null
  const campaigns = campaignsRes.data ?? []

  const mainGoal = goals[0]
  const staleProspect = prospects[0]
  const activeCampaign = campaigns[0]
  const contactTarget = preferences?.daily_contact_target ?? 10
  const followupTarget = preferences?.daily_followup_target ?? 3
  const proposalTarget = preferences?.daily_proposal_target ?? 1
  const gentleMode = preferences?.energy_mode === 'suave' || preferences?.current_state === 'saturado'

  const priorities = [
    tasks[0]?.title ||
      followUps[0]?.title ||
      (activeCampaign ? `Mover ${activeCampaign.daily_target} acciones de ${activeCampaign.name}` : `Completar ${followupTarget} follow-up${followupTarget === 1 ? '' : 's'} con siguiente paso claro`),
    followUps[0]?.prospect
      ? `Hacer follow up a ${followUps[0].prospect.name}`
      : tasks[1]?.title ||
        (gentleMode ? `Sumar solo 3 contactos nuevos del segmento clave` : `Crear ${contactTarget} contactos nuevos del segmento objetivo`),
    reminders[0]?.title ||
      (staleProspect ? `Reactivar a ${staleProspect.name}` : `Generar ${proposalTarget} propuesta${proposalTarget === 1 ? '' : 's'} nueva${proposalTarget === 1 ? '' : 's'}`),
  ]

  const opening = gentleMode
    ? `Hoy vamos liviano, ${preferences?.display_name || 'Ortu'}: una acción principal y dos apoyos chicos.`
    : `Hoy la idea es avanzar sin sobrecargarte: una prioridad central y dos acciones complementarias.`

  const summary = [
    'Agenda de hoy',
    '',
    opening,
    '',
    'Objetivo del mes:',
    mainGoal ? `- ${mainGoal.title} (${mainGoal.current_value}/${mainGoal.target_value} ${mainGoal.unit})` : '- Falta cargar al menos 1 objetivo mensual activo.',
    '',
    preferences?.current_focus ? `Foco declarado: ${preferences.current_focus}` : 'Foco del día: mover el negocio con acciones concretas.',
    '',
    'Hoy si o si:',
    `1. ${priorities[0]}`,
    `2. ${priorities[1]}`,
    `3. ${priorities[2]}`,
    '',
    `Score operativo de arranque: ${score}/100`,
    '',
    'Para cerrar bien el dia:',
    `- Registrar por Telegram lo que hiciste hoy para calcular el score final.`,
    `- Intentar llegar a ${contactTarget} contactos, ${followupTarget} follow-up${followupTarget === 1 ? '' : 's'} y ${proposalTarget} propuesta${proposalTarget === 1 ? '' : 's'} si el día acompaña.`,
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
