'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SUPER_ADMIN_EMAIL = 'lepemate1310@gmail.com'

async function ensureAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, error: 'No autenticado' }

  const { data: me } = await supabase
    .from('users')
    .select('role, email')
    .eq('auth_user_id', user.id)
    .single()

  if (!me || (me.role !== 'Admin' && me.email?.toLowerCase() !== SUPER_ADMIN_EMAIL)) {
    return { ok: false as const, error: 'Sin permisos de administrador' }
  }
  return { ok: true as const, currentEmail: me.email as string }
}

type Result = { ok: true } | { ok: false; error: string }

export async function inviteUser(name: string, email: string, role: 'Admin' | 'Closer'): Promise<Result> {
  const guard = await ensureAdmin()
  if (!guard.ok) return guard

  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanName || !cleanEmail) return { ok: false, error: 'Nombre y email son requeridos' }
  if (!cleanEmail.includes('@')) return { ok: false, error: 'Email inválido' }

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error de configuración del servidor' }
  }

  // Avoid duplicates
  const { data: existing } = await admin.from('users').select('id').eq('email', cleanEmail).maybeSingle()
  if (existing) return { ok: false, error: 'Ya existe un usuario con ese email' }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(cleanEmail)
  if (inviteError) return { ok: false, error: 'Error al enviar invitación: ' + inviteError.message }

  const initials = cleanName.split(' ').slice(0, 2).map(p => p[0] ?? '').join('').toUpperCase() || cleanName.slice(0, 2).toUpperCase()

  const { error: insertError } = await admin.from('users').insert({
    name: cleanName,
    email: cleanEmail,
    role,
    active: true,
    initials,
    auth_user_id: invited.user?.id ?? null,
  })

  if (insertError) {
    if (invited.user?.id) {
      await admin.auth.admin.deleteUser(invited.user.id)
    }
    return { ok: false, error: 'No se pudo crear el registro: ' + insertError.message }
  }

  revalidatePath('/settings')
  return { ok: true }
}

export async function deleteUserAction(userId: string): Promise<Result> {
  const guard = await ensureAdmin()
  if (!guard.ok) return guard

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error de configuración del servidor' }
  }

  const { data: target } = await admin
    .from('users')
    .select('id, email, auth_user_id')
    .eq('id', userId)
    .single()

  if (!target) return { ok: false, error: 'Usuario no encontrado' }

  if ((target.email ?? '').toLowerCase() === SUPER_ADMIN_EMAIL) {
    return { ok: false, error: 'El SuperAdmin no puede eliminarse' }
  }

  if (target.auth_user_id) {
    const { error: authErr } = await admin.auth.admin.deleteUser(target.auth_user_id)
    if (authErr && !authErr.message.toLowerCase().includes('not found')) {
      return { ok: false, error: 'Error al eliminar de Auth: ' + authErr.message }
    }
  }

  const { error } = await admin.from('users').delete().eq('id', userId)
  if (error) return { ok: false, error: 'Error al eliminar usuario: ' + error.message }

  revalidatePath('/settings')
  return { ok: true }
}
