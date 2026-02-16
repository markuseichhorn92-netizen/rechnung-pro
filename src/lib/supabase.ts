import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wkkoinaeplzcclosnlrn.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_D4kGTd9-vhCDokE6lV95-A_o2w61XO_'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabaseUrl, supabaseAnonKey }
