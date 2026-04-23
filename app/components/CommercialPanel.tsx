'use client'

import { useState } from 'react'
import {
  CommercialEngine,
  CommercialPlaybook,
  MonthlyGoal,
  SalesCampaign,
  MessageTemplate,
} from '@/app/lib/types'

interface Props {
  engine: CommercialEngine | null
  campaigns: SalesCampaign[]
  playbooks: CommercialPlaybook[]
  templates: MessageTemplate[]
  goals: MonthlyGoal[]
  onCreateCampaign: (payload: {
    name: string
    objective: string
    business_area: string
    target_channel: string
    target_count: number
    daily_target: number
    goal_id: string
    notes: string
  }) => Promise<void>
  onCreatePlaybook: (payload: {
    name: string
    segment: string
    channel: string
    opening_message: string
    follow_up_message: string
    proposal_angle: string
    qualification_questions: string[]
  }) => Promise<void>
}

const defaultPlaybooks = [
  {
    name: 'Hoteles - primer contacto',
    segment: 'hoteles',
    channel: 'email',
    opening_message: 'Estoy contactando hoteles que quieren ordenar mejor sus oportunidades comerciales. Tiene sentido que te cuente en 2 minutos?',
    follow_up_message: 'Te retomo por esto. Si hoy no es prioridad, decime y lo dejamos agendado para otro momento.',
    proposal_angle: 'Reducir oportunidades perdidas y ordenar seguimiento de potenciales clientes.',
    qualification_questions: ['Cuantos leads reciben por mes?', 'Como hacen seguimiento?', 'Que se les cae hoy del proceso?'],
  },
  {
    name: 'Logisticas - prospeccion',
    segment: 'logisticas',
    channel: 'linkedin',
    opening_message: 'Vi que trabajan con operaciones/logistica y queria entender si hoy estan buscando mejorar captacion o seguimiento comercial.',
    follow_up_message: 'Te dejo esta pregunta simple: si pudieras mejorar una parte del proceso comercial, cual seria?',
    proposal_angle: 'Detectar empresas con necesidad de volumen, orden y seguimiento.',
    qualification_questions: ['A que tipo de cliente venden?', 'Tienen equipo comercial?', 'Cuanto tarda un cierre promedio?'],
  },
]

export default function CommercialPanel({
  engine,
  campaigns,
  playbooks,
  templates,
  goals,
  onCreateCampaign,
  onCreatePlaybook,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    objective: '',
    business_area: 'general',
    target_channel: 'otro',
    target_count: 100,
    daily_target: 20,
    goal_id: '',
    notes: '',
  })
  const [playbookForm, setPlaybookForm] = useState(defaultPlaybooks[0])

  const createCampaign = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!campaignForm.name.trim()) return
    setSaving(true)
    try {
      await onCreateCampaign(campaignForm)
      setCampaignForm((prev) => ({ ...prev, name: '', objective: '', notes: '' }))
    } finally {
      setSaving(false)
    }
  }

  const createPlaybook = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!playbookForm.name.trim()) return
    setSaving(true)
    try {
      await onCreatePlaybook(playbookForm)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 px-6 pb-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-4">
        <section className="rounded-3xl border border-[#1a1a1a] bg-[radial-gradient(circle_at_top_left,#0f3f2e_0,#111_34%,#0d0d0d_100%)] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[#10b981]">Command center</div>
              <h2 className="mt-3 text-2xl font-black text-[#f0f0f0]">Mision comercial</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b7b7b7]">
                {engine?.mission ?? 'Carga objetivos, campanas y actividad para activar el motor comercial.'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#ffffff12] bg-[#00000030] px-5 py-4">
              <div className="text-xs text-[#8a8a8a]">Forecast</div>
              <div className={`mt-2 text-3xl font-black ${
                engine?.forecast.status === 'verde'
                  ? 'text-[#10b981]'
                  : engine?.forecast.status === 'amarillo'
                    ? 'text-[#f59e0b]'
                    : 'text-[#ef4444]'
              }`}>
                {engine?.forecast.status ?? 'sin datos'}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <Metric label="objetivo" value={engine?.forecast.targetClients ?? 0} />
            <Metric label="clientes" value={engine?.forecast.currentClients ?? 0} />
            <Metric label="esperado hoy" value={engine?.forecast.expectedByToday ?? 0} />
            <Metric label="pipeline" value={engine?.forecast.weightedPipeline ?? 0} />
            <Metric label="proyeccion" value={engine?.forecast.projectedClients ?? 0} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Insight title="Acciones de hoy" items={engine?.todayActions ?? []} />
          <Insight title="Riesgos" items={engine?.risks ?? []} />
          <Insight title="Oportunidades" items={engine?.opportunities ?? []} />
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Campanas activas</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {campaigns.length === 0 && <Empty text="Todavia no hay campanas. Crea una para ordenar la prospeccion." />}
            {campaigns.map((campaign) => {
              const progress = campaign.target_count
                ? Math.min(100, Math.round((campaign.completed_count / campaign.target_count) * 100))
                : 0
              return (
                <div key={campaign.id} className="rounded-2xl border border-[#222] bg-[#0d0d0d] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[#f0f0f0]">{campaign.name}</h3>
                      <p className="mt-1 text-xs text-[#6b7280]">{campaign.business_area} - {campaign.target_channel}</p>
                    </div>
                    <span className="rounded-full bg-[#10b98118] px-3 py-1 text-xs font-semibold text-[#10b981]">
                      {campaign.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-5 text-[#b7b7b7]">{campaign.objective || campaign.notes || 'Sin objetivo escrito.'}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#1a1a1a]">
                    <div className="h-full rounded-full bg-[#10b981]" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-[#8a8a8a]">
                    {campaign.completed_count}/{campaign.target_count} acciones - ritmo diario sugerido {campaign.daily_target}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Mensajes sugeridos</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {(engine?.suggestedMessages ?? []).map((message) => (
              <div key={message.title} className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                <div className="text-xs font-semibold text-[#10b981]">{message.title}</div>
                <p className="mt-2 text-sm leading-5 text-[#c8c8c8]">{message.body}</p>
              </div>
            ))}
            {templates.slice(0, 3).map((template) => (
              <div key={template.id} className="rounded-xl border border-[#222] bg-[#0d0d0d] p-4">
                <div className="text-xs font-semibold text-[#7c3aed]">{template.name}</div>
                <p className="mt-2 text-sm leading-5 text-[#c8c8c8]">{template.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <form onSubmit={createCampaign} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Nueva campana</h2>
          <div className="mt-4 space-y-3">
            <input value={campaignForm.name} onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Ej: Hoteles abril" className="field" />
            <input value={campaignForm.objective} onChange={(e) => setCampaignForm((prev) => ({ ...prev, objective: e.target.value }))} placeholder="Objetivo: agendar 10 reuniones" className="field" />
            <div className="grid grid-cols-2 gap-2">
              <input value={campaignForm.business_area} onChange={(e) => setCampaignForm((prev) => ({ ...prev, business_area: e.target.value }))} placeholder="segmento" className="field" />
              <select value={campaignForm.target_channel} onChange={(e) => setCampaignForm((prev) => ({ ...prev, target_channel: e.target.value }))} className="field">
                <option value="whatsapp">WhatsApp</option>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={1} value={campaignForm.target_count} onChange={(e) => setCampaignForm((prev) => ({ ...prev, target_count: Number(e.target.value) }))} className="field" />
              <input type="number" min={1} value={campaignForm.daily_target} onChange={(e) => setCampaignForm((prev) => ({ ...prev, daily_target: Number(e.target.value) }))} className="field" />
            </div>
            <select value={campaignForm.goal_id} onChange={(e) => setCampaignForm((prev) => ({ ...prev, goal_id: e.target.value }))} className="field">
              <option value="">Sin objetivo vinculado</option>
              {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
            </select>
            <textarea value={campaignForm.notes} onChange={(e) => setCampaignForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Notas de enfoque" className="field resize-none" />
          </div>
          <button disabled={saving || !campaignForm.name.trim()} className="mt-4 w-full rounded-xl bg-[#10b981] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">
            Crear campana
          </button>
        </form>

        <form onSubmit={createPlaybook} className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Playbook comercial</h2>
          <div className="mt-4 space-y-3">
            <select value={playbookForm.name} onChange={(e) => setPlaybookForm(defaultPlaybooks.find((item) => item.name === e.target.value) ?? defaultPlaybooks[0])} className="field">
              {defaultPlaybooks.map((playbook) => <option key={playbook.name} value={playbook.name}>{playbook.name}</option>)}
            </select>
            <textarea value={playbookForm.opening_message} onChange={(e) => setPlaybookForm((prev) => ({ ...prev, opening_message: e.target.value }))} rows={3} className="field resize-none" />
            <textarea value={playbookForm.follow_up_message} onChange={(e) => setPlaybookForm((prev) => ({ ...prev, follow_up_message: e.target.value }))} rows={3} className="field resize-none" />
          </div>
          <button disabled={saving} className="mt-4 w-full rounded-xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">
            Guardar playbook
          </button>
        </form>

        <section className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
          <h2 className="text-base font-semibold text-[#f0f0f0]">Playbooks guardados</h2>
          <div className="mt-4 space-y-3">
            {playbooks.length === 0 && <Empty text="Guarda un playbook para estandarizar mensajes." />}
            {playbooks.map((playbook) => (
              <div key={playbook.id} className="rounded-xl bg-[#0d0d0d] p-3">
                <div className="text-sm font-semibold text-[#f0f0f0]">{playbook.name}</div>
                <div className="mt-1 text-xs text-[#6b7280]">{playbook.segment} - {playbook.channel}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#ffffff10] bg-[#00000024] p-4">
      <div className="text-2xl font-black text-[#f0f0f0]">{value}</div>
      <div className="mt-1 text-xs text-[#8a8a8a]">{label}</div>
    </div>
  )
}

function Insight({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] p-5">
      <h2 className="text-base font-semibold text-[#f0f0f0]">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <Empty text="Sin alertas por ahora." />}
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-[#0d0d0d] px-3 py-2 text-sm leading-5 text-[#c8c8c8]">{item}</div>
        ))}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[#222] px-4 py-6 text-sm text-[#6b7280]">{text}</div>
}
