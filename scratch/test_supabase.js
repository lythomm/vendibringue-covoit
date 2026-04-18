import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://otxiiidwdvozskofjlex.supabase.co'
const supabaseAnonKey = 'sb_publishable_rmgYpCtUTR5g-7kfdr-DKw_zLl49ige'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Testing connection...')
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
    
    if (error) {
      console.error('Fetch Error:', error)
    } else {
      console.log('Success! Data:', data)
    }
  } catch (err) {
    console.error('Execution Error:', err)
  }
}

test()
