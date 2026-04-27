import { createClient } from '@/lib/supabase/server'
import LeadsHub from '@/components/leads/leads-hub'

export default async function LeadsPage() {
  const supabase = await createClient()

  const [{ data: contacts }, { data: stages }, { data: profiles }] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(*), vendor:users(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('users').select('*').eq('active', true),
  ])

  return (
    <LeadsHub
      initialContacts={(contacts ?? []) as any[]}
      stages={(stages ?? []) as any[]}
      vendors={(profiles ?? []) as any[]}
    />
  )
}
