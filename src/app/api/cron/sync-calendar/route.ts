import { NextResponse, type NextRequest } from 'next/server'
import { syncAllConnectedCalendars } from '@/actions/google-calendar'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Cron de Vercel: sincroniza (pull) las citas desde Google Calendar de todos los
 * usuarios conectados. Protegido: solo invocaciones de Vercel Cron (header
 * x-vercel-cron) o con el bearer CRON_SECRET si está configurado.
 */
export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get('x-vercel-cron') !== null
  const cronSecret = process.env.CRON_SECRET
  const authorized =
    isVercelCron ||
    (cronSecret && request.headers.get('authorization') === `Bearer ${cronSecret}`)

  if (!authorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const result = await syncAllConnectedCalendars()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[Cron sync-calendar] error:', err)
    return NextResponse.json({ ok: false, error: 'sync failed' }, { status: 500 })
  }
}
