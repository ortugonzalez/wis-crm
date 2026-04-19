'use client'

import { Prospect, FollowUp, Reminder, RawMessage } from '@/app/lib/types'

interface Props {
  prospects: Prospect[]
  followUps: FollowUp[]
  reminders: Reminder[]
  messages: RawMessage[]
  nowTimestamp: number
  onNewProspect: () => void
  onRefresh: () => void
}

export default function Header({
  prospects,
  followUps,
  reminders,
  messages,
  nowTimestamp,
  onNewProspect,
  onRefresh,
}: Props) {
  const total = prospects.length
  const enReunion = prospects.filter((p) => p.stage === 'reunion').length
  const enPropuesta = prospects.filter((p) => p.stage === 'propuesta').length
  const clientes = prospects.filter((p) => p.stage === 'cliente').length
  const followUpsUrgentes = followUps.filter(
    (item) => item.status === 'pendiente' && new Date(item.due_at).getTime() <= nowTimestamp
  ).length
  const remindersUrgentes = reminders.filter(
    (item) => item.status === 'pendiente' && new Date(item.remind_at).getTime() <= nowTimestamp
  ).length
  const inboundHoy = messages.filter((item) => {
    const createdAt = new Date(item.created_at).getTime()
    return item.direction === 'inbound' && createdAt >= nowTimestamp - 24 * 60 * 60 * 1000
  }).length

  const totalValue = prospects
    .filter((p) => p.estimated_value)
    .reduce((acc, p) => acc + (p.estimated_value ?? 0), 0)

  const stats = [
    { label: 'Prospectos', value: total, color: '#6b7280' },
    { label: 'En reunion', value: enReunion, color: '#f59e0b' },
    { label: 'En propuesta', value: enPropuesta, color: '#7c3aed' },
    { label: 'Clientes', value: clientes, color: '#10b981' },
    { label: 'Follow-ups vencidos', value: followUpsUrgentes, color: '#ef4444' },
    { label: 'Inbox 24h', value: inboundHoy, color: '#06b6d4' },
  ]

  return (
    <header className="flex flex-col gap-5 px-6 pt-6 pb-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#7c3aed] shadow-[0_0_10px_#7c3aed]" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7c3aed]">WIS Agency</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#f0f0f0]">CRM Operativo</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6b7280]">
            Pipeline, seguimiento, recordatorios y mensajes de Telegram conectados sobre la misma base de Supabase.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onRefresh}
            className="rounded-xl border border-[#222] px-4 py-2.5 text-sm text-[#c8c8c8] transition-colors hover:border-[#333] hover:text-[#f0f0f0]"
          >
            Actualizar
          </button>
          <button
            onClick={onNewProspect}
            className="rounded-xl bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_#7c3aed30] transition-colors hover:bg-[#6d28d9]"
          >
            Nuevo prospecto
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[#1a1a1a] bg-[#111] px-4 py-3">
            <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="mt-1 text-[11px] text-[#6b7280]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {totalValue > 0 && (
          <div className="rounded-xl border border-[#7c3aed20] bg-[#7c3aed10] px-4 py-2.5">
            <div className="text-[11px] text-[#6b7280]">Valor estimado total</div>
            <div className="text-sm font-mono font-semibold text-[#7c3aed]">
              ${totalValue.toLocaleString('es-AR')}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-[#1a1a1a] bg-[#101010] px-4 py-2.5">
          <div className="text-[11px] text-[#6b7280]">Recordatorios pendientes</div>
          <div className="text-sm font-semibold text-[#f0f0f0]">{remindersUrgentes} urgentes</div>
        </div>
      </div>
    </header>
  )
}
