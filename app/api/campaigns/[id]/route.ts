import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

function cleanPatch(body: Record<string, unknown>) {
  const allowed = [
    'name',
    'objective',
    'business_area',
    'target_channel',
    'target_count',
    'completed_count',
    'daily_target',
    'start_date',
    'end_date',
    'goal_id',
    'notes',
    'status',
  ]

  return Object.fromEntries(
    allowed
      .filter((key) => key in body)
      .map((key) => {
        if (['target_count', 'completed_count', 'daily_target'].includes(key)) {
          return [key, Number(body[key] || 0)]
        }

        return [key, body[key] || null]
      })
  )
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = getServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('sales_campaigns')
    .update(cleanPatch(body))
    .eq('id', id)
    .select('*, goal:monthly_goals(id, title, month)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
