import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('secretary_preferences')
    .select('*')
    .eq('singleton_key', 'ortu')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json()

  const payload = {
    mode: body.mode,
    work_start_hour: Number(body.work_start_hour),
    work_end_hour: Number(body.work_end_hour),
    reminder_minutes: Number(body.reminder_minutes),
    max_attempts: Number(body.max_attempts),
    max_open_tasks: Number(body.max_open_tasks),
    display_name: body.display_name,
    role_title: body.role_title,
    monthly_intent: body.monthly_intent || null,
    current_focus: body.current_focus || null,
    preferred_segments: parseStringArray(body.preferred_segments),
    priority_channels: parseStringArray(body.priority_channels),
    energy_mode: body.energy_mode,
    current_state: body.current_state,
    coaching_style: body.coaching_style,
    relationship_goal: body.relationship_goal || null,
    context_notes: body.context_notes || null,
    daily_contact_target: Number(body.daily_contact_target),
    daily_followup_target: Number(body.daily_followup_target),
    daily_proposal_target: Number(body.daily_proposal_target),
    one_thing_rule: body.one_thing_rule === undefined ? undefined : Boolean(body.one_thing_rule),
  }

  const sanitized = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && !Number.isNaN(value))
  )

  const { data, error } = await supabase
    .from('secretary_preferences')
    .update(sanitized)
    .eq('singleton_key', 'ortu')
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
