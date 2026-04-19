import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET(req: Request) {
  const supabase = getServerSupabase()
  const { searchParams } = new URL(req.url)
  const prospectId = searchParams.get('prospect_id')

  let query = supabase
    .from('raw_messages')
    .select('*, prospect:prospects(id, name, company, stage)')
    .order('created_at', { ascending: false })

  if (prospectId) {
    query = query.eq('prospect_id', prospectId)
  }

  const { data, error } = await query.limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('raw_messages')
    .insert([{
      prospect_id: body.prospect_id || null,
      source: body.source || 'telegram',
      direction: body.direction,
      kind: body.kind || 'text',
      content: body.content || null,
      telegram_message_id: body.telegram_message_id || null,
      metadata: body.metadata || {},
    }])
    .select('*, prospect:prospects(id, name, company, stage)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.prospect_id) {
    await supabase.from('activities').insert([{
      prospect_id: body.prospect_id,
      type: 'mensaje',
      description: body.content || `${body.direction} ${body.kind || 'text'}`,
      metadata: {
        direction: body.direction,
        kind: body.kind || 'text',
      },
    }])
  }

  return NextResponse.json(data, { status: 201 })
}
