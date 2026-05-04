import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/app/lib/server-supabase'

export async function POST(req: Request) {
  const { chat_id, text, prospect_id } = await req.json()

  if (!chat_id || !text?.trim()) {
    return NextResponse.json({ error: 'chat_id y text son requeridos' }, { status: 400 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN no configurado' }, { status: 500 })
  }

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, text }),
  })

  if (!tgRes.ok) {
    const err = await tgRes.json().catch(() => ({}))
    return NextResponse.json({ error: 'Error enviando a Telegram', detail: err }, { status: 502 })
  }

  const tgData = await tgRes.json()
  const telegramMessageId = String(tgData?.result?.message_id ?? '')

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from('raw_messages')
    .insert([{
      prospect_id: prospect_id || null,
      source: 'telegram',
      direction: 'outbound',
      kind: 'text',
      content: text,
      telegram_message_id: telegramMessageId || null,
      metadata: { chat_id },
    }])
    .select('*, prospect:prospects(id, name, company, stage)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
