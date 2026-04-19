'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Prospect, CHANNELS } from '@/app/lib/types'
import { formatDateTime } from '@/app/lib/dates'

interface Props {
  prospect: Prospect
  onClick: () => void
}

const channelIcons: Record<string, string> = {
  whatsapp: 'WA',
  linkedin: 'IN',
  email: 'EM',
  referido: 'RF',
  telegram: 'TG',
  otro: '--',
}

export default function ProspectCard({ prospect, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: prospect.id,
    data: { prospect },
  })

  const channel = CHANNELS.find((entry) => entry.id === prospect.channel)

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="group relative select-none rounded-xl border border-[#222] bg-[#161616] p-4 transition-all duration-150 hover:border-[#333] hover:shadow-[0_0_12px_#7c3aed20]"
    >
      {prospect.company && (
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#6b7280]">
          {prospect.company}
        </div>
      )}

      <div className="mb-3 text-sm font-semibold leading-tight text-[#f0f0f0]">
        {prospect.name}
      </div>

      {prospect.next_action_at && (
        <div className="mb-3 rounded-lg border border-[#1f1f1f] bg-[#121212] px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wider text-[#6b7280]">Proxima accion</div>
          <div className="mt-1 text-[11px] text-[#c8c8c8]">{formatDateTime(prospect.next_action_at)}</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#101010] px-1.5 py-1 text-[10px] font-semibold text-[#c8c8c8]">
            {channelIcons[prospect.channel] ?? '--'}
          </span>
          <span className="text-[11px] text-[#6b7280]">{channel?.label}</span>
        </div>

        {prospect.estimated_value && (
          <div className="text-[11px] font-mono text-[#7c3aed]">
            ${prospect.estimated_value.toLocaleString('es-AR')}
          </div>
        )}
      </div>

      <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-40">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="4" cy="3" r="1" fill="#6b7280" />
          <circle cx="8" cy="3" r="1" fill="#6b7280" />
          <circle cx="4" cy="6" r="1" fill="#6b7280" />
          <circle cx="8" cy="6" r="1" fill="#6b7280" />
          <circle cx="4" cy="9" r="1" fill="#6b7280" />
          <circle cx="8" cy="9" r="1" fill="#6b7280" />
        </svg>
      </div>
    </div>
  )
}
