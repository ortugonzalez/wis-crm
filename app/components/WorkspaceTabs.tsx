'use client'

export type WorkspaceTab = 'pipeline' | 'objetivos' | 'comercial' | 'seguimiento' | 'recordatorios' | 'inbox'

interface Props {
  activeTab: WorkspaceTab
  onChange: (tab: WorkspaceTab) => void
}

const tabs: { id: WorkspaceTab; label: string; description: string }[] = [
  { id: 'pipeline', label: 'Pipeline', description: 'Kanban comercial' },
  { id: 'objetivos', label: 'Objetivos', description: 'Metas, tareas y score diario' },
  { id: 'comercial', label: 'Comercial', description: 'Campanas, forecast y playbooks' },
  { id: 'seguimiento', label: 'Seguimiento', description: 'Follow-ups y proximas acciones' },
  { id: 'recordatorios', label: 'Recordatorios', description: 'Alertas y agenda' },
  { id: 'inbox', label: 'Inbox', description: 'Mensajes que llegan desde Telegram' },
]

export default function WorkspaceTabs({ activeTab, onChange }: Props) {
  return (
    <div className="px-6 pb-4">
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const active = tab.id === activeTab

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                active
                  ? 'border-[#7c3aed50] bg-[#7c3aed15] shadow-[0_0_20px_#7c3aed20]'
                  : 'border-[#1a1a1a] bg-[#101010] hover:border-[#333]'
              }`}
            >
              <div className={`text-sm font-semibold ${active ? 'text-[#f0f0f0]' : 'text-[#c8c8c8]'}`}>
                {tab.label}
              </div>
              <div className="mt-1 text-xs text-[#6b7280]">{tab.description}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
