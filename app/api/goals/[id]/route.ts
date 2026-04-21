import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = getServerSupabase()
  const body = await req.json()

  const payload = {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description || null } : {}),
    ...(body.month !== undefined ? { month: body.month } : {}),
    ...(body.target_value !== undefined ? { target_value: Number(body.target_value) } : {}),
    ...(body.current_value !== undefined ? { current_value: Number(body.current_value) } : {}),
    ...(body.unit !== undefined ? { unit: body.unit } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
  }

  const { data, error } = await supabase
    .from('monthly_goals')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
