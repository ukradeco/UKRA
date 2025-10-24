import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types'

export function createClient() {
  return createSupabaseClient<Database>(
    'https://oivieqzmdexuphjwpvdo.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdmllcXptZGV4dXBoandwdmRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM2MjcsImV4cCI6MjA3NjQ4OTYyN30.k_iIiISsuQ0ncH7vVA8d1WwW1M-51PjK-PTbtDHynx4'
  )
}
