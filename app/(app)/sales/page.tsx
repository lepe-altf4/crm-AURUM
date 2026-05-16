import { createClient } from '@/lib/supabase/server'
import SalesPanel from '@/components/sales/sales-panel'

export default async function SalesPage() {
  const supabase = await createClient()

  const [
    { data: leads },
    { data: stages },
    { data: vendors },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('*, stage:pipeline_stages(*), vendor:users(*)')
      .order('updated_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('order'),
    supabase.from('users').select('id, name, initials, role').eq('active', true),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <SalesPanel
      initialLeads={(leads ?? []) as any[]}
      stages={(stages ?? []) as any[]}
      vendors={(vendors ?? []) as any[]}
    />
  )
}
