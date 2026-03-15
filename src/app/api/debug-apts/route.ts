import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { syncFromGoogleCalendar } from '@/actions/google-calendar'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Test insert WITHOUT treatment_name (column doesn't exist in production)
  const { data: realPatient } = await supabase
    .from('patients')
    .select('id')
    .limit(1)
    .single()

  const testGCalId = 'test_debug_apt_' + Date.now()
  let aptError = null
  let aptSuccess = false
  if (realPatient?.id) {
    const { error: ae } = await supabase
      .from('appointments')
      .insert({
        clinic_id: '00000000-0000-0000-0000-000000000001',
        patient_id: realPatient.id,
        professional_id: '53a4c0bc-1cca-47ff-95cc-a2aaed4fb1cd',
        scheduled_at: new Date().toISOString(),
        duration_minutes: 60,
        status: 'scheduled',
        notes: 'Tratamiento: Test Debug',
        google_event_id: testGCalId,
      })
    aptError = ae
    aptSuccess = !ae
    if (!ae) {
      await supabase.from('appointments').delete().eq('google_event_id', testGCalId)
    }
  }

  // Count current appointments
  const { count: currentCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })

  // Run the actual GCal sync for pamelamoquete's user ID
  const syncResult = aptSuccess
    ? await syncFromGoogleCalendar('53a4c0bc-1cca-47ff-95cc-a2aaed4fb1cd')
    : { skipped: 0, imported: 0, errors: 0, error: 'Skipped sync - insert test failed' }

  // Count after sync
  const { count: afterCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    insertTest: {
      success: aptSuccess,
      error: aptError ? { code: aptError.code, message: aptError.message } : null,
    },
    beforeSync: currentCount,
    syncResult,
    afterSync: afterCount,
  })
}
