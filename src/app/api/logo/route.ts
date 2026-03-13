import { NextResponse } from 'next/server'

const LOGO_URL = 'https://res.cloudinary.com/dbftvu8ab/image/upload/v1765430185/Med_Luxe_Logo_1_kohhy1.png'

export async function GET() {
  const res = await fetch(LOGO_URL)
  if (!res.ok) {
    return new NextResponse('Not found', { status: 404 })
  }
  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
