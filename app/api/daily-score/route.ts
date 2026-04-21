import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function GET() {
  const supabase = getServerSupabase()
  const today = new Date().toISOString().slice(0, 10)

  const { data: closeoutScore, error: closeoutError } = await supabase
    .from('daily_work_scores')
    .select('*')
    .eq('score_date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (closeoutError) {
    return NextResponse.json({ error: closeoutError.message }, { status: 500 })
  }

  if (closeoutScore) {
    return NextResponse.json(closeoutScore)
  }

  const { data: preview, error: previewError } = await supabase
    .from('crm_work_score_today')
    .select('*')
    .single()

  if (previewError) {
    return NextResponse.json({ error: previewError.message }, { status: 500 })
  }

  return NextResponse.json({
    ...preview,
    id: 'preview',
    source: 'system_preview',
    closeout_id: null,
    notes: 'Preview operativo. El score final se genera despues del cierre por Telegram.',
    recommendations: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
}
