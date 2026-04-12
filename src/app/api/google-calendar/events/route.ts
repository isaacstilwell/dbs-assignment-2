import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to params' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tokenRow } = await supabase
    .from('google_calendar_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()

  if (!tokenRow) {
    return NextResponse.json({ connected: false }, { status: 404 })
  }

  let { access_token, refresh_token, expires_at } = tokenRow

  // Refresh access token if it expires within 60 seconds
  if (new Date(expires_at).getTime() - Date.now() < 60_000) {
    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    const refreshed = await refreshRes.json()
    if (refreshed.access_token) {
      access_token = refreshed.access_token
      expires_at = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      await supabase
        .from('google_calendar_tokens')
        .update({ access_token, expires_at })
        .eq('user_id', userId)
    }
  }

  // Fetch events from Google Calendar
  const params = new URLSearchParams({
    timeMin: `${from}T00:00:00Z`,
    timeMax: `${to}T23:59:59Z`,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const gcalRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )

  const data = await gcalRes.json()

  if (data.error) {
    return NextResponse.json({ error: 'gcal_api_error', detail: data.error }, { status: 502 })
  }

  type GCalItem = {
    id: string
    summary?: string
    start: { date?: string; dateTime?: string }
    htmlLink?: string
  }

  const events = ((data.items ?? []) as GCalItem[]).map((item) => ({
    id: item.id,
    title: item.summary ?? '(no title)',
    date: (item.start.date ?? item.start.dateTime ?? '').slice(0, 10),
    allDay: !!item.start.date,
    url: item.htmlLink ?? '',
  }))

  return NextResponse.json({ connected: true, events })
}
