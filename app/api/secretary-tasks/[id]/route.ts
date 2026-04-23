import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = getServerSupabase()
  const body = await req.json()

  const allowed = [
    'task_type',
    'title',
    'instruction',
    'expected_response',
    'status',
    'priority',
    'step_number',
    'due_at',
    'reminded_at',
    'completed_at',
    'attempts',
    'payload',
  ]

  const payload = Object.fromEntries(
    allowed
      .filter((key) => key in body)
      .map((key) => [key, key === 'attempts' || key === 'step_number' ? Number(body[key]) : body[key]])
  )

  const { data, error } = await supabase
    .from('secretary_tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
