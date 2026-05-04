import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'
import { MonthlyGoal, Prospect, SalesCampaign, SecretaryPreferences, WorkActivityLog } from '@/app/lib/types'

function currentMonthStart() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function daysInMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

function stageWeight(stage: Prospect['stage']) {
  const weights: Record<Prospect['stage'], number> = {
    frio: 0.05,
    contactado: 0.15,
    reunion: 0.35,
    propuesta: 0.6,
    cliente: 1,
  }
  return weights[stage]
}

function temperatureWeight(temperature: Prospect['temperature']) {
  const weights: Record<Prospect['temperature'], number> = {
    frio: 0.05,
    tibio: 0.2,
    caliente: 0.4,
  }
  return weights[temperature]
}

function countByStage(prospects: Prospect[]) {
  return {
    cold: prospects.filter((item) => item.stage === 'frio').length,
    contacted: prospects.filter((item) => item.stage === 'contactado').length,
    meetings: prospects.filter((item) => item.stage === 'reunion').length,
    proposals: prospects.filter((item) => item.stage === 'propuesta').length,
    clients: prospects.filter((item) => item.stage === 'cliente').length,
    hot: prospects.filter((item) => item.temperature === 'caliente').length,
    warm: prospects.filter((item) => item.temperature === 'tibio').length,
    nurture: prospects.filter((item) => item.decision_status === 'nutrir').length,
    paused: prospects.filter((item) => item.decision_status === 'pausar').length,
  }
}

function prospectPriorityScore(prospect: Prospect) {
  const stageScore: Record<Prospect['stage'], number> = {
    propuesta: 5,
    reunion: 4,
    contactado: 3,
    frio: 2,
    cliente: 1,
  }
  const temperatureScore: Record<Prospect['temperature'], number> = {
    caliente: 5,
    tibio: 3,
    frio: 1,
  }
  const decisionBonus: Record<Prospect['decision_status'], number> = {
    avanzar: 2,
    nutrir: 1,
    pausar: -1,
    descartar: -5,
  }

  return stageScore[prospect.stage] + temperatureScore[prospect.temperature] + decisionBonus[prospect.decision_status]
}

export async function GET() {
  const supabase = getServerSupabase()
  const month = currentMonthStart()

  const [prospectsRes, goalsRes, activitiesRes, campaignsRes, preferencesRes] = await Promise.all([
    supabase.from('prospects').select('*').order('updated_at', { ascending: true }).limit(300),
    supabase.from('monthly_goals').select('*').eq('status', 'activo').eq('month', month).limit(50),
    supabase.from('work_activity_log').select('*').gte('activity_date', month).limit(500),
    supabase.from('sales_campaigns').select('*').eq('status', 'activa').limit(50),
    supabase.from('secretary_preferences').select('*').eq('singleton_key', 'ortu').maybeSingle(),
  ])

  if (prospectsRes.error || goalsRes.error || activitiesRes.error || campaignsRes.error || preferencesRes.error) {
    return NextResponse.json({ error: 'No pude calcular el motor comercial.' }, { status: 500 })
  }

  const prospects = (prospectsRes.data ?? []) as Prospect[]
  const goals = (goalsRes.data ?? []) as MonthlyGoal[]
  const activities = (activitiesRes.data ?? []) as WorkActivityLog[]
  const campaigns = (campaignsRes.data ?? []) as SalesCampaign[]
  const preferences = (preferencesRes.data ?? null) as SecretaryPreferences | null

  const pipeline = countByStage(prospects)
  const actionableProspects = prospects
    .filter((prospect) => prospect.decision_status !== 'descartar')
    .sort((a, b) => prospectPriorityScore(b) - prospectPriorityScore(a))
  const focusProspect = actionableProspects[0] ?? null

  const targetClients = goals
    .filter((goal) => ['cliente', 'clientes', 'cierre', 'cierres'].includes(goal.unit.toLowerCase()))
    .reduce((sum, goal) => sum + goal.target_value, 0)
  const currentClients = pipeline.clients
  const weightedPipeline = prospects.reduce(
    (sum, prospect) => sum + stageWeight(prospect.stage) + temperatureWeight(prospect.temperature),
    0
  )
  const expectedByToday = targetClients ? Math.ceil((targetClients / daysInMonth()) * new Date().getDate()) : 0
  const projectedClients = currentClients + Math.floor(weightedPipeline)
  const status =
    targetClients === 0
      ? 'amarillo'
      : projectedClients >= targetClients
        ? 'verde'
        : pipeline.meetings + pipeline.proposals >= Math.max(1, targetClients - currentClients)
          ? 'amarillo'
          : 'rojo'

  const recentContacts = activities
    .filter((activity) => ['contacto', 'email', 'linkedin'].includes(activity.type))
    .reduce((sum, activity) => sum + activity.quantity, 0)
  const followUps = activities
    .filter((activity) => activity.type === 'follow_up')
    .reduce((sum, activity) => sum + activity.quantity, 0)

  const mission =
    status === 'verde'
      ? 'Proteger cierres con proximos pasos y fechas claras.'
      : status === 'amarillo'
        ? 'Convertir pipeline activo en propuestas y cierres.'
        : 'Construir volumen comercial con contactos y conversaciones reales.'

  const staleProspects = prospects
    .filter((prospect) => prospect.stage !== 'cliente' && prospect.decision_status !== 'descartar')
    .filter((prospect) => {
      const reference = prospect.last_contact_at ?? prospect.updated_at ?? prospect.created_at
      return Date.now() - new Date(reference).getTime() > 14 * 24 * 60 * 60 * 1000
    })
    .slice(0, 5)

  const upcomingBirthdays = prospects
    .filter((prospect) => prospect.birthday)
    .map((prospect) => {
      const birthday = new Date(prospect.birthday as string)
      const nextBirthday = new Date(new Date().getFullYear(), birthday.getMonth(), birthday.getDate()).getTime()
      return { prospect, nextBirthday }
    })
    .filter((item) => item.nextBirthday >= Date.now() && item.nextBirthday <= Date.now() + 10 * 24 * 60 * 60 * 1000)
    .sort((a, b) => a.nextBirthday - b.nextBirthday)
    .slice(0, 3)

  const contactTarget = preferences?.daily_contact_target ?? 10
  const followupTarget = preferences?.daily_followup_target ?? 3
  const proposalTarget = preferences?.daily_proposal_target ?? 1
  const gentleMode = preferences?.energy_mode === 'suave' || preferences?.current_state === 'saturado'
  const segmentText = preferences?.preferred_segments?.length ? preferences.preferred_segments.join(', ') : 'segmento principal'

  const todayActions = [
    focusProspect
      ? `Mover a ${focusProspect.name}${focusProspect.company ? ` de ${focusProspect.company}` : ''}: ${focusProspect.decision_reason || focusProspect.temperature_reason || 'definir proximo paso concreto hoy'}.`
      : 'Elegir un prospect prioritario y definir el siguiente paso exacto.',
    campaigns[0]
      ? `Mover campana ${campaigns[0].name}: completar ${campaigns[0].daily_target} acciones sobre ${campaigns[0].business_area}.`
      : `Crear una campana comercial activa para ordenar el esfuerzo sobre ${segmentText}.`,
    pipeline.proposals > 0
      ? `Hacer follow-up a ${pipeline.proposals} propuesta(s) abierta(s) con fecha o decision concreta.`
      : `Generar al menos ${proposalTarget} propuesta${proposalTarget === 1 ? '' : 's'} nueva${proposalTarget === 1 ? '' : 's'} desde conversaciones activas.`,
    staleProspects[0]
      ? `Reactivar a ${staleProspects[0].name}${staleProspects[0].company ? ` de ${staleProspects[0].company}` : ''} con un mensaje corto y proximo paso.`
      : `Sumar ${contactTarget} contacto${contactTarget === 1 ? '' : 's'} nuevo${contactTarget === 1 ? '' : 's'} y registrar de donde salieron.`,
  ].slice(0, 3)

  const risks = [
    targetClients === 0 ? 'No hay objetivo mensual de clientes cargado.' : '',
    recentContacts < 20 ? `Volumen bajo este mes: ${recentContacts} contactos registrados.` : '',
    followUps < 5 ? `Pocos follow-ups registrados este mes: ${followUps}.` : '',
    pipeline.meetings + pipeline.proposals === 0 ? 'No hay reuniones ni propuestas en pipeline.' : '',
    pipeline.hot === 0 ? 'No hay ningun prospecto marcado como caliente.' : '',
    gentleMode ? 'El secretario esta en carga baja: conviene priorizar una sola accion importante.' : '',
  ].filter(Boolean)

  const opportunities = [
    pipeline.meetings > 0 ? `${pipeline.meetings} reunion(es) pueden convertirse en propuesta.` : '',
    pipeline.proposals > 0 ? `${pipeline.proposals} propuesta(s) pueden convertirse en cierre si tienen proximo paso.` : '',
    pipeline.hot > 0 ? `${pipeline.hot} prospecto(s) caliente(s) piden seguimiento fino.` : '',
    staleProspects.length > 0 ? `${staleProspects.length} contacto(s) dormido(s) para reactivar.` : '',
    campaigns.length > 0 ? `${campaigns.length} campana(s) activa(s) para sostener volumen.` : '',
    upcomingBirthdays[0] ? `${upcomingBirthdays.length} cumpleanos o fechas relacionales para aprovechar.` : '',
  ].filter(Boolean)

  const suggestedMessages = [
    {
      title: 'Follow-up propuesta',
      body: 'Te retomo por la propuesta. Si sigue en agenda, hoy mismo definimos siguiente paso y fecha concreta.',
    },
    {
      title: 'Reactivar contacto dormido',
      body: 'Hace un tiempo no hablamos. Si esto sigue siendo prioridad, esta semana definimos si avanzamos o lo pausamos.',
    },
    {
      title: 'Primer contacto B2B',
      body: 'Estoy abriendo conversaciones con empresas del sector para detectar donde se les cae el proceso comercial. Si tiene sentido, te comparto un ejemplo concreto.',
    },
    {
      title: 'Micro-mision del dia',
      body: gentleMode
        ? `Solo una cosa: completa ${followupTarget} follow-up${followupTarget === 1 ? '' : 's'} concretos y cerra el bloque.`
        : `Bloque de ejecucion: ${contactTarget} contactos, ${followupTarget} follow-up${followupTarget === 1 ? '' : 's'} y ${proposalTarget} propuesta${proposalTarget === 1 ? '' : 's'}.`,
    },
  ]

  return NextResponse.json({
    mission: preferences?.monthly_intent ? `${mission} Intencion del mes: ${preferences.monthly_intent}.` : mission,
    forecast: {
      targetClients,
      currentClients,
      expectedByToday,
      weightedPipeline: Number(weightedPipeline.toFixed(2)),
      projectedClients,
      status,
      message:
        targetClients === 0
          ? 'Carga un objetivo mensual de clientes para que el forecast sea real.'
          : `Objetivo ${targetClients}, real ${currentClients}, proyeccion ${projectedClients}.`,
    },
    todayActions,
    risks,
    opportunities,
    pipeline,
    focusContact: focusProspect
      ? {
          id: focusProspect.id,
          name: focusProspect.name,
          company: focusProspect.company,
          stage: focusProspect.stage,
          temperature: focusProspect.temperature,
          decision_status: focusProspect.decision_status,
          reason: focusProspect.decision_reason || focusProspect.temperature_reason || 'Requiere siguiente paso concreto.',
        }
      : null,
    suggestedMessages,
    weeklyFocus: [
      preferences?.current_focus ? `Prioridad declarada: ${preferences.current_focus}.` : 'Aumentar volumen arriba del embudo.',
      `Sostener ${followupTarget} follow-up${followupTarget === 1 ? '' : 's'} diarios con proximo paso claro.`,
      'Convertir conversaciones en reuniones.',
      'Registrar cierre diario para medir score real.',
    ],
  })
}
