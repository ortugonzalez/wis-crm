import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('message_templates')
    .select('*')
    .order('success_count', { ascending: false })
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
    .from('message_templates')
    .insert([{
      name: body.name,
      channel: body.channel || 'whatsapp',
      use_case: body.use_case || 'follow_up',
      tone: body.tone || 'directo',
      body: body.body,
      success_count: Number(body.success_count || 0),
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
