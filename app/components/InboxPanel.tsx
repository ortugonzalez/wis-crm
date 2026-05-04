'use client'

import { useState } from 'react'
import { RawMessage, Activity } from '@/app/lib/types'
import { formatDateTime } from '@/app/lib/dates'

interface Props {
  messages: RawMessage[]
  activities: Activity[]
  onOpenProspect: (prospectId: string) => void
  onMessageSent?: () => void
}

export default function InboxPanel({ messages, activities, onOpenProspect, onMessageSent }: Props) {
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound'>('all')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const filteredMessages = messages.filter((message) => {
    if (filter === 'all') return true
    return message.direction === filter
  })

  const handleReply = async (message: RawMessage) => {
    const chatId = message.metadata?.chat_id as string | undefined
    if (!chatId || !replyText.trim()) return

    setSending(true)
    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText.trim(),
          prospect_id: message.prospect_id || null,
        }),
      })
      setReplyText('')
      setReplyingTo(null)
      onMessageSent?.()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] px-6 pb-6">
      <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#f0f0f0]">Inbox de mensajes</h2>
            <p className="mt-1 text-sm text-[#6b7280]">Todo lo que entra o sale desde Telegram queda visible aca.</p>
          </div>

          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'inbound', label: 'Entrantes' },
              { id: 'outbound', label: 'Salientes' },
            ].map((item) => {
              const active = filter === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as 'all' | 'inbound' | 'outbound')}
                  className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                    active ? 'bg-[#7c3aed] text-white' : 'bg-[#161616] text-[#c8c8c8] hover:bg-[#1d1d1d]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredMessages.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#222] px-4 py-6 text-sm text-[#6b7280]">
              No hay mensajes para este filtro.
            </div>
          )}

          {filteredMessages.map((message) => {
            const chatId = message.metadata?.chat_id as string | undefined
            const canReply = message.direction === 'inbound' && !!chatId
            const isReplying = replyingTo === message.id

            return (
              <div key={message.id} className="rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      message.direction === 'inbound'
                        ? 'bg-[#06b6d420] text-[#06b6d4]'
                        : 'bg-[#10b98120] text-[#10b981]'
                    }`}
                  >
                    {message.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                  </span>
                  <span className="rounded-full bg-[#161616] px-2.5 py-1 text-[11px] text-[#c8c8c8]">
                    {message.kind}
                  </span>
                  <span className="text-xs text-[#6b7280]">{formatDateTime(message.created_at)}</span>
                  {canReply && (
                    <button
                      onClick={() => {
                        setReplyingTo(isReplying ? null : message.id)
                        setReplyText('')
                      }}
                      className="ml-auto rounded-full bg-[#7c3aed15] px-3 py-1 text-[11px] text-[#7c3aed] transition-colors hover:bg-[#7c3aed25]"
                    >
                      {isReplying ? 'Cancelar' : 'Responder'}
                    </button>
                  )}
                </div>

                {message.prospect && (
                  <button
                    onClick={() => onOpenProspect(message.prospect!.id)}
                    className="mt-2 text-sm font-semibold text-[#f0f0f0] hover:text-[#7c3aed]"
                  >
                    {message.prospect.name}{message.prospect.company ? ` - ${message.prospect.company}` : ''}
                  </button>
                )}

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#a0a0a0]">
                  {message.content || '(mensaje sin contenido textual)'}
                </p>

                {isReplying && (
                  <div className="mt-3 flex gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(message)
                      }}
                      placeholder="Escribe tu respuesta..."
                      rows={2}
                      className="flex-1 resize-none rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2 text-sm text-[#f0f0f0] placeholder-[#6b7280] focus:border-[#7c3aed50] focus:outline-none"
                    />
                    <button
                      onClick={() => handleReply(message)}
                      disabled={sending || !replyText.trim()}
                      className="self-end rounded-xl bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#6d28d9] disabled:opacity-40"
                    >
                      {sending ? '...' : 'Enviar'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
        <h2 className="text-base font-semibold text-[#f0f0f0]">Actividad reciente</h2>
        <p className="mt-1 text-sm text-[#6b7280]">Log operativo del CRM.</p>

        <div className="mt-4 space-y-3">
          {activities.slice(0, 20).map((activity) => (
            <div key={activity.id} className="rounded-xl border border-[#1a1a1a] bg-[#0e0e0e] px-4 py-3">
              <div className="text-sm text-[#f0f0f0]">{activity.description || activity.type}</div>
              <div className="mt-1 text-xs text-[#6b7280]">{formatDateTime(activity.created_at)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
