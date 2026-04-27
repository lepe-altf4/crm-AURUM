import { createClient } from '@/lib/supabase/server'
import ExecutiveDashboard from '@/components/dashboard/executive-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: contacts },
    { data: inventory },
    { data: weeklySales },
    { data: profiles },
    { data: recentClosed },
  ] = await Promise.all([
    supabase.from('leads').select('id, amount, stage_id, vendor_id'),
    supabase.from('stock').select('id, price, status'),
    supabase.from('weekly_sales').select('*').order('created_at'),
    supabase.from('users').select('id, name, initials').eq('active', true),
    supabase
      .from('leads')
      .select('id, name, car_interest, amount, created_at, vendor_id, vendor:users!leads_vendor_id_fkey(name)')
      .eq('stage_id', 's5')
      .order('updated_at', { ascending: false })
      .limit(5),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <ExecutiveDashboard
      contacts={(contacts ?? []) as any[]}
      inventory={(inventory ?? []) as any[]}
      weeklySales={(weeklySales ?? []) as any[]}
      profiles={(profiles ?? []) as any[]}
      recentClosed={(recentClosed ?? []) as any[]}
    />
  )
}
