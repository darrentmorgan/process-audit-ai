import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a mock client if Supabase is not configured
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    signOut: () => Promise.resolve({ error: null }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
    updateUser: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } })
      })
    }),
    insert: () => ({
      select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
    }),
    upsert: () => ({
      select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ error: new Error('Supabase not configured') })
    })
  })
})

export const supabase = (!supabaseUrl || !supabaseAnonKey) 
  ? createMockClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })