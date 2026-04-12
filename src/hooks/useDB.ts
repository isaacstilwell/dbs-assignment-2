'use client'

import { useAuth } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export function useDB() {
  const { userId } = useAuth()
  return { client: supabase, userId }
}
