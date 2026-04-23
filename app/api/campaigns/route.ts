import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

function toNumber(value: unknown, fallback: number) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('sales_campaigns')
    .select('*, goal:monthly_goals(id, title, month)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('sales_campaigns')
    .insert([{
      name: body.name,
      objective: body.objective || null,
      business_area: body.business_area || 'general',
      target_channel: body.target_channel || 'otro',
      target_count: toNumber(body.target_count, 1),
      completed_count: toNumber(body.completed_count, 0),
      daily_target: toNumber(body.daily_target, 10),
      start_date: body.start_date || new Date().toISOString().slice(0, 10),
      end_date: body.end_date || null,
      goal_id: body.goal_id || null,
      notes: body.notes || null,
      status: body.status || 'activa',
    }])
    .select('*, goal:monthly_goals(id, title, month)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
