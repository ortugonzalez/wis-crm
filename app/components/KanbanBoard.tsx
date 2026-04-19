'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import { Prospect, Stage, STAGES } from '@/app/lib/types'
import KanbanColumn from './KanbanColumn'
import ProspectCard from './ProspectCard'

interface Props {
  initialProspects: Prospect[]
  onProspectClick: (prospect: Prospect) => void
  onStageChange: (prospectId: string, newStage: Stage) => Promise<void>
}

export default function KanbanBoard({ initialProspects, onProspectClick, onStageChange }: Props) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const groupByStage = (ps: Prospect[]) => {
    const grouped: Record<Stage, Prospect[]> = {
      frio: [], contactado: [], reunion: [], propuesta: [], cliente: [],
    }
    ps.forEach(p => grouped[p.stage]?.push(p))
    return grouped
  }

  const handleDragStart = (event: DragStartEvent) => {
    const prospect = prospects.find(p => p.id === event.active.id)
    if (prospect) setActiveProspect(prospect)
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProspect(null)

    if (!over) return

    const prospect = prospects.find(p => p.id === active.id)
    if (!prospect) return

    const newStage = over.id as Stage
    if (prospect.stage === newStage) return

    // Optimistic update
    setProspects(prev =>
      prev.map(p => p.id === prospect.id ? { ...p, stage: newStage } : p)
    )

    try {
      await onStageChange(prospect.id, newStage)
    } catch {
      // Revert on error
      setProspects(prev =>
        prev.map(p => p.id === prospect.id ? { ...p, stage: prospect.stage } : p)
      )
    }
  }, [prospects, onStageChange])

  const grouped = groupByStage(prospects)

  // Expose update method via ref pattern — simpler: just re-render on prop change
  // Parent will refresh, so we sync when initialProspects changes
  // (handled by key prop in parent)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 px-6">
        {STAGES.map(stage => (
          <KanbanColumn
            key={stage.id}
            stage={stage.id}
            prospects={grouped[stage.id]}
            onCardClick={onProspectClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProspect && (
          <div className="rotate-2 scale-105 shadow-2xl shadow-[#7c3aed40]">
            <ProspectCard
              prospect={activeProspect}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
