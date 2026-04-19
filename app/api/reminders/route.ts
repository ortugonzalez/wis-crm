import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET(req: Request) {
  const supabase = getServerSupabase()
  const { searchParams } = new URL(req.url)
  const prospectId = searchParams.get('prospect_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('reminders')
    .select('*, prospect:prospects(id, name, company, stage)')
    .order('remind_at', { ascending: true })

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
    .from('reminders')
    .insert([{
      prospect_id: body.prospect_id || null,
      title: body.title,
      message: body.message || null,
      remind_at: body.remind_at,
      status: body.status || 'pendiente',
      category: body.category || 'manual',
    }])
    .select('*, prospect:prospects(id, name, company, stage)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.prospect_id) {
    await supabase.from('activities').insert([{
      prospect_id: body.prospect_id,
      type: 'recordatorio',
      description: body.title,
      metadata: {
        remind_at: body.remind_at,
        category: body.category || 'manual',
      },
    }])
  }

  return NextResponse.json(data, { status: 201 })
}
