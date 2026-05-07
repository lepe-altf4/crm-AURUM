import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  // Accept several common variable names so a config typo doesn't break this
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    ''

  if (!url || !key) {
    const missing: string[] = []
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL (o SUPABASE_URL)')
    if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY')

    const seen = Object.keys(process.env)
      .filter(k => /SUPABASE|SERVICE_ROLE|NEXT_PUBLIC/i.test(k))
      .sort()

    console.error('[admin client] Missing env vars:', missing, '| Available:', seen)

    throw new Error(
      `Faltan variables de entorno: ${missing.join(', ')}. ` +
      `Variables detectadas en runtime: ${seen.length ? seen.join(', ') : '(ninguna)'}. ` +
      `En Netlify, asegurate de que el scope sea "All scopes" o incluya "Functions" y "Runtime", y redeploy el sitio.`
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
