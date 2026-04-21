import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('goal_tasks')
    .insert([{
      goal_id: body.goal_id || null,
      title: body.title,
      description: body.description || null,
      category: body.category || 'otro',
      target_count: Number(body.target_count || 1),
      completed_count: Number(body.completed_count || 0),
      status: body.status || 'pendiente',
      due_date: body.due_date || null,
    }])
    .select('*, goal:monthly_goals(id, title, month)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
