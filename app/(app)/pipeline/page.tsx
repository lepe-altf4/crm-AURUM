import { createClient } from '@/lib/supabase/server'
import VisualPipeline from '@/components/pipeline/visual-pipeline'

export default async function PipelinePage() {
  const supabase = await createClient()

  const [{ data: contacts }, { data: stages }, { data: vendors }] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(*), vendor:users(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('users').select('*').eq('active', true),
  ])

  return (
    <VisualPipeline
      initialContacts={(contacts ?? []) as any[]}
      stages={(stages ?? []) as any[]}
      vendors={(vendors ?? []) as any[]}
    />
  )
}
