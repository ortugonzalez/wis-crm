'use client'

import { useMemo, useState } from 'react'
import {
  CHANNELS,
  SecretaryCurrentState,
  SecretaryEnergyMode,
  SecretaryMode,
  SecretaryOverview,
  SecretaryPreferences,
  SecretaryTask,
  SecretaryTaskStatus,
} from '@/app/lib/types'
import { formatDateTime } from '@/app/lib/dates'

interface Props {
  tasks: SecretaryTask[]
  preferences: SecretaryPreferences | null
  overview: SecretaryOverview | null
  onStatusChange: (task: SecretaryTask, status: SecretaryTaskStatus) => Promise<void>
  onPreferencesSave: (payload: Record<string, unknown>) => Promise<void>
}

const STATUS_LABELS: Record<SecretaryTaskStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  hecha: 'Hecha',
  postergada: 'Postergada',
  cancelada: 'Cancelada',
}

const STATUS_COLORS: Record<SecretaryTaskStatus, string> = {
  pendiente: 'bg-[#f59e0b20] text-[#f59e0b]',
  en_progreso: 'bg-[#7c3aed20] text-[#7c3aed]',
  hecha: 'bg-[#10b98120] text-[#10b981]',
  postergada: 'bg-[#6b728020] text-[#6b7280]',
  cancelada: 'bg-[#ef444420] text-[#ef4444]',
}

const MODES: { id: SecretaryMode; label: string; description: string }[] = [
  { id: 'liviano', label: 'Liviano', description: 'Pocas tareas, más acompañamiento.' },
  { id: 'normal', label: 'Normal', description: 'Ritmo equilibrado para el día.' },
  { id: 'sprint', label: 'Sprint', description: 'Más empuje y más seguimiento.' },
  { id: 'pausa', label: 'Pausa', description: 'No insistir hasta que vuelvas.' },
]

const ENERGY_MODES: { id: SecretaryEnergyMode; label: string }[] = [
  { id: 'suave', label: 'Suave' },
  { id: 'equilibrado', label: 'Equilibrado' },
  { id: 'intenso', label: 'Intenso' },
]

const CURRENT_STATES: { id: SecretaryCurrentState; label: string }[] = [
  { id: 'arrancando', label: 'Arrancando' },
  { id: 'en_foco', label: 'En foco' },
  { id: 'saturado', label: 'Saturado' },
  { id: 'trabado', label: 'Trabado' },
  { id: 'cerrando', label: 'Cerrando' },
]

export default function SecretaryTasksPanel({
  tasks,
  preferences,
  overview,
  onStatusChange,
  onPreferencesSave,
}: Props) {
  const [filter, setFilter] = useState<SecretaryTaskStatus | 'todas'>('todas')
  const [updating, setUpdating] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    display_name: preferences?.display_name ?? 'Ortu',
    role_title: preferences?.role_title ?? 'Founder',
    monthly_intent: preferences?.monthly_intent ?? '',
    current_focus: preferences?.current_focus ?? '',
    relationship_goal: preferences?.relationship_goal ?? '',
    context_notes: preferences?.context_notes ?? '',
    preferred_segments: (preferences?.preferred_segments ?? []).join(', '),
    priority_channels: (preferences?.priority_channels ?? []).join(', '),
    mode: preferences?.mode ?? 'normal',
    energy_mode: preferences?.energy_mode ?? 'equilibrado',
    current_state: preferences?.current_state ?? 'arrancando',
    coaching_style: preferences?.coaching_style ?? 'concreto',
    work_start_hour: preferences?.work_start_hour ?? 9,
    work_end_hour: preferences?.work_end_hour ?? 18,
    reminder_minutes: preferences?.reminder_minutes ?? 45,
    max_attempts: preferences?.max_attempts ?? 3,
    max_open_tasks: preferences?.max_open_tasks ?? 1,
    daily_contact_target: preferences?.daily_contact_target ?? 10,
    daily_followup_target: preferences?.daily_followup_target ?? 3,
    daily_proposal_target: preferences?.daily_proposal_target ?? 1,
    one_thing_rule: preferences?.one_thing_rule ?? true,
  })

  const filtered = useMemo(
    () => tasks.filter((t) => filter === 'todas' || t.status === filter),
    [tasks, filter]
  )

  const activeTask = overview?.activeTask ?? tasks.find((task) => ['pendiente', 'en_progreso'].includes(task.status)) ?? null
  const completionRateText = overview?.completionRate7d === null || overview?.completionRate7d === undefined
    ? 'N/A'
    : `${overview.completionRate7d}%`

  const handleStatus = async (task: SecretaryTask, status: SecretaryTaskStatus) => {
    setUpdating(task.id)
    await onStatusChange(task, status)
    setUpdating(null)
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSavingProfile(true)
    try {
      await onPreferencesSave(profileForm)
    } finally {
      setSavingProfile(false)
    }
  }

  const filters: { id: SecretaryTaskStatus | 'todas'; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'en_progreso', label: 'En progreso' },
    { id: 'hecha', label: 'Hecha' },
    { id: 'postergada', label: 'Postergada' },
  ]

  return (
    <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-[#1a1a1a] bg-[radial-gradient(circle_at_top_left,#18212d_0,#111_38%,#0d0d0d_100%)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#60a5fa]">Secretary HQ</div>
              <h2 className="mt-2 text-xl font-black text-[#f0f0f0]">
                {preferences?.display_name || 'Ortu'}, hoy vamos paso a paso
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#b7b7b7]">
                {overview?.coachingNote || 'El secretario ya está tomando contexto comercial, ritmo y carga del día.'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#ffffff10] bg-[#00000024] px-4 py-3 text-right">
              <div className="text-xs text-[#8a8a8a]">Modo</div>
              <div className="mt-1 text-lg font-bold text-[#f0f0f0]">{preferences?.mode ?? 'normal'}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Metric label="estado" value={preferences?.current_state ?? 'arrancando'} />
            <Metric label="energia" value={preferences?.energy_mode ?? 'equilibrado'} />
            <Metric label="misiones abiertas" value={overview?.openTasks ?? 0} />
            <Metric label="cumplimiento 7d" value={completionRateText} />
          </div>
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Misión actual</h2>
          {activeTask ? (
            <div className="mt-3 rounded-2xl border border-[#1f2937] bg-[#0d0d0d] p-4">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[activeTask.status]}`}>
                  {STATUS_LABELS[activeTask.status]}
                </span>
                <span className="text-xs text-[#6b7280]">paso {activeTask.step_number}</span>
              </div>
              <div className="mt-2 text-sm font-semibold text-[#f0f0f0]">{activeTask.title}</div>
              <p className="mt-2 text-sm leading-6 text-[#b7b7b7]">{activeTask.instruction}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <QuickButton onClick={() => handleStatus(activeTask, 'hecha')} disabled={updating === activeTask.id} label="Hecha" tone="green" />
                <QuickButton onClick={() => handleStatus(activeTask, 'en_progreso')} disabled={updating === activeTask.id} label="En progreso" tone="violet" />
                <QuickButton onClick={() => handleStatus(activeTask, 'postergada')} disabled={updating === activeTask.id} label="Postergar" tone="gray" />
              </div>
            </div>
          ) : (
            <Empty text="No hay misión activa. El workflow horario debería generar la próxima." />
          )}

          <div className="mt-4 rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#10b981]">Siguiente paso sugerido</div>
            <p className="mt-2 text-sm leading-6 text-[#c8c8c8]">{overview?.nextSuggestedStep || 'Todavía no hay una sugerencia calculada.'}</p>
          </div>
        </section>

        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#f0f0f0]">Perfil del secretario</h2>
              <p className="mt-1 text-sm text-[#6b7280]">Esto cambia cómo te habla, cuánto te exige y qué prioriza.</p>
            </div>
            <button disabled={savingProfile} className="rounded-xl bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
              {savingProfile ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={profileForm.display_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, display_name: e.target.value }))} placeholder="Nombre" className="field" />
              <input value={profileForm.role_title} onChange={(e) => setProfileForm((prev) => ({ ...prev, role_title: e.target.value }))} placeholder="Rol" className="field" />
            </div>
            <input value={profileForm.monthly_intent} onChange={(e) => setProfileForm((prev) => ({ ...prev, monthly_intent: e.target.value }))} placeholder="Intención del mes: cerrar 5 clientes, ordenar pipeline..." className="field" />
            <input value={profileForm.current_focus} onChange={(e) => setProfileForm((prev) => ({ ...prev, current_focus: e.target.value }))} placeholder="Foco actual: hoteles, logística, seguimiento de propuestas..." className="field" />
            <input value={profileForm.relationship_goal} onChange={(e) => setProfileForm((prev) => ({ ...prev, relationship_goal: e.target.value }))} placeholder="Objetivo relacional: reactivar vínculos, pedir referidos..." className="field" />
            <input value={profileForm.preferred_segments} onChange={(e) => setProfileForm((prev) => ({ ...prev, preferred_segments: e.target.value }))} placeholder="Segmentos prioritarios separados por coma" className="field" />
            <input value={profileForm.priority_channels} onChange={(e) => setProfileForm((prev) => ({ ...prev, priority_channels: e.target.value }))} placeholder={`Canales prioritarios. Ej: ${CHANNELS.map((channel) => channel.id).join(', ')}`} className="field" />
            <textarea value={profileForm.context_notes} onChange={(e) => setProfileForm((prev) => ({ ...prev, context_notes: e.target.value }))} rows={3} placeholder="Notas de contexto: cómo querés que insista, qué te frena, qué no haga..." className="field resize-none" />

            <div className="grid grid-cols-3 gap-2">
              <select value={profileForm.mode} onChange={(e) => setProfileForm((prev) => ({ ...prev, mode: e.target.value as SecretaryMode }))} className="field">
                {MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
              </select>
              <select value={profileForm.energy_mode} onChange={(e) => setProfileForm((prev) => ({ ...prev, energy_mode: e.target.value as SecretaryEnergyMode }))} className="field">
                {ENERGY_MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
              </select>
              <select value={profileForm.current_state} onChange={(e) => setProfileForm((prev) => ({ ...prev, current_state: e.target.value as SecretaryCurrentState }))} className="field">
                {CURRENT_STATES.map((state) => <option key={state.id} value={state.id}>{state.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} value={profileForm.daily_contact_target} onChange={(e) => setProfileForm((prev) => ({ ...prev, daily_contact_target: Number(e.target.value) }))} className="field" placeholder="Meta contactos" />
              <input type="number" min={0} value={profileForm.daily_followup_target} onChange={(e) => setProfileForm((prev) => ({ ...prev, daily_followup_target: Number(e.target.value) }))} className="field" placeholder="Meta follow-ups" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} value={profileForm.daily_proposal_target} onChange={(e) => setProfileForm((prev) => ({ ...prev, daily_proposal_target: Number(e.target.value) }))} className="field" placeholder="Meta propuestas" />
              <input type="number" min={5} value={profileForm.reminder_minutes} onChange={(e) => setProfileForm((prev) => ({ ...prev, reminder_minutes: Number(e.target.value) }))} className="field" placeholder="Minutos de insistencia" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min={0} max={23} value={profileForm.work_start_hour} onChange={(e) => setProfileForm((prev) => ({ ...prev, work_start_hour: Number(e.target.value) }))} className="field" placeholder="Inicio" />
              <input type="number" min={0} max={23} value={profileForm.work_end_hour} onChange={(e) => setProfileForm((prev) => ({ ...prev, work_end_hour: Number(e.target.value) }))} className="field" placeholder="Fin" />
              <input type="number" min={1} value={profileForm.max_attempts} onChange={(e) => setProfileForm((prev) => ({ ...prev, max_attempts: Number(e.target.value) }))} className="field" placeholder="Intentos" />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#c8c8c8]">
              <input type="checkbox" checked={profileForm.one_thing_rule} onChange={(e) => setProfileForm((prev) => ({ ...prev, one_thing_rule: e.target.checked }))} />
              Una sola misión principal por vez
            </label>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <section className="grid gap-4 lg:grid-cols-3">
          <InfoList title="Huecos a cubrir" items={overview?.missingFoundations ?? []} emptyText="Base mínima cubierta." />
          <InfoList
            title="Relaciones a cuidar"
            items={(overview?.birthdays ?? []).map((item) => `${item.name}${item.company ? ` - ${item.company}` : ''} cumple pronto`)}
            emptyText="No hay cumpleaños cercanos."
          />
          <InfoList
            title="Prospects dormidos"
            items={(overview?.staleProspects ?? []).map((item) => `${item.name}${item.company ? ` - ${item.company}` : ''} (${item.days_without_contact} días)`)}
            emptyText="No hay prospects dormidos detectados."
          />
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Progreso contra metas operativas</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ProgressCard
              label="Contactos"
              done={overview?.dailyTargetProgress.contacts.done ?? 0}
              target={overview?.dailyTargetProgress.contacts.target ?? 0}
              color="bg-[#06b6d4]"
            />
            <ProgressCard
              label="Follow-ups"
              done={overview?.dailyTargetProgress.followUps.done ?? 0}
              target={overview?.dailyTargetProgress.followUps.target ?? 0}
              color="bg-[#f59e0b]"
            />
            <ProgressCard
              label="Propuestas"
              done={overview?.dailyTargetProgress.proposals.done ?? 0}
              target={overview?.dailyTargetProgress.proposals.target ?? 0}
              color="bg-[#10b981]"
            />
          </div>
          <div className="mt-4 rounded-xl border border-[#1a1a1a] bg-[#0d0d0d] px-4 py-3 text-sm text-[#c8c8c8]">
            {overview?.campaignPulse.headline || 'Todavía no hay pulse comercial.'}
          </div>
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#f0f0f0]">Tareas del agente</h2>
              <p className="mt-1 text-sm text-[#6b7280]">Micro-misiones, reintentos y pendientes reales del secretario.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    filter === id ? 'bg-[#7c3aed] text-white' : 'bg-[#161616] text-[#c8c8c8] hover:bg-[#1d1d1d]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filtered.length === 0 && <Empty text="No hay tareas para este filtro." />}
            {filtered.map((task) => (
              <div key={task.id} className="rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span className="rounded-full bg-[#161616] px-2.5 py-1 text-[11px] text-[#c8c8c8]">{task.task_type}</span>
                  <span className="rounded-full bg-[#161616] px-2.5 py-1 text-[11px] text-[#8a8a8a]">intentos {task.attempts}</span>
                  <span className="ml-auto text-xs text-[#6b7280]">{formatDateTime(task.created_at)}</span>
                </div>

                <p className="mt-2 text-sm font-semibold text-[#f0f0f0]">{task.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#a0a0a0]">{task.instruction}</p>

                {task.status !== 'hecha' && task.status !== 'cancelada' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <QuickButton onClick={() => handleStatus(task, 'hecha')} disabled={updating === task.id} label="Marcar hecha" tone="green" />
                    {task.status !== 'en_progreso' && (
                      <QuickButton onClick={() => handleStatus(task, 'en_progreso')} disabled={updating === task.id} label="En progreso" tone="violet" />
                    )}
                    {task.status !== 'postergada' && (
                      <QuickButton onClick={() => handleStatus(task, 'postergada')} disabled={updating === task.id} label="Postergar" tone="gray" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#ffffff10] bg-[#00000024] p-3">
      <div className="text-lg font-black text-[#f0f0f0]">{value}</div>
      <div className="mt-1 text-xs text-[#8a8a8a]">{label}</div>
    </div>
  )
}

function ProgressCard({
  label,
  done,
  target,
  color,
}: {
  label: string
  done: number
  target: number
  color: string
}) {
  const progress = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[#f0f0f0]">{label}</div>
        <div className="text-xs text-[#8a8a8a]">{done}/{target}</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function InfoList({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
      <h2 className="text-base font-semibold text-[#f0f0f0]">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <Empty text={emptyText} />}
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-[#0d0d0d] px-3 py-2 text-sm leading-5 text-[#c8c8c8]">{item}</div>
        ))}
      </div>
    </div>
  )
}

function QuickButton({
  onClick,
  disabled,
  label,
  tone,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  tone: 'green' | 'violet' | 'gray'
}) {
  const toneClass = {
    green: 'bg-[#10b98115] text-[#10b981] hover:bg-[#10b98125]',
    violet: 'bg-[#7c3aed15] text-[#7c3aed] hover:bg-[#7c3aed25]',
    gray: 'bg-[#6b728015] text-[#6b7280] hover:bg-[#6b728025]',
  }[tone]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${toneClass}`}
    >
      {label}
    </button>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[#222] px-4 py-6 text-sm text-[#6b7280]">{text}</div>
}
