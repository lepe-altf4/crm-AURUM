import { createClient } from '@/lib/supabase/server'
import StockManager from '@/components/stock/stock-manager'

export default async function StockPage() {
  const supabase = await createClient()

  const [{ data: inventory }, { data: contacts }] = await Promise.all([
    supabase.from('stock').select('*').order('created_at', { ascending: false }),
    supabase.from('leads').select('id, name, car_interest, origin, created_at, stage_id, phone, vendor_id, amount, days, updated_at, stage:pipeline_stages(*)'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <StockManager initialInventory={(inventory ?? []) as any[]} contacts={(contacts ?? []) as any[]} />
}
