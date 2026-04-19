'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Prospect,
  Activity,
  STAGES,
  CHANNELS,
  ACTIVITY_LABELS,
  Stage,
  Channel,
  FollowUp,
  RawMessage,
  Priority,
  PRIORITIES,
} from '@/app/lib/types'
import { formatDate, formatDateTime, timeAgo, toDatetimeLocal } from '@/app/lib/dates'

interface Props {
  prospect: Prospect
  onClose: () => void
  onUpdated: () => Promise<void> | void
  onDeleted: () => Promise<void> | void
}

const inputClass =
  'w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]'

export default function ProspectModal({ prospect, onClose, onUpdated, onDeleted }: Props) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [messages, setMessages] = useState<RawMessage[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [newFollowUp, setNewFollowUp] = useState({
    title: '',
    notes: '',
    due_at: '',
    priority: 'media' as Priority,
  })
  const [addingFollowUp, setAddingFollowUp] = useState(false)
  const [form, setForm] = useState({
    name: prospect.name,
    company: prospect.company ?? '',
    email: prospect.email ?? '',
    phone: prospect.phone ?? '',
    channel: prospect.channel as Channel,
    stage: prospect.stage as Stage,
    source: prospect.source ?? 'manual',
    notes: prospect.notes ?? '',
    estimated_value: prospect.estimated_value?.toString() ?? '',
    birthday: prospect.birthday ? prospect.birthday.slice(0, 10) : '',
    last_contact_at: toDatetimeLocal(prospect.last_contact_at),
    next_action_at: toDatetimeLocal(prospect.next_action_at),
  })

  const fetchDetails = useCallback(async () => {
    const [aRes, fRes, mRes] = await Promise.all([
      fetch(`/api/activities?prospect_id=${prospect.id}`),
      fetch(`/api/followups?prospect_id=${prospect.id}`),
      fetch(`/api/messages?prospect_id=${prospect.id}`),
    ])
    const [aData, fData, mData] = await Promise.all([aRes.json(), fRes.json(), mRes.json()])
    setActivities(Array.isArray(aData) ? aData : [])
    setFollowUps(Array.isArray(fData) ? fData : [])
    setMessages(Array.isArray(mData) ? mData : [])
  }, [prospect.id])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchDetails()
    })
  }, [fetchDetails])

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))
  const setFollowUpField = (field: string, value: string) =>
    setNewFollowUp((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
          birthday: form.birthday || null,
          last_contact_at: form.last_contact_at || null,
          next_action_at: form.next_action_at || null,
        }),
      })
      setEditing(false)
      await onUpdated()
      await fetchDetails()
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setAddingNote(true)
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_id: prospect.id,
          type: 'nota',
          description: newNote.trim(),
        }),
      })
      setNewNote('')
      await fetchDetails()
    } finally {
      setAddingNote(false)
    }
  }

  const handleAddFollowUp = async () => {
    if (!newFollowUp.title.trim() || !newFollowUp.due_at) return
    setAddingFollowUp(true)
    try {
      await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_id: prospect.id,
          ...newFollowUp,
        }),
      })
      setNewFollowUp({ title: '', notes: '', due_at: '', priority: 'media' })
      await onUpdated()
      await fetchDetails()
    } finally {
      setAddingFollowUp(false)
    }
  }

  const handleToggleFollowUp = async (item: FollowUp) => {
    await fetch(`/api/followups/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item,
        status: item.status === 'hecho' ? 'pendiente' : 'hecho',
      }),
    })
    await onUpdated()
    await fetchDetails()
  }

  const handleDelete = async () => {
    if (!confirm('Eliminar este prospecto?')) return
    await fetch(`/api/prospects/${prospect.id}`, { method: 'DELETE' })
    await onDeleted()
  }

  const stageConfig = STAGES.find((entry) => entry.id === (editing ? form.stage : prospect.stage))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl border border-[#222] bg-[#111] shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between border-b border-[#1a1a1a] px-6 pb-4 pt-6">
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                autoFocus
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full border-b border-[#7c3aed] bg-transparent pb-1 text-lg font-semibold text-[#f0f0f0] outline-none"
              />
            ) : (
              <h2 className="truncate text-lg font-semibold text-[#f0f0f0]">{prospect.name}</h2>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {(editing ? form.company : prospect.company) && (
                <span className="text-sm text-[#6b7280]">{editing ? form.company : prospect.company}</span>
              )}
              <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: stageConfig?.bg, color: stageConfig?.color }}>
                {stageConfig?.label}
              </span>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-2">
            {!editing && (
              <button onClick={() => setEditing(true)} className="rounded-lg p-2 text-[#6b7280] transition-colors hover:bg-[#1c1c1c] hover:text-[#f0f0f0]">
                Editar
              </button>
            )}
            <button onClick={onClose} className="p-2 text-[#6b7280] transition-colors hover:text-[#f0f0f0]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                {editing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Empresa"><input value={form.company} onChange={(e) => set('company', e.target.value)} className={inputClass} /></Field>
                    <Field label="Etapa">
                      <select value={form.stage} onChange={(e) => set('stage', e.target.value)} className={inputClass}>
                        {STAGES.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Email"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} /></Field>
                    <Field label="Telefono"><input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} /></Field>
                    <Field label="Canal">
                      <select value={form.channel} onChange={(e) => set('channel', e.target.value)} className={inputClass}>
                        {CHANNELS.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Origen"><input value={form.source} onChange={(e) => set('source', e.target.value)} className={inputClass} /></Field>
                    <Field label="Valor estimado"><input type="number" value={form.estimated_value} onChange={(e) => set('estimated_value', e.target.value)} className={inputClass} /></Field>
                    <Field label="Cumpleanos"><input type="date" value={form.birthday} onChange={(e) => set('birthday', e.target.value)} className={inputClass} /></Field>
                    <Field label="Ultimo contacto"><input type="datetime-local" value={form.last_contact_at} onChange={(e) => set('last_contact_at', e.target.value)} className={inputClass} /></Field>
                    <Field label="Proxima accion"><input type="datetime-local" value={form.next_action_at} onChange={(e) => set('next_action_at', e.target.value)} className={inputClass} /></Field>
                    <Field label="Notas" full><textarea rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputClass} resize-none`} /></Field>
                    <div className="flex gap-3 sm:col-span-2">
                      <button onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-[#222] py-2.5 text-sm text-[#6b7280] transition-colors hover:border-[#333] hover:text-[#f0f0f0]">Cancelar</button>
                      <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-40">
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {prospect.email && <Info label="Email" value={prospect.email} />}
                    {prospect.phone && <Info label="Telefono" value={prospect.phone} />}
                    <Info label="Canal" value={CHANNELS.find((channel) => channel.id === prospect.channel)?.label ?? prospect.channel} />
                    <Info label="Origen" value={prospect.source} />
                    <Info label="Ultimo contacto" value={prospect.last_contact_at ? formatDateTime(prospect.last_contact_at) : 'Sin registrar'} />
                    <Info label="Proxima accion" value={prospect.next_action_at ? formatDateTime(prospect.next_action_at) : 'Sin registrar'} />
                    <Info label="Cumpleanos" value={prospect.birthday ? formatDate(prospect.birthday) : 'Sin fecha'} />
                    <Info label="Actualizado" value={timeAgo(prospect.updated_at)} />
                    {prospect.estimated_value && <Info label="Valor estimado" value={`$${prospect.estimated_value.toLocaleString('es-AR')}`} accent />}
                    {prospect.notes && (
                      <div className="sm:col-span-2">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">Notas</div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#a0a0a0]">{prospect.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                <div className="mb-3 text-sm font-semibold text-[#f0f0f0]">Agregar nota</div>
                <div className="flex gap-2">
                  <input value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} placeholder="Registrar una accion o una observacion..." className={`${inputClass} flex-1`} />
                  <button onClick={handleAddNote} disabled={addingNote || !newNote.trim()} className="rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-40">
                    {addingNote ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                <div className="mb-3 text-sm font-semibold text-[#f0f0f0]">Actividad</div>
                <div className="space-y-3">
                  {activities.length === 0 && <div className="text-sm text-[#6b7280]">Todavia no hay actividad registrada.</div>}
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#333]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7280]">
                          <span>{ACTIVITY_LABELS[activity.type]}</span>
                          <span>·</span>
                          <span>{timeAgo(activity.created_at)}</span>
                        </div>
                        {activity.description && <p className="mt-1 text-sm text-[#a0a0a0]">{activity.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                <div className="mb-3 text-sm font-semibold text-[#f0f0f0]">Crear follow-up</div>
                <div className="space-y-3">
                  <input value={newFollowUp.title} onChange={(e) => setFollowUpField('title', e.target.value)} placeholder="Ej: volver a escribir con propuesta" className={inputClass} />
                  <textarea rows={3} value={newFollowUp.notes} onChange={(e) => setFollowUpField('notes', e.target.value)} placeholder="Detalles del seguimiento" className={`${inputClass} resize-none`} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="datetime-local" value={newFollowUp.due_at} onChange={(e) => setFollowUpField('due_at', e.target.value)} className={inputClass} />
                    <select value={newFollowUp.priority} onChange={(e) => setFollowUpField('priority', e.target.value)} className={inputClass}>
                      {PRIORITIES.map((priority) => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
                    </select>
                  </div>
                  <button onClick={handleAddFollowUp} disabled={addingFollowUp || !newFollowUp.title.trim() || !newFollowUp.due_at} className="w-full rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-40">
                    {addingFollowUp ? 'Guardando...' : 'Agregar follow-up'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                <div className="mb-3 text-sm font-semibold text-[#f0f0f0]">Follow-ups</div>
                <div className="space-y-3">
                  {followUps.length === 0 && <div className="text-sm text-[#6b7280]">Sin follow-ups para este prospecto.</div>}
                  {followUps.map((item) => {
                    const priority = PRIORITIES.find((entry) => entry.id === item.priority)
                    return (
                      <div key={item.id} className="rounded-xl border border-[#1a1a1a] bg-[#101010] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-[#f0f0f0]">{item.title}</div>
                              {priority && <span className="rounded-full px-2 py-1 text-[11px]" style={{ color: priority.color, backgroundColor: priority.bg }}>{priority.label}</span>}
                            </div>
                            {item.notes && <p className="mt-2 text-sm text-[#8a8a8a]">{item.notes}</p>}
                            <div className="mt-2 text-xs text-[#6b7280]">{item.status === 'hecho' ? 'Hecho' : 'Vence'}: {formatDateTime(item.status === 'hecho' ? item.completed_at : item.due_at)}</div>
                          </div>
                          <button onClick={() => handleToggleFollowUp(item)} className="rounded-lg border border-[#222] px-3 py-2 text-xs text-[#c8c8c8] transition-colors hover:border-[#333] hover:text-[#f0f0f0]">
                            {item.status === 'hecho' ? 'Reabrir' : 'Hecho'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                <div className="mb-3 text-sm font-semibold text-[#f0f0f0]">Mensajes recientes</div>
                <div className="space-y-3">
                  {messages.length === 0 && <div className="text-sm text-[#6b7280]">Todavia no hay mensajes vinculados.</div>}
                  {messages.map((message) => (
                    <div key={message.id} className="rounded-xl border border-[#1a1a1a] bg-[#101010] p-4">
                      <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                        <span className={message.direction === 'inbound' ? 'text-[#06b6d4]' : 'text-[#10b981]'}>{message.direction === 'inbound' ? 'Entrante' : 'Saliente'}</span>
                        <span>·</span>
                        <span>{message.kind}</span>
                        <span>·</span>
                        <span>{formatDateTime(message.created_at)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[#a0a0a0]">{message.content || '(mensaje sin texto)'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {!editing && (
          <div className="border-t border-[#1a1a1a] px-6 py-4">
            <button onClick={handleDelete} className="text-xs text-[#6b7280] transition-colors hover:text-red-400">Eliminar prospecto</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : undefined}>
      <label className="mb-1.5 block text-[10px] uppercase tracking-widest text-[#6b7280]">{label}</label>
      {children}
    </div>
  )
}

function Info({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">{label}</div>
      <div className={`text-sm ${accent ? 'font-mono text-[#7c3aed]' : 'text-[#f0f0f0]'}`}>{value}</div>
    </div>
  )
}
