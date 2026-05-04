import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'
import { Prospect, MonthlyGoal, SecretaryPreferences, WorkActivityLog, SalesCampaign } from '@/app/lib/types'

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

function countByStage(prospects: Prospect[]) {
  return {
    cold: prospects.filter((item) => item.stage === 'frio').length,
    contacted: prospects.filter((item) => item.stage === 'contactado').length,
    meetings: prospects.filter((item) => item.stage === 'reunion').length,
    proposals: prospects.filter((item) => item.stage === 'propuesta').length,
    clients: prospects.filter((item) => item.stage === 'cliente').length,
  }
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
  const targetClients = goals
    .filter((goal) => ['cliente', 'clientes', 'cierre', 'cierres'].includes(goal.unit.toLowerCase()))
    .reduce((sum, goal) => sum + goal.target_value, 0)
  const currentClients = pipeline.clients
  const weightedPipeline = prospects.reduce((sum, prospect) => sum + stageWeight(prospect.stage), 0)
  const expectedByToday = targetClients
    ? Math.ceil((targetClients / daysInMonth()) * new Date().getDate())
    : 0
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
      ? 'Proteger cierres: asegurar reuniones, propuestas y proximos pasos concretos.'
      : status === 'amarillo'
        ? 'Convertir pipeline en cierres: empujar reuniones y propuestas abiertas.'
        : 'Crear volumen comercial: sumar contactos, follow-ups y reuniones nuevas.'

  const staleProspects = prospects
    .filter((prospect) => prospect.stage !== 'cliente')
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
    campaigns[0]
      ? `Mover campana ${campaigns[0].name}: hacer ${campaigns[0].daily_target} acciones de ${campaigns[0].business_area}.`
      : `Crear una campana comercial activa para ordenar el esfuerzo sobre ${segmentText}.`,
    pipeline.proposals > 0
      ? `Hacer follow-up a ${pipeline.proposals} propuesta(s) abierta(s).`
      : `Generar al menos ${proposalTarget} propuesta${proposalTarget === 1 ? '' : 's'} nueva${proposalTarget === 1 ? '' : 's'} desde reuniones o conversaciones activas.`,
    staleProspects[0]
      ? `Reactivar a ${staleProspects[0].name}${staleProspects[0].company ? ` de ${staleProspects[0].company}` : ''}.`
      : `Sumar ${contactTarget} contacto${contactTarget === 1 ? '' : 's'} nuevo${contactTarget === 1 ? '' : 's'} y registrar de donde salieron.`,
  ]

  const risks = [
    targetClients === 0 ? 'No hay objetivo mensual de clientes cargado.' : '',
    recentContacts < 20 ? `Volumen bajo este mes: ${recentContacts} contactos registrados.` : '',
    followUps < 5 ? `Pocos follow-ups registrados este mes: ${followUps}.` : '',
    pipeline.meetings + pipeline.proposals === 0 ? 'No hay reuniones ni propuestas en pipeline.' : '',
    gentleMode ? 'El secretario está en modo de carga baja: conviene reducir ambición y priorizar una sola acción importante.' : '',
  ].filter(Boolean)

  const opportunities = [
    pipeline.meetings > 0 ? `${pipeline.meetings} reunion(es) pueden convertirse en propuesta.` : '',
    pipeline.proposals > 0 ? `${pipeline.proposals} propuesta(s) pueden convertirse en cierre si tienen proximo paso.` : '',
    staleProspects.length > 0 ? `${staleProspects.length} contacto(s) dormido(s) para reactivar.` : '',
    campaigns.length > 0 ? `${campaigns.length} campana(s) activa(s) para sostener volumen.` : '',
    upcomingBirthdays[0] ? `${upcomingBirthdays.length} cumpleaño(s) o fechas relacionales para aprovechar.` : '',
  ].filter(Boolean)

  const suggestedMessages = [
    {
      title: 'Follow-up propuesta',
      body: 'Te escribo para retomar la propuesta. Si tiene sentido, coordinamos 15 minutos y vemos como avanzar sin vueltas.',
    },
    {
      title: 'Reactivar contacto dormido',
      body: 'Hace un tiempo no hablamos y queria saber como viene este tema. Si sigue siendo prioridad, te propongo que lo miremos esta semana.',
    },
    {
      title: 'Primer contacto B2B',
      body: 'Estoy contactando empresas del sector porque estamos ayudando a ordenar oportunidades comerciales. Tiene sentido que te cuente en 2 minutos?',
    },
    {
      title: 'Micro-mision del dia',
      body: gentleMode
        ? `Solo una cosa: completa ${followupTarget} follow-up${followupTarget === 1 ? '' : 's'} concretos y cerrá el bloque.`
        : `Bloque de ejecución: ${contactTarget} contactos, ${followupTarget} follow-up${followupTarget === 1 ? '' : 's'} y ${proposalTarget} propuesta${proposalTarget === 1 ? '' : 's'}.`,
    },
  ]

  return NextResponse.json({
    mission: preferences?.monthly_intent
      ? `${mission} Intención del mes: ${preferences.monthly_intent}.`
      : mission,
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
    suggestedMessages,
    weeklyFocus: [
      preferences?.current_focus ? `Prioridad declarada: ${preferences.current_focus}.` : 'Aumentar volumen arriba del embudo.',
      `Sostener ${followupTarget} follow-up${followupTarget === 1 ? '' : 's'} diarios con proximo paso claro.`,
      'Convertir conversaciones en reuniones.',
      'Registrar cierre diario para medir score real.',
    ],
  })
}
