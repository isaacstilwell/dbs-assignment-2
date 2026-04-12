import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const { origin } = url
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const appUrl = origin

  if (error) {
    return NextResponse.redirect(`${appUrl}/calendar?gcal_error=denied`)
  }
  if (!code) {
    return NextResponse.redirect(`${appUrl}/calendar?gcal_error=no_code`)
  }

  // CSRF check
  const cookieStore = await cookies()
  const savedState = cookieStore.get('gcal_oauth_state')?.value
  if (!state || state !== savedState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/google-calendar/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()
  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(`${appUrl}/calendar?gcal_error=no_tokens`)
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.from('google_calendar_tokens').upsert({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
  })

  const response = NextResponse.redirect(`${appUrl}/calendar`)
  response.cookies.delete('gcal_oauth_state')
  return response
}
