import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('daily_work_plans')
    .select('*')
    .order('plan_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('daily_work_plans')
    .insert([{
      plan_date: body.plan_date || new Date().toISOString().slice(0, 10),
      summary: body.summary,
      priorities: body.priorities || [],
      score_start: body.score_start ?? null,
      generated_by: body.generated_by || 'manual',
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
