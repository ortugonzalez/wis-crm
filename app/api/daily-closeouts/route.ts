import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('daily_closeouts')
    .select('*')
    .order('closeout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
