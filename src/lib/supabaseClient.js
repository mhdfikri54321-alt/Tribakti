import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let client = null
export async function ensureSupabase() {
  if (!isConfigured) return null
  if (client) return client
  try {
    const mod = await import('@supabase/supabase-js')
    client = mod.createClient(supabaseUrl, supabaseAnonKey)
    return client
  } catch (e) {
    console.error('Supabase module not installed', e)
    return null
  }
}

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null
