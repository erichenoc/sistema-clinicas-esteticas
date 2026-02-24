import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
  )
}

export function getAuthUrl(state?: string) {
  const oauth2Client = getOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: state || '',
  })
}

export async function getCalendarClient(tokens: { access_token: string; refresh_token: string }) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials(tokens)
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function refreshTokens(refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

// Create a Google Calendar event from an appointment
export function appointmentToGoogleEvent(appointment: {
  treatmentName?: string | null
  patientName: string
  scheduledAt: string
  durationMinutes: number
  notes?: string | null
  professionalName?: string
}) {
  const startDate = new Date(appointment.scheduledAt)
  const endDate = new Date(startDate.getTime() + appointment.durationMinutes * 60000)

  return {
    summary: `${appointment.treatmentName || 'Cita'} - ${appointment.patientName}`,
    description: [
      `Paciente: ${appointment.patientName}`,
      appointment.treatmentName ? `Tratamiento: ${appointment.treatmentName}` : '',
      appointment.professionalName ? `Profesional: ${appointment.professionalName}` : '',
      appointment.notes ? `Notas: ${appointment.notes}` : '',
      '',
      'Creado desde Med Luxe Clinic'
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'America/Santo_Domingo',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'America/Santo_Domingo',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
      ],
    },
  }
}
