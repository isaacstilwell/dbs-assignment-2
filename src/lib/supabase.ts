import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

// Plain client — used as fallback before DataProvider initializes the auth client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Authenticated singleton — one GoTrueClient, token updated via custom fetch
let _authClient: ReturnType<typeof createClient> | null = null
let _currentToken: string | null = null
let _getToken: (() => Promise<string | null>) | null = null

// Called once from DataProvider so the fetch closure can refresh tokens
export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn
}

export function createAuthClient(token: string) {
  _currentToken = token
  if (!_authClient) {
    _authClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: async (url: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers)
          if (_currentToken) headers.set('Authorization', `Bearer ${_currentToken}`)
          const res = await fetch(url, { ...init, headers })

          // On 401, refresh the token and retry once
          if (res.status === 401 && _getToken) {
            const fresh = await _getToken()
            if (fresh) {
              _currentToken = fresh
              const retryHeaders = new Headers(init?.headers)
              retryHeaders.set('Authorization', `Bearer ${fresh}`)
              return fetch(url, { ...init, headers: retryHeaders })
            }
          }

          return res
        },
      },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionFromUrl: false },
    })
  }
  return _authClient
}

// Returns the auth client if initialized, plain client as fallback
export function getAuthClient() {
  return _authClient ?? supabase
}
