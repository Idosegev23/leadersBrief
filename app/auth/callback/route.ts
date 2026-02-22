import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Store Google provider tokens for Gmail API access
      const providerToken = data.session.provider_token
      const providerRefreshToken = data.session.provider_refresh_token

      if (providerRefreshToken) {
        await supabase
          .from('user_google_tokens')
          .upsert(
            {
              user_id: data.session.user.id,
              refresh_token: providerRefreshToken,
              access_token: providerToken || '',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
