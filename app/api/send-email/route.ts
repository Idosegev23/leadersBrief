import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshAccessToken, sendGmailEmail } from '@/lib/gmail'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verify auth
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to, toName, subject, html } = body

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Get stored refresh token
    const { data: tokenData } = await supabase
      .from('user_google_tokens')
      .select('refresh_token')
      .eq('user_id', user.id)
      .single()

    if (!tokenData?.refresh_token) {
      return NextResponse.json(
        { error: 'no_token', message: 'יש להתנתק ולהתחבר מחדש כדי לאפשר שליחת מיילים' },
        { status: 403 }
      )
    }

    // Get fresh access token and update DB
    const accessToken = await refreshAccessToken(tokenData.refresh_token)
    await supabase
      .from('user_google_tokens')
      .update({ access_token: accessToken, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    // Send via Gmail API
    const fromName = user.user_metadata?.full_name || user.email || ''
    const result = await sendGmailEmail({
      refreshToken: tokenData.refresh_token,
      from: user.email!,
      fromName,
      to,
      subject,
      html,
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
}
