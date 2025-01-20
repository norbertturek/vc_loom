import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { SUPABASE_CONFIG } from './supabase-config'

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.key) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.key,
  SUPABASE_CONFIG.options
) 