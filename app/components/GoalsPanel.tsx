'use client'

import { useMemo, useState } from 'react'
import {
  DailyCloseout,
  DailyWorkPlan,
  DailyWorkScore,
  FollowUp,
  GoalTask,
  GOAL_TASK_CATEGORIES,
  GoalTaskCategory,
  MonthlyGoal,
  Prospect,
  Reminder,
  WorkActivityLog,
  WORK_ACTIVITY_TYPES,
  WorkActivityType,
} from '@/app/lib/types'

interface Props {
  goals: MonthlyGoal[]
  dailyPlans: DailyWorkPlan[]
  dailyScores: DailyWorkScore[]
  dailyCloseouts: DailyCloseout[]
  workActivities: WorkActivityLog[]
  dailyScore: DailyWorkScore | null
  prospects: Prospect[]
  followUps: FollowUp[]
  reminders: Reminder[]
  onCreateGoal: (payload: {
    title: string
    description: string
    month: string
    target_value: number
    unit: string
    business_area: string
  }) => Promise<void>
  onCreateTask: (payload: {
    goal_id: string
    title: string
    category: GoalTaskCategory
    target_count: number
    due_date: string
  }) => Promise<void>
  onToggleTask: (task: GoalTask) => Promise<void>
  onLogActivity: (payload: {
    type: WorkActivityType
    quantity: number
    title: string
    notes: string
    prospect_id: string
    goal_id: string
  }) => Promise<void>
  onGeneratePlan: () => Promise<void>
}

function monthStartValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function daysInCurrentMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

function currentMonthDay() {
  return new Date().getDate()
}

function progress(goal: MonthlyGoal) {
  if (!goal.target_value) return 0
  return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
}

function expectedByToday(goal: MonthlyGoal) {
  return Math.ceil((goal.target_value / daysInCurrentMonth()) * currentMonthDay())
}

function paceStatus(goal: MonthlyGoal) {
  const expected = expectedByToday(goal)
  if (goal.current_value >= goal.target_value) return { label: 'Cumplido', color: '#10b981' }
  if (goal.current_value >= expected) return { label: 'En ritmo', color: '#10b981' }
  if (goal.current_value + 1 >= expected) return { label: 'Cerca', color: '#f59e0b' }
  return { label: 'Atrasado', color: '#ef4444' }
}

function upcomingBirthdays(prospects: Prospect[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const twoWeeks = today + 14 * 24 * 60 * 60 * 1000

  return prospects
    .filter((prospect) => prospect.birthday)
    .map((prospect) => {
      const birthday = new Date(prospect.birthday!)
      const thisYear = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate()).getTime()
      return { prospect, date: thisYear }
    })
    .filter((item) => item.date >= today && item.date <= twoWeeks)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5)
}

function abandonedProspects(prospects: Prospect[]) {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000
  return prospects
    .filter((prospect) => prospect.stage !== 'cliente')
    .filter((prospect) => new Date(prospect.last_contact_at ?? prospect.updated_at ?? prospect.created_at).getTime() < cutoff)
    .slice(0, 6)
}

const templates = [
  'Te escribo porque queria retomar lo que vimos la semana pasada. Tiene sentido que avancemos esta semana?',
  'Estoy armando agenda para esta semana. Te sirve que coordinemos 15 minutos y vemos si hay encaje?',
  'Vi que habia quedado pendiente revisar la propuesta. Queres que te mande una version mas simple para decidir rapido?',
]

export default function GoalsPanel({
  goals,
  dailyPlans,
  dailyScores,
  dailyCloseouts,
  workActivities,
  dailyScore,
  prospects,
  followUps,
  reminders,
  onCreateGoal,
  onCreateTask,
  onToggleTask,
  onLogActivity,
  onGeneratePlan,
}: Props) {
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    month: monthStartValue(),
    target_value: 1,
    unit: 'acciones',
    business_area: 'general',
  })
  const [taskForm, setTaskForm] = useState({
    goal_id: goals[0]?.id ?? '',
    title: '',
    category: 'contactos' as GoalTaskCategory,
    target_count: 1,
    due_date: '',
  })
  const [activityForm, setActivityForm] = useState({
    type: 'contacto' as WorkActivityType,
    quantity: 1,
    title: '',
    notes: '',
    prospect_id: '',
    goal_id: '',
  })
  const [saving, setSaving] = useState(false)

  const activeGoals = goals.filter((goal) => goal.status === 'activo')
  const latestPlan = dailyPlans[0]
  const latestCloseout = dailyCloseouts[0]
  const score = dailyScore?.score ?? 0
  const scoreIsFinal = dailyScore?.source === 'telegram_closeout'
  const birthdays = upcomingBirthdays(prospects)
  const abandoned = abandonedProspects(prospects)

  const activityRanking = useMemo(() => {
    const ranking = new Map<string, number>()
    for (const activity of workActivities) {
      ranking.set(activity.type, (ranking.get(activity.type) ?? 0) + activity.quantity)
    }
    return [...ranking.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [workActivities])

  const todayMustDo = [
    ...(latestPlan?.priorities?.map((priority) => priority.title) ?? []),
    ...activeGoals.flatMap((goal) => (goal.tasks ?? []).filter((task) => task.status !== 'hecho').map((task) => task.title)),
    ...followUps.filter((item) => item.status === 'pendiente').map((item) => item.title),
    ...reminders.filter((item) => item.status === 'pendiente').map((item) => item.title),
  ].slice(0, 3)

  const createGoal = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!goalForm.title.trim()) return
    setSaving(true)
    try {
      await onCreateGoal(goalForm)
      setGoalForm({
        title: '',
        description: '',
        month: monthStartValue(),
        target_value: 1,
        unit: 'acciones',
        business_area: 'general',
      })
    } finally {
      setSaving(false)
    }
  }

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!taskForm.goal_id || !taskForm.title.trim()) return
    setSaving(true)
    try {
      await onCreateTask(taskForm)
      setTaskForm((prev) => ({ ...prev, title: '', target_count: 1, due_date: '' }))
    } finally {
      setSaving(false)
    }
  }

  const logActivity = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activityForm.title.trim()) return
    setSaving(true)
    try {
      await onLogActivity(activityForm)
      setActivityForm((prev) => ({ ...prev, quantity: 1, title: '', notes: '' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#f0f0f0]">
                {scoreIsFinal ? 'Score final del dia' : 'Preview operativo'}
              </h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                {scoreIsFinal
                  ? 'Generado despues del cierre por Telegram.'
                  : 'El score final aparece cuando respondas que hiciste hoy.'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#10b98140] bg-[#10b98112] px-4 py-3 text-center">
              <div className="text-3xl font-black text-[#10b981]">{score}</div>
              <div className="text-[11px] text-[#6b7280]">/100</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Metric label="contactos" value={dailyScore?.contacts_count ?? 0} />
            <Metric label="follow-ups" value={dailyScore?.follow_ups_done ?? 0} />
            <Metric label="propuestas" value={dailyScore?.proposals_sent ?? 0} />
            <Metric label="reuniones" value={dailyScore?.meetings_count ?? 0} />
          </div>
        </section>

        <form onSubmit={createGoal} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Nuevo objetivo mensual</h2>
          <div className="mt-4 space-y-3">
            <input
              value={goalForm.title}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ej: Conseguir 5 clientes nuevos"
              className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={goalForm.business_area}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, business_area: e.target.value }))}
                placeholder="hoteles, logistica, general"
                className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              />
              <input
                value={goalForm.unit}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="clientes"
                className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              />
            </div>
            <textarea
              value={goalForm.description}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Contexto o estrategia"
              className="w-full resize-none rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
            />
            <input
              type="number"
              min={1}
              value={goalForm.target_value}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, target_value: Number(e.target.value) }))}
              className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
            />
          </div>
          <button className="mt-4 w-full rounded-xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40" disabled={saving || !goalForm.title.trim()}>
            Crear objetivo
          </button>
        </form>

        <form onSubmit={logActivity} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Registrar actividad</h2>
          <div className="mt-4 space-y-3">
            <select value={activityForm.type} onChange={(e) => setActivityForm((prev) => ({ ...prev, type: e.target.value as WorkActivityType }))} className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]">
              {WORK_ACTIVITY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
            </select>
            <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
              <input type="number" min={1} value={activityForm.quantity} onChange={(e) => setActivityForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]" />
              <input value={activityForm.title} onChange={(e) => setActivityForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Ej: escribi a 10 hoteles" className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]" />
            </div>
            <select value={activityForm.goal_id} onChange={(e) => setActivityForm((prev) => ({ ...prev, goal_id: e.target.value }))} className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]">
              <option value="">Sin objetivo</option>
              {activeGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
            </select>
          </div>
          <button className="mt-4 w-full rounded-xl bg-[#10b981] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40" disabled={saving || !activityForm.title.trim()}>
            Registrar actividad
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#f0f0f0]">Agenda diaria sugerida</h2>
              <p className="mt-1 text-sm text-[#6b7280]">Plan vs realidad, maximo 3 prioridades.</p>
            </div>
            <button onClick={onGeneratePlan} className="rounded-xl border border-[#7c3aed40] px-4 py-2 text-sm font-semibold text-[#c4b5fd] hover:bg-[#7c3aed15]">
              Generar plan ahora
            </button>
          </div>

          {latestPlan ? (
            <div className="mt-4 rounded-2xl border border-[#222] bg-[#0d0d0d] p-4">
              <div className="text-sm text-[#6b7280]">{latestPlan.plan_date}</div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#f0f0f0]">{latestPlan.summary}</p>
            </div>
          ) : (
            <Empty text="Todavia no hay plan diario generado." />
          )}
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Hoy si o si</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {todayMustDo.length === 0 && <Empty text="No hay prioridades. Carga objetivos y tareas palanca." />}
            {todayMustDo.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-4">
                <div className="text-xs font-semibold text-[#7c3aed]">Prioridad {index + 1}</div>
                <div className="mt-2 text-sm text-[#f0f0f0]">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Objetivos activos y ritmo mensual</h2>
          <div className="mt-4 space-y-4">
            {activeGoals.length === 0 && <Empty text="Carga al menos un objetivo mensual para que el bot deje de hablar generico." />}
            {activeGoals.map((goal) => {
              const pace = paceStatus(goal)
              const expected = expectedByToday(goal)
              return (
                <div key={goal.id} className="rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#f0f0f0]">{goal.title}</h3>
                      <p className="mt-1 text-xs text-[#6b7280]">{goal.business_area} - deberias ir en {expected}/{goal.target_value} {goal.unit}</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ color: pace.color, backgroundColor: `${pace.color}18` }}>
                      {pace.label}
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                    <div className="h-full rounded-full bg-[#7c3aed]" style={{ width: `${progress(goal)}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-[#8a8a8a]">
                    Real: {goal.current_value}/{goal.target_value}. Si hay reuniones futuras, el bot no deberia desesperarse: debe cuidar proceso y pipeline.
                  </div>

                  <div className="mt-4 space-y-2">
                    {(goal.tasks ?? []).map((task) => (
                      <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#111] px-3 py-2">
                        <div>
                          <div className="text-sm text-[#f0f0f0]">{task.title}</div>
                          <div className="text-xs text-[#6b7280]">{task.completed_count}/{task.target_count} - {task.category}</div>
                        </div>
                        <button onClick={() => onToggleTask(task)} className="rounded-lg border border-[#222] px-3 py-1.5 text-xs text-[#c8c8c8] hover:border-[#333]">
                          {task.status === 'hecho' ? 'Reabrir' : 'Hecho'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Insight title="Pipeline futuro" items={[
            `${prospects.filter((p) => p.stage === 'reunion').length} reuniones en pipeline`,
            `${prospects.filter((p) => p.stage === 'propuesta').length} propuestas abiertas`,
            `${followUps.filter((f) => f.status === 'pendiente').length} follow-ups pendientes`,
          ]} />
          <Insight title="Relaciones a cuidar" items={[
            ...birthdays.map(({ prospect }) => `Cumpleanos cerca: ${prospect.name}`),
            ...abandoned.map((prospect) => `Hace mucho no hablas con ${prospect.name}`),
          ].slice(0, 5)} />
          <Insight title="Ranking 30 dias" items={activityRanking.map(([type, total]) => `${type}: ${total}`)} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={createTask} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
            <h2 className="text-base font-semibold text-[#f0f0f0]">Nueva tarea palanca</h2>
            <div className="mt-4 space-y-3">
              <select value={taskForm.goal_id} onChange={(e) => setTaskForm((prev) => ({ ...prev, goal_id: e.target.value }))} className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]">
                <option value="">Elegir objetivo</option>
                {activeGoals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
              </select>
              <input value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Ej: enviar 20 mails a distribuidoras" className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]" />
              <div className="grid grid-cols-2 gap-2">
                <select value={taskForm.category} onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value as GoalTaskCategory }))} className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]">
                  {GOAL_TASK_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                </select>
                <input type="number" min={1} value={taskForm.target_count} onChange={(e) => setTaskForm((prev) => ({ ...prev, target_count: Number(e.target.value) }))} className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]" />
              </div>
            </div>
            <button className="mt-4 w-full rounded-xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40" disabled={saving || !taskForm.goal_id || !taskForm.title.trim()}>
              Crear tarea
            </button>
          </form>

          <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
            <h2 className="text-base font-semibold text-[#f0f0f0]">Cierre y score historico</h2>
            {latestCloseout && <p className="mt-2 text-sm text-[#8a8a8a]">{latestCloseout.summary ?? latestCloseout.raw_text}</p>}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {dailyScores.slice(0, 10).map((item) => (
                <div key={item.id} className="rounded-xl bg-[#0d0d0d] p-3 text-center">
                  <div className="text-lg font-bold text-[#10b981]">{item.score}</div>
                  <div className="text-[10px] text-[#6b7280]">{item.score_date.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Plantillas rapidas</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {templates.map((template) => (
              <div key={template} className="rounded-xl border border-[#222] bg-[#0d0d0d] p-3 text-sm text-[#c8c8c8]">
                {template}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#0c0c0c] p-3">
      <div className="text-lg font-semibold text-[#f0f0f0]">{value}</div>
      <div className="text-xs text-[#6b7280]">{label}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[#222] px-4 py-6 text-sm text-[#6b7280]">{text}</div>
}

function Insight({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
      <h2 className="text-base font-semibold text-[#f0f0f0]">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <div className="text-sm text-[#6b7280]">Sin datos todavia.</div>}
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-[#0d0d0d] px-3 py-2 text-sm text-[#c8c8c8]">{item}</div>
        ))}
      </div>
    </div>
  )
}
