import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

type TMVenue = {
  name?: string
  city?: { name?: string }
  state?: { name?: string }
}

type TMEvent = {
  id: string
  name: string
  url: string
  info?: string
  dates: {
    start: {
      localDate?: string
      localTime?: string
    }
  }
  _embedded?: { venues?: TMVenue[] }
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim()
  const location = url.searchParams.get('location')?.trim()

  if (!q) return NextResponse.json({ error: 'Missing query param q' }, { status: 400 })

  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Ticketmaster not configured' }, { status: 503 })

  const params = new URLSearchParams({
    apikey: apiKey,
    keyword: q,
    size: '20',
    sort: 'date,asc',
    startDateTime: new Date().toISOString().slice(0, 19) + 'Z',
  })
  if (location) params.set('city', location)

  const res = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: 'Ticketmaster API error', detail: err },
      { status: res.status }
    )
  }

  const data = await res.json()
  const raw: TMEvent[] = data._embedded?.events ?? []

  const events = raw.map((e) => {
    const date = e.dates.start.localDate ?? ''
    const time = e.dates.start.localTime?.slice(0, 5) ?? ''

    const venue = e._embedded?.venues?.[0]
    let location = 'Location TBD'
    if (venue) {
      const parts = [venue.name, venue.city?.name, venue.state?.name].filter(Boolean)
      if (parts.length) location = parts.join(', ')
    }

    return {
      id: e.id,
      title: e.name,
      date,
      time,
      location,
      url: e.url,
      description: (e.info ?? '').slice(0, 200).trim(),
    }
  })

  return NextResponse.json({ events })
}
