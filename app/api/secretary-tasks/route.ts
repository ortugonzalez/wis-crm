import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET(req: Request) {
  const supabase = getServerSupabase()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('secretary_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('secretary_tasks')
    .insert([{
      task_date: body.task_date || new Date().toISOString().slice(0, 10),
      task_type: body.task_type || 'micro_mission',
      title: body.title,
      instruction: body.instruction,
      expected_response: body.expected_response || null,
      status: body.status || 'pendiente',
      priority: body.priority || 'media',
      step_number: Number(body.step_number || 1),
      due_at: body.due_at || null,
      payload: body.payload || {},
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
