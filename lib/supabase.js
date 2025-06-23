// lib/supabase.js
import { createClient } from '@supabase/supabase-js'
import { cookieStorage } from './cookieStorage'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      // sessiyaları persist et, auto‐refresh et
      persistSession: true,
      autoRefreshToken: true,
      // default localStorage yerinə cookieStorage istifadə et
      storage: cookieStorage
    }
  }
)

export default supabase