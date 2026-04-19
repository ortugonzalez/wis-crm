import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json()

  const payload = {
    name: body.name,
    company: body.company || null,
    email: body.email || null,
    phone: body.phone || null,
    channel: body.channel || 'otro',
    stage: body.stage || 'frio',
    source: body.source || 'manual',
    notes: body.notes || null,
    estimated_value: body.estimated_value || null,
    birthday: body.birthday || null,
    last_contact_at: body.last_contact_at || null,
    next_action_at: body.next_action_at || null,
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert([payload])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('activities').insert([{
    prospect_id: data.id,
    type: 'nota',
    description: `Prospecto creado via canal ${payload.channel}`,
    metadata: { source: payload.source },
  }])

  return NextResponse.json(data, { status: 201 })
}
