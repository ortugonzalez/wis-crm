'use client'

import { useState } from 'react'
import {
  DailyWorkPlan,
  GoalTask,
  GOAL_TASK_CATEGORIES,
  GoalTaskCategory,
  MonthlyGoal,
  Prospect,
  WorkActivityLog,
  WORK_ACTIVITY_TYPES,
  WorkActivityType,
} from '@/app/lib/types'

interface DailyScore {
  score_date: string
  score: number
  contacts_count: number
  follow_ups_done: number
  proposals_sent: number
  meetings_count: number
  goal_progress_points: number
}

interface Props {
  goals: MonthlyGoal[]
  dailyPlans: DailyWorkPlan[]
  workActivities: WorkActivityLog[]
  dailyScore: DailyScore | null
  prospects: Prospect[]
  onCreateGoal: (payload: {
    title: string
    description: string
    month: string
    target_value: number
    unit: string
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
}

function monthStartValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function progress(goal: MonthlyGoal) {
  if (!goal.target_value) return 0
  return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
}

export default function GoalsPanel({
  goals,
  dailyPlans,
  workActivities,
  dailyScore,
  prospects,
  onCreateGoal,
  onCreateTask,
  onToggleTask,
  onLogActivity,
}: Props) {
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    month: monthStartValue(),
    target_value: 1,
    unit: 'acciones',
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
  const todayActivities = workActivities.slice(0, 12)
  const score = dailyScore?.score ?? 0

  const createGoal = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!goalForm.title.trim()) return
    setSaving(true)
    try {
      await onCreateGoal(goalForm)
      setGoalForm({ title: '', description: '', month: monthStartValue(), target_value: 1, unit: 'acciones' })
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
              <h2 className="text-base font-semibold text-[#f0f0f0]">Score laboral de hoy</h2>
              <p className="mt-1 text-sm text-[#6b7280]">Basado en actividad real cargada en el CRM.</p>
            </div>
            <div className="rounded-2xl border border-[#10b98140] bg-[#10b98112] px-4 py-3 text-center">
              <div className="text-3xl font-black text-[#10b981]">{score}</div>
              <div className="text-[11px] text-[#6b7280]">/100</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-[#0c0c0c] p-3">
              <div className="text-lg font-semibold text-[#f0f0f0]">{dailyScore?.contacts_count ?? 0}</div>
              <div className="text-xs text-[#6b7280]">contactos</div>
            </div>
            <div className="rounded-xl bg-[#0c0c0c] p-3">
              <div className="text-lg font-semibold text-[#f0f0f0]">{dailyScore?.follow_ups_done ?? 0}</div>
              <div className="text-xs text-[#6b7280]">follow-ups</div>
            </div>
            <div className="rounded-xl bg-[#0c0c0c] p-3">
              <div className="text-lg font-semibold text-[#f0f0f0]">{dailyScore?.proposals_sent ?? 0}</div>
              <div className="text-xs text-[#6b7280]">propuestas</div>
            </div>
            <div className="rounded-xl bg-[#0c0c0c] p-3">
              <div className="text-lg font-semibold text-[#f0f0f0]">{dailyScore?.meetings_count ?? 0}</div>
              <div className="text-xs text-[#6b7280]">reuniones</div>
            </div>
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
            <textarea
              value={goalForm.description}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Contexto o estrategia"
              className="w-full resize-none rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min={1}
                value={goalForm.target_value}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, target_value: Number(e.target.value) }))}
                className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              />
              <input
                value={goalForm.unit}
                onChange={(e) => setGoalForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="clientes"
                className="col-span-2 rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              />
            </div>
          </div>
          <button className="mt-4 w-full rounded-xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40" disabled={saving || !goalForm.title.trim()}>
            Crear objetivo
          </button>
        </form>

        <form onSubmit={logActivity} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Registrar actividad</h2>
          <div className="mt-4 space-y-3">
            <select
              value={activityForm.type}
              onChange={(e) => setActivityForm((prev) => ({ ...prev, type: e.target.value as WorkActivityType }))}
              className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
            >
              {WORK_ACTIVITY_TYPES.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
            <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
              <input
                type="number"
                min={1}
                value={activityForm.quantity}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              />
              <input
                value={activityForm.title}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: escribi a 10 hoteles"
                className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={activityForm.goal_id}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, goal_id: e.target.value }))}
                className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              >
                <option value="">Sin objetivo</option>
                {activeGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
              <select
                value={activityForm.prospect_id}
                onChange={(e) => setActivityForm((prev) => ({ ...prev, prospect_id: e.target.value }))}
                className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              >
                <option value="">Sin prospecto</option>
                {prospects.map((prospect) => (
                  <option key={prospect.id} value={prospect.id}>{prospect.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="mt-4 w-full rounded-xl bg-[#10b981] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40" disabled={saving || !activityForm.title.trim()}>
            Registrar actividad
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Agenda diaria sugerida</h2>
          {!latestPlan ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#222] px-4 py-6 text-sm text-[#6b7280]">
              Todavia no hay plan diario generado. Cuando corra n8n a la manana, va a aparecer aca.
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-[#222] bg-[#0d0d0d] p-4">
              <div className="text-sm text-[#6b7280]">{latestPlan.plan_date}</div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#f0f0f0]">{latestPlan.summary}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#f0f0f0]">Objetivos activos</h2>
              <p className="mt-1 text-sm text-[#6b7280]">La pregunta diaria: como conseguimos estos resultados?</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {activeGoals.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#222] px-4 py-6 text-sm text-[#6b7280]">
                Carga al menos un objetivo mensual para que el bot deje de hablar generico.
              </div>
            )}

            {activeGoals.map((goal) => (
              <div key={goal.id} className="rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#f0f0f0]">{goal.title}</h3>
                    {goal.description && <p className="mt-1 text-sm text-[#8a8a8a]">{goal.description}</p>}
                  </div>
                  <div className="text-right text-sm text-[#c8c8c8]">
                    {goal.current_value}/{goal.target_value} {goal.unit}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                  <div className="h-full rounded-full bg-[#7c3aed]" style={{ width: `${progress(goal)}%` }} />
                </div>

                <div className="mt-4 space-y-2">
                  {(goal.tasks ?? []).map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#111] px-3 py-2">
                      <div>
                        <div className="text-sm text-[#f0f0f0]">{task.title}</div>
                        <div className="text-xs text-[#6b7280]">
                          {task.completed_count}/{task.target_count} · {task.category}
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleTask(task)}
                        className="rounded-lg border border-[#222] px-3 py-1.5 text-xs text-[#c8c8c8] hover:border-[#333]"
                      >
                        {task.status === 'hecho' ? 'Reabrir' : 'Hecho'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={createTask} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
            <h2 className="text-base font-semibold text-[#f0f0f0]">Nueva tarea palanca</h2>
            <div className="mt-4 space-y-3">
              <select
                value={taskForm.goal_id}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, goal_id: e.target.value }))}
                className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              >
                <option value="">Elegir objetivo</option>
                {activeGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: enviar 20 mails a distribuidoras"
                className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={taskForm.category}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value as GoalTaskCategory }))}
                  className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
                >
                  {GOAL_TASK_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={taskForm.target_count}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, target_count: Number(e.target.value) }))}
                  className="rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>
            <button className="mt-4 w-full rounded-xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40" disabled={saving || !taskForm.goal_id || !taskForm.title.trim()}>
              Crear tarea
            </button>
          </form>

          <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
            <h2 className="text-base font-semibold text-[#f0f0f0]">Actividad reciente</h2>
            <div className="mt-4 space-y-2">
              {todayActivities.length === 0 && <div className="text-sm text-[#6b7280]">Todavia no registraste actividad laboral.</div>}
              {todayActivities.map((activity) => (
                <div key={activity.id} className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] px-4 py-3">
                  <div className="text-sm text-[#f0f0f0]">{activity.quantity}x {activity.title}</div>
                  <div className="mt-1 text-xs text-[#6b7280]">
                    {activity.type}{activity.goal ? ` · ${activity.goal.title}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
