import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getServerSupabase()
  const { id } = await params
  const body = await req.json()

  const updatePayload = {
    title: body.title,
    message: body.message,
    remind_at: body.remind_at,
    status: body.status,
    category: body.category,
    completed_at: body.status === 'hecho' ? new Date().toISOString() : body.completed_at ?? null,
  }

  const { data, error } = await supabase
    .from('reminders')
    .update(updatePayload)
    .eq('id', id)
    .select('*, prospect:prospects(id, name, company, stage)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getServerSupabase()
  const { id } = await params
  const { error } = await supabase.from('reminders').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
