import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://pktyehcmwilgtywcsjqq.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdHllaGNtd2lsZ3R5d2NzanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5NTIzOTUsImV4cCI6MjExMDUyODM5NX0.OO4vJmVJacgYEbJKwdJthWmdPKPey8GUmRlgoVNVoL0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
