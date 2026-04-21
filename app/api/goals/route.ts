import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

interface GoalTaskInput {
  title?: string
  description?: string
  category?: string
  target_count?: number | string
  completed_count?: number | string
  status?: string
  due_date?: string
}

function currentMonthStart() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export async function GET(req: Request) {
  const supabase = getServerSupabase()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const month = searchParams.get('month')

  let query = supabase
    .from('monthly_goals')
    .select('*, tasks:goal_tasks(*)')
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (month) {
    query = query.eq('month', month)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json()

  const payload = {
    title: body.title,
    description: body.description || null,
    month: body.month || currentMonthStart(),
    target_value: Number(body.target_value || 1),
    current_value: Number(body.current_value || 0),
    unit: body.unit || 'acciones',
    status: body.status || 'activo',
  }

  const { data, error } = await supabase
    .from('monthly_goals')
    .insert([payload])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const tasks: GoalTaskInput[] = Array.isArray(body.tasks) ? body.tasks : []
  if (tasks.length > 0) {
    await supabase.from('goal_tasks').insert(
      tasks
        .filter((task) => task.title)
        .map((task) => ({
          goal_id: data.id,
          title: task.title,
          description: task.description || null,
          category: task.category || 'otro',
          target_count: Number(task.target_count || 1),
          completed_count: Number(task.completed_count || 0),
          status: task.status || 'pendiente',
          due_date: task.due_date || null,
        }))
    )
  }

  return NextResponse.json(data, { status: 201 })
}
