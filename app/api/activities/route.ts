import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET(req: Request) {
  const supabase = getServerSupabase()
  const { searchParams } = new URL(req.url)
  const prospectId = searchParams.get('prospect_id')

  let query = supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })

  if (prospectId) {
    query = query.eq('prospect_id', prospectId)
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

  const { data, error } = await supabase
    .from('activities')
    .insert([{
      prospect_id: body.prospect_id,
      type: body.type,
      description: body.description || null,
      metadata: body.metadata || {},
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
