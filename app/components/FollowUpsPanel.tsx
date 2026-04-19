'use client'

import { useState } from 'react'
import { FollowUp, Priority, PRIORITIES, Prospect } from '@/app/lib/types'
import { formatDateTime, isOverdue } from '@/app/lib/dates'

interface Props {
  followUps: FollowUp[]
  prospects: Prospect[]
  onCreate: (payload: {
    prospect_id: string
    title: string
    notes: string
    due_at: string
    priority: Priority
  }) => Promise<void>
  onToggleDone: (followUp: FollowUp) => Promise<void>
  onOpenProspect: (prospectId: string) => void
}

export default function FollowUpsPanel({ followUps, prospects, onCreate, onToggleDone, onOpenProspect }: Props) {
  const [form, setForm] = useState({
    prospect_id: prospects[0]?.id ?? '',
    title: '',
    notes: '',
    due_at: '',
    priority: 'media' as Priority,
  })
  const [loading, setLoading] = useState(false)

  const pending = followUps.filter((item) => item.status === 'pendiente')
  const completed = followUps.filter((item) => item.status === 'hecho').slice(0, 10)

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.prospect_id || !form.title.trim() || !form.due_at) return
    setLoading(true)
    try {
      await onCreate(form)
      setForm({
        prospect_id: prospects[0]?.id ?? '',
        title: '',
        notes: '',
        due_at: '',
        priority: 'media',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] px-6 pb-6">
      <form onSubmit={handleCreate} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
        <h2 className="text-base font-semibold text-[#f0f0f0]">Nuevo follow-up</h2>
        <p className="mt-1 text-sm text-[#6b7280]">Crea la proxima accion concreta para un prospecto.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Prospecto</label>
            <select
              value={form.prospect_id}
              onChange={(e) => set('prospect_id', e.target.value)}
              className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
            >
              {prospects.map((prospect) => (
                <option key={prospect.id} value={prospect.id}>
                  {prospect.name}{prospect.company ? ` - ${prospect.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Titulo</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Retomar contacto por propuesta"
              className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Que hay que hacer o recordar"
              className="w-full resize-none rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Vence</label>
              <input
                type="datetime-local"
                value={form.due_at}
                onChange={(e) => set('due_at', e.target.value)}
                className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Prioridad</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority.id} value={priority.id}>{priority.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.prospect_id || !form.title.trim() || !form.due_at}
          className="mt-5 w-full rounded-xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-40"
        >
          {loading ? 'Guardando...' : 'Crear follow-up'}
        </button>
      </form>

      <div className="space-y-4">
        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#f0f0f0]">Pendientes</h2>
              <p className="mt-1 text-sm text-[#6b7280]">{pending.length} follow-ups abiertos</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {pending.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#222] px-4 py-6 text-sm text-[#6b7280]">
                No hay follow-ups pendientes.
              </div>
            )}

            {pending.map((item) => {
              const priority = PRIORITIES.find((entry) => entry.id === item.priority)
              const overdue = isOverdue(item.due_at)

              return (
                <div key={item.id} className="rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => item.prospect && onOpenProspect(item.prospect.id)}
                          className="text-left text-sm font-semibold text-[#f0f0f0] hover:text-[#7c3aed]"
                        >
                          {item.title}
                        </button>
                        {priority && (
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{ color: priority.color, backgroundColor: priority.bg }}
                          >
                            {priority.label}
                          </span>
                        )}
                        {overdue && (
                          <span className="rounded-full bg-[#ef444420] px-2.5 py-1 text-[11px] font-semibold text-[#ef4444]">
                            Vencido
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-[#a0a0a0]">
                        {item.prospect?.name}{item.prospect?.company ? ` - ${item.prospect.company}` : ''}
                      </div>
                      {item.notes && <p className="mt-2 text-sm text-[#8a8a8a]">{item.notes}</p>}
                      <div className="mt-3 text-xs text-[#6b7280]">Vence: {formatDateTime(item.due_at)}</div>
                    </div>

                    <button
                      onClick={() => onToggleDone(item)}
                      className="rounded-xl border border-[#222] px-3 py-2 text-sm text-[#c8c8c8] transition-colors hover:border-[#333] hover:text-[#f0f0f0]"
                    >
                      Marcar hecho
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h3 className="text-sm font-semibold text-[#f0f0f0]">Ultimos completados</h3>
          <div className="mt-3 space-y-2">
            {completed.length === 0 && <div className="text-sm text-[#6b7280]">Todavia no completaste follow-ups.</div>}
            {completed.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] px-4 py-3">
                <div className="text-sm text-[#f0f0f0]">{item.title}</div>
                <div className="mt-1 text-xs text-[#6b7280]">
                  {item.prospect?.name} · completado {formatDateTime(item.completed_at)}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
