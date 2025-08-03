import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  try {
    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(200).json({ 
        message: 'Email already on waitlist',
        alreadyExists: true 
      })
    }

    // Add to waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email,
          created_at: new Date().toISOString(),
          source: 'landing_page'
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to add to waitlist' })
    }

    return res.status(200).json({ 
      message: 'Successfully added to waitlist',
      success: true 
    })

  } catch (error) {
    console.error('Waitlist API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}