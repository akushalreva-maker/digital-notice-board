import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey
)
export const supabaseConfigMessage =
  'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file, then restart the development server.'

export const supabase = isSupabaseConfigured
 ? createClient(supabaseUrl, supabasePublishableKey)
  : null
