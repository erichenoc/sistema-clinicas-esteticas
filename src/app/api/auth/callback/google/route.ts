import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client } from '@/lib/google-calendar'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // Contains the user ID
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/configuracion/google-calendar?error=access_denied`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/configuracion/google-calendar?error=missing_params`
    )
  }

  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        `${baseUrl}/configuracion/google-calendar?error=no_tokens`
      )
    }

    // Store tokens in Supabase
    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from('google_calendar_tokens')
      .upsert({
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (upsertError) {
      console.error('Error storing Google Calendar tokens:', upsertError)
      return NextResponse.redirect(
        `${baseUrl}/configuracion/google-calendar?error=storage_failed`
      )
    }

    return NextResponse.redirect(
      `${baseUrl}/configuracion/google-calendar?success=connected`
    )
  } catch (err) {
    console.error('Error during Google Calendar OAuth:', err)
    return NextResponse.redirect(
      `${baseUrl}/configuracion/google-calendar?error=auth_failed`
    )
  }
}
