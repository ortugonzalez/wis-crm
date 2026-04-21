import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServerSupabase()
  const body = await req.json()

  const payload = {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description || null } : {}),
    ...(body.category !== undefined ? { category: body.category } : {}),
    ...(body.target_count !== undefined ? { target_count: Number(body.target_count) } : {}),
    ...(body.completed_count !== undefined ? { completed_count: Number(body.completed_count) } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.due_date !== undefined ? { due_date: body.due_date || null } : {}),
  }

  const { data, error } = await supabase
    .from('goal_tasks')
    .update(payload)
    .eq('id', id)
    .select('*, goal:monthly_goals(id, title, month)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
