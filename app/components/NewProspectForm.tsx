'use client'

import { useState } from 'react'
import { STAGES, CHANNELS, Channel, Stage } from '@/app/lib/types'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function NewProspectForm({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    channel: 'otro' as Channel,
    stage: 'frio' as Stage,
    source: 'manual',
    notes: '',
    estimated_value: '',
    birthday: '',
    next_action_at: '',
  })

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
          birthday: form.birthday || null,
          next_action_at: form.next_action_at || null,
        }),
      })
      onCreated()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-[#222] bg-[#111] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-[#1a1a1a] px-6 pb-4 pt-6">
          <div>
            <h2 className="text-base font-semibold text-[#f0f0f0]">Nuevo prospecto</h2>
            <p className="mt-1 text-sm text-[#6b7280]">Carga la base inicial para que Telegram y n8n la sigan alimentando.</p>
          </div>
          <button onClick={onClose} className="p-1 text-[#6b7280] transition-colors hover:text-[#f0f0f0]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Nombre *</label>
              <input
                autoFocus
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Juan Garcia"
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Empresa</label>
              <input
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                placeholder="Empresa SA"
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="juan@empresa.com"
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Telefono</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+54 9 11..."
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Canal</label>
              <select
                value={form.channel}
                onChange={(e) => set('channel', e.target.value)}
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              >
                {CHANNELS.map((channel) => (
                  <option key={channel.id} value={channel.id}>{channel.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Etapa</label>
              <select
                value={form.stage}
                onChange={(e) => set('stage', e.target.value)}
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              >
                {STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Origen</label>
              <input
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                placeholder="manual, telegram, referido..."
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Valor estimado</label>
              <input
                type="number"
                value={form.estimated_value}
                onChange={(e) => set('estimated_value', e.target.value)}
                placeholder="150000"
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Cumpleanos</label>
              <input
                type="date"
                value={form.birthday}
                onChange={(e) => set('birthday', e.target.value)}
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Proxima accion</label>
              <input
                type="datetime-local"
                value={form.next_action_at}
                onChange={(e) => set('next_action_at', e.target.value)}
                className="w-full rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-[#6b7280]">Notas</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                placeholder="Contexto del prospecto..."
                className="w-full resize-none rounded-lg border border-[#222] bg-[#161616] px-3 py-2.5 text-sm text-[#f0f0f0] outline-none transition-colors focus:border-[#7c3aed]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#222] py-2.5 text-sm text-[#6b7280] transition-colors hover:border-[#333] hover:text-[#f0f0f0]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="flex-1 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-40"
            >
              {loading ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
