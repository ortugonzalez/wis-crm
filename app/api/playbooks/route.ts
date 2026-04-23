import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('commercial_playbooks')
    .select('*')
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
    .from('commercial_playbooks')
    .insert([{
      name: body.name,
      segment: body.segment || 'general',
      channel: body.channel || 'whatsapp',
      opening_message: body.opening_message,
      follow_up_message: body.follow_up_message,
      proposal_angle: body.proposal_angle,
      qualification_questions: Array.isArray(body.qualification_questions)
        ? body.qualification_questions
        : [],
      status: body.status || 'activo',
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
