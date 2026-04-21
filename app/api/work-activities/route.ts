import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET(req: Request) {
  const supabase = getServerSupabase()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  let query = supabase
    .from('work_activity_log')
    .select('*, prospect:prospects(id, name, company, stage), goal:monthly_goals(id, title, month)')
    .order('created_at', { ascending: false })

  if (date) {
    query = query.eq('activity_date', date)
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
    .from('work_activity_log')
    .insert([{
      activity_date: body.activity_date || new Date().toISOString().slice(0, 10),
      type: body.type || 'otro',
      quantity: Number(body.quantity || 1),
      title: body.title,
      notes: body.notes || null,
      prospect_id: body.prospect_id || null,
      goal_id: body.goal_id || null,
      metadata: body.metadata || {},
    }])
    .select('*, prospect:prospects(id, name, company, stage), goal:monthly_goals(id, title, month)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
