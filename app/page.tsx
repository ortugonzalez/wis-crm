'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/app/components/Header'
import KanbanBoard from '@/app/components/KanbanBoard'
import NewProspectForm from '@/app/components/NewProspectForm'
import ProspectModal from '@/app/components/ProspectModal'
import WorkspaceTabs, { WorkspaceTab } from '@/app/components/WorkspaceTabs'
import FollowUpsPanel from '@/app/components/FollowUpsPanel'
import RemindersPanel from '@/app/components/RemindersPanel'
import InboxPanel from '@/app/components/InboxPanel'
import {
  Prospect,
  Stage,
  FollowUp,
  Reminder,
  RawMessage,
  Activity,
  Priority,
  ReminderCategory,
} from '@/app/lib/types'

export default function Home() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [messages, setMessages] = useState<RawMessage[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now())
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null)
  const [boardKey, setBoardKey] = useState(0)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('pipeline')

  const refreshBoard = () => setBoardKey((value) => value + 1)

  const fetchAll = useCallback(async () => {
    try {
      setNowTimestamp(Date.now())
      const [prospectsRes, followUpsRes, remindersRes, messagesRes, activitiesRes] = await Promise.all([
        fetch('/api/prospects'),
        fetch('/api/followups'),
        fetch('/api/reminders'),
        fetch('/api/messages'),
        fetch('/api/activities'),
      ])

      const [prospectsData, followUpsData, remindersData, messagesData, activitiesData] = await Promise.all([
        prospectsRes.json(),
        followUpsRes.json(),
        remindersRes.json(),
        messagesRes.json(),
        activitiesRes.json(),
      ])

      setProspects(Array.isArray(prospectsData) ? prospectsData : [])
      setFollowUps(Array.isArray(followUpsData) ? followUpsData : [])
      setReminders(Array.isArray(remindersData) ? remindersData : [])
      setMessages(Array.isArray(messagesData) ? messagesData : [])
      setActivities(Array.isArray(activitiesData) ? activitiesData : [])
      refreshBoard()
    } catch {
      setProspects([])
      setFollowUps([])
      setReminders([])
      setMessages([])
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void fetchAll()
    })
  }, [fetchAll])

  const selectedProspect = selectedProspectId
    ? prospects.find((prospect) => prospect.id === selectedProspectId) ?? null
    : null

  const handleStageChange = async (prospectId: string, newStage: Stage) => {
    await fetch(`/api/prospects/${prospectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
    setProspects((prev) =>
      prev.map((prospect) => (prospect.id === prospectId ? { ...prospect, stage: newStage } : prospect))
    )
  }

  const handleCreated = async () => {
    setShowNewForm(false)
    await fetchAll()
  }

  const handleUpdated = async () => {
    await fetchAll()
  }

  const handleDeleted = async () => {
    setSelectedProspectId(null)
    await fetchAll()
  }

  const handleCreateFollowUp = async (payload: {
    prospect_id: string
    title: string
    notes: string
    due_at: string
    priority: Priority
  }) => {
    await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    await fetchAll()
  }

  const handleToggleFollowUpDone = async (followUp: FollowUp) => {
    await fetch(`/api/followups/${followUp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...followUp,
        status: followUp.status === 'hecho' ? 'pendiente' : 'hecho',
      }),
    })
    await fetchAll()
  }

  const handleCreateReminder = async (payload: {
    prospect_id: string
    title: string
    message: string
    remind_at: string
    category: ReminderCategory
  }) => {
    await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        prospect_id: payload.prospect_id || null,
      }),
    })
    await fetchAll()
  }

  const handleToggleReminderDone = async (reminder: Reminder) => {
    await fetch(`/api/reminders/${reminder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...reminder,
        status: reminder.status === 'hecho' ? 'pendiente' : 'hecho',
      }),
    })
    await fetchAll()
  }

  const openProspect = (prospectId: string) => {
    setSelectedProspectId(prospectId)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d]">
      <Header
        prospects={prospects}
        followUps={followUps}
        reminders={reminders}
        messages={messages}
        nowTimestamp={nowTimestamp}
        onNewProspect={() => setShowNewForm(true)}
        onRefresh={fetchAll}
      />

      <div className="mx-6 mb-4 h-px bg-[#1a1a1a]" />

      <WorkspaceTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
              <span className="text-sm text-[#6b7280]">Cargando CRM...</span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'pipeline' && (
              <div className="h-full overflow-y-auto pb-6">
                <KanbanBoard
                  key={boardKey}
                  initialProspects={prospects}
                  onProspectClick={(prospect) => openProspect(prospect.id)}
                  onStageChange={handleStageChange}
                />
              </div>
            )}

            {activeTab === 'seguimiento' && (
              <div className="h-full overflow-y-auto">
                <FollowUpsPanel
                  followUps={followUps}
                  prospects={prospects}
                  onCreate={handleCreateFollowUp}
                  onToggleDone={handleToggleFollowUpDone}
                  onOpenProspect={openProspect}
                />
              </div>
            )}

            {activeTab === 'recordatorios' && (
              <div className="h-full overflow-y-auto">
                <RemindersPanel
                  reminders={reminders}
                  prospects={prospects}
                  onCreate={handleCreateReminder}
                  onToggleDone={handleToggleReminderDone}
                  onOpenProspect={openProspect}
                />
              </div>
            )}

            {activeTab === 'inbox' && (
              <div className="h-full overflow-y-auto">
                <InboxPanel messages={messages} activities={activities} onOpenProspect={openProspect} />
              </div>
            )}
          </>
        )}
      </div>

      {showNewForm && (
        <NewProspectForm
          onClose={() => setShowNewForm(false)}
          onCreated={handleCreated}
        />
      )}

      {selectedProspect && (
        <ProspectModal
          key={selectedProspect.id}
          prospect={selectedProspect}
          onClose={() => setSelectedProspectId(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
