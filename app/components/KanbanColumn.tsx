'use client'

import { useDroppable } from '@dnd-kit/core'
import { Prospect, Stage, STAGES } from '@/app/lib/types'
import ProspectCard from './ProspectCard'

interface Props {
  stage: Stage
  prospects: Prospect[]
  onCardClick: (prospect: Prospect) => void
}

export default function KanbanColumn({ stage, prospects, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const stageConfig = STAGES.find(s => s.id === stage)!

  return (
    <div className="flex flex-col min-w-[280px] w-[280px]">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: stageConfig.color }}
          />
          <span className="text-sm font-semibold text-[#f0f0f0]">
            {stageConfig.label}
          </span>
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: stageConfig.bg,
            color: stageConfig.color,
          }}
        >
          {prospects.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2.5 rounded-xl p-2.5 min-h-[200px] transition-colors duration-150"
        style={{
          backgroundColor: isOver ? stageConfig.bg : '#0f0f0f',
          border: `1px solid ${isOver ? stageConfig.color + '40' : '#1a1a1a'}`,
        }}
      >
        {prospects.map((p) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            onClick={() => onCardClick(p)}
          />
        ))}

        {prospects.length === 0 && !isOver && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[11px] text-[#333] select-none">Sin prospectos</span>
          </div>
        )}
      </div>
    </div>
  )
}
