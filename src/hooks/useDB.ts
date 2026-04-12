'use client'

import { useAuth } from '@clerk/nextjs'
import { getAuthClient } from '@/lib/supabase'

export function useDB() {
  const { userId } = useAuth()
  return { client: getAuthClient(), userId }
}
