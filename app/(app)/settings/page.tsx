import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSettings from '@/components/settings/admin-settings'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'Admin') redirect('/leads')

  const [{ data: profiles }, { data: stages }, { data: contacts }] = await Promise.all([
    supabase.from('users').select('*').order('created_at'),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('leads').select('id, stage_id'),
  ])

  return (
    <AdminSettings
      initialProfiles={(profiles ?? []) as any[]}
      initialStages={(stages ?? []) as any[]}
      contacts={(contacts ?? []) as any[]}
    />
  )
}
