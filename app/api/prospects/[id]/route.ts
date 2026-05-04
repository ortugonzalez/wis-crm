import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

function sanitizeTemperature(value: unknown) {
  const raw = String(value || 'frio').trim().toLowerCase()
  return ['frio', 'tibio', 'caliente'].includes(raw) ? raw : 'frio'
}

function sanitizeDecision(value: unknown) {
  const raw = String(value || 'avanzar').trim().toLowerCase()
  return ['avanzar', 'nutrir', 'pausar', 'descartar'].includes(raw) ? raw : 'avanzar'
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getServerSupabase()
  const { id } = await params
  const body = await req.json()

  const { data: current } = await supabase
    .from('prospects')
    .select('stage')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('prospects')
    .update({
      name: body.name,
      company: body.company,
      email: body.email,
      phone: body.phone,
      channel: body.channel,
      stage: body.stage,
      temperature: sanitizeTemperature(body.temperature),
      temperature_reason: body.temperature_reason ?? null,
      decision_status: sanitizeDecision(body.decision_status),
      decision_reason: body.decision_reason ?? null,
      loss_reason: body.loss_reason ?? null,
      paused_until: body.paused_until ?? null,
      source: body.source,
      notes: body.notes,
      estimated_value: body.estimated_value,
      birthday: body.birthday,
      last_contact_at: body.last_contact_at,
      next_action_at: body.next_action_at,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.stage && current && body.stage !== current.stage) {
    const stageLabels: Record<string, string> = {
      frio: 'Frio',
      contactado: 'Contactado',
      reunion: 'Reunion',
      propuesta: 'Propuesta',
      cliente: 'Cliente',
    }

    await supabase.from('activities').insert([{
      prospect_id: id,
      type: 'stage_change',
      description: `Movido de ${stageLabels[current.stage]} a ${stageLabels[body.stage]}`,
      metadata: {
        from: current.stage,
        to: body.stage,
      },
    }])
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getServerSupabase()
  const { id } = await params

  const { error } = await supabase.from('prospects').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
