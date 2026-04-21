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
import GoalsPanel from '@/app/components/GoalsPanel'
import {
  Prospect,
  Stage,
  FollowUp,
  Reminder,
  RawMessage,
  Activity,
  Priority,
  ReminderCategory,
  DailyWorkPlan,
  GoalTask,
  GoalTaskCategory,
  MonthlyGoal,
  WorkActivityLog,
  WorkActivityType,
} from '@/app/lib/types'

interface DailyScore {
  score_date: string
  score: number
  contacts_count: number
  follow_ups_done: number
  proposals_sent: number
  meetings_count: number
  goal_progress_points: number
}

export default function Home() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [messages, setMessages] = useState<RawMessage[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [goals, setGoals] = useState<MonthlyGoal[]>([])
  const [dailyPlans, setDailyPlans] = useState<DailyWorkPlan[]>([])
  const [workActivities, setWorkActivities] = useState<WorkActivityLog[]>([])
  const [dailyScore, setDailyScore] = useState<DailyScore | null>(null)
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
      const [
        prospectsRes,
        followUpsRes,
        remindersRes,
        messagesRes,
        activitiesRes,
        goalsRes,
        dailyPlansRes,
        workActivitiesRes,
        dailyScoreRes,
      ] = await Promise.all([
        fetch('/api/prospects'),
        fetch('/api/followups'),
        fetch('/api/reminders'),
        fetch('/api/messages'),
        fetch('/api/activities'),
        fetch('/api/goals'),
        fetch('/api/daily-plans'),
        fetch('/api/work-activities'),
        fetch('/api/daily-score'),
      ])

      const [
        prospectsData,
        followUpsData,
        remindersData,
        messagesData,
        activitiesData,
        goalsData,
        dailyPlansData,
        workActivitiesData,
        dailyScoreData,
      ] = await Promise.all([
        prospectsRes.json(),
        followUpsRes.json(),
        remindersRes.json(),
        messagesRes.json(),
        activitiesRes.json(),
        goalsRes.json(),
        dailyPlansRes.json(),
        workActivitiesRes.json(),
        dailyScoreRes.json(),
      ])

      setProspects(Array.isArray(prospectsData) ? prospectsData : [])
      setFollowUps(Array.isArray(followUpsData) ? followUpsData : [])
      setReminders(Array.isArray(remindersData) ? remindersData : [])
      setMessages(Array.isArray(messagesData) ? messagesData : [])
      setActivities(Array.isArray(activitiesData) ? activitiesData : [])
      setGoals(Array.isArray(goalsData) ? goalsData : [])
      setDailyPlans(Array.isArray(dailyPlansData) ? dailyPlansData : [])
      setWorkActivities(Array.isArray(workActivitiesData) ? workActivitiesData : [])
      setDailyScore(dailyScoreData && !dailyScoreData.error ? dailyScoreData : null)
      refreshBoard()
    } catch {
      setProspects([])
      setFollowUps([])
      setReminders([])
      setMessages([])
      setActivities([])
      setGoals([])
      setDailyPlans([])
      setWorkActivities([])
      setDailyScore(null)
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

  const handleCreateGoal = async (payload: {
    title: string
    description: string
    month: string
    target_value: number
    unit: string
  }) => {
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    await fetchAll()
  }

  const handleCreateGoalTask = async (payload: {
    goal_id: string
    title: string
    category: GoalTaskCategory
    target_count: number
    due_date: string
  }) => {
    await fetch('/api/goal-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    await fetchAll()
  }

  const handleToggleGoalTask = async (task: GoalTask) => {
    await fetch(`/api/goal-tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completed_count: task.status === 'hecho' ? 0 : task.target_count,
        status: task.status === 'hecho' ? 'pendiente' : 'hecho',
      }),
    })
    await fetchAll()
  }

  const handleLogWorkActivity = async (payload: {
    type: WorkActivityType
    quantity: number
    title: string
    notes: string
    prospect_id: string
    goal_id: string
  }) => {
    await fetch('/api/work-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

            {activeTab === 'objetivos' && (
              <div className="h-full overflow-y-auto">
                <GoalsPanel
                  goals={goals}
                  dailyPlans={dailyPlans}
                  workActivities={workActivities}
                  dailyScore={dailyScore}
                  prospects={prospects}
                  onCreateGoal={handleCreateGoal}
                  onCreateTask={handleCreateGoalTask}
                  onToggleTask={handleToggleGoalTask}
                  onLogActivity={handleLogWorkActivity}
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
