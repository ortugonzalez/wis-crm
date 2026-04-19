'use client'

import { useState } from 'react'
import { Reminder, Prospect, REMINDER_CATEGORIES, ReminderCategory } from '@/app/lib/types'
import { formatDateTime, isOverdue } from '@/app/lib/dates'

interface Props {
  reminders: Reminder[]
  prospects: Prospect[]
  onCreate: (payload: {
    prospect_id: string
    title: string
    message: string
    remind_at: string
    category: ReminderCategory
  }) => Promise<void>
  onToggleDone: (reminder: Reminder) => Promise<void>
  onOpenProspect: (prospectId: string) => void
}

export default function RemindersPanel({ reminders, prospects, onCreate, onToggleDone, onOpenProspect }: Props) {
  const [form, setForm] = useState({
    prospect_id: '',
    title: '',
    message: '',
    remind_at: '',
    category: 'manual' as ReminderCategory,
  })
  const [loading, setLoading] = useState(false)

  const pending = reminders.filter((item) => item.status === 'pendiente')

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.remind_at) return
    setLoading(true)
    try {
      await onCreate(form)
      setForm({
        prospect_id: '',
        title: '',
        message: '',
        remind_at: '',
        category: 'manual',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)] px-6 pb-6">
      <form onSubmit={handleCreate} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
        <h2 className="text-base font-semibold text-[#f0f0f0]">Nuevo recordatorio</h2>
        <p className="mt-1 text-sm text-[#6b7280]">Agenda alertas utiles para vos o vinculadas a un prospecto.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Prospecto vinculado</label>
            <select
              value={form.prospect_id}
              onChange={(e) => set('prospect_id', e.target.value)}
              className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
            >
              <option value="">Sin prospecto</option>
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
              placeholder="Ej: Recordar saludo de cumpleanos"
              className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Mensaje</label>
            <textarea
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
              rows={3}
              placeholder="Texto opcional para recordar o reutilizar"
              className="w-full resize-none rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Fecha</label>
              <input
                type="datetime-local"
                value={form.remind_at}
                onChange={(e) => set('remind_at', e.target.value)}
                className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-[#6b7280]">Categoria</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full rounded-xl border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              >
                {REMINDER_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.title.trim() || !form.remind_at}
          className="mt-5 w-full rounded-xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-40"
        >
          {loading ? 'Guardando...' : 'Crear recordatorio'}
        </button>
      </form>

      <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
        <h2 className="text-base font-semibold text-[#f0f0f0]">Agenda de recordatorios</h2>
        <p className="mt-1 text-sm text-[#6b7280]">{pending.length} recordatorios pendientes</p>

        <div className="mt-4 space-y-3">
          {pending.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#222] px-4 py-6 text-sm text-[#6b7280]">
              No hay recordatorios pendientes.
            </div>
          )}

          {pending.map((item) => {
            const overdue = isOverdue(item.remind_at)
            const category = REMINDER_CATEGORIES.find((entry) => entry.id === item.category)

            return (
              <div key={item.id} className="rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-[#f0f0f0]">{item.title}</div>
                      <span className="rounded-full bg-[#1a1a1a] px-2.5 py-1 text-[11px] text-[#c8c8c8]">
                        {category?.label}
                      </span>
                      {overdue && (
                        <span className="rounded-full bg-[#ef444420] px-2.5 py-1 text-[11px] font-semibold text-[#ef4444]">
                          Urgente
                        </span>
                      )}
                    </div>
                    {item.prospect && (
                      <button
                        onClick={() => onOpenProspect(item.prospect!.id)}
                        className="mt-1 text-sm text-[#7c3aed] hover:text-[#9f67ff]"
                      >
                        {item.prospect.name}{item.prospect.company ? ` - ${item.prospect.company}` : ''}
                      </button>
                    )}
                    {item.message && <p className="mt-2 text-sm text-[#8a8a8a]">{item.message}</p>}
                    <div className="mt-3 text-xs text-[#6b7280]">Programado para {formatDateTime(item.remind_at)}</div>
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
      </div>
    </div>
  )
}
