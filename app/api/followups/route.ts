import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET(req: Request) {
  const supabase = getServerSupabase()
  const { searchParams } = new URL(req.url)
  const prospectId = searchParams.get('prospect_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('follow_ups')
    .select('*, prospect:prospects(id, name, company, stage)')
    .order('due_at', { ascending: true })

  if (prospectId) {
    query = query.eq('prospect_id', prospectId)
  }

  if (status) {
    query = query.eq('status', status)
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
    .from('follow_ups')
    .insert([{
      prospect_id: body.prospect_id,
      title: body.title,
      notes: body.notes || null,
      due_at: body.due_at,
      status: body.status || 'pendiente',
      priority: body.priority || 'media',
      source: body.source || 'manual',
    }])
    .select('*, prospect:prospects(id, name, company, stage)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('activities').insert([{
    prospect_id: body.prospect_id,
    type: 'follow_up',
    description: body.title,
    metadata: {
      due_at: body.due_at,
      priority: body.priority || 'media',
    },
  }])

  return NextResponse.json(data, { status: 201 })
}
