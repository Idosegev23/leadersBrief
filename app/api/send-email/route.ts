import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to refresh token: ${error}`)
  }

  const data = await res.json()
  return data.access_token
}

function buildRawEmail(
  from: string,
  fromName: string,
  to: string,
  subject: string,
  htmlBody: string
): string {
  const boundary = 'boundary_' + Date.now()

  const lines = [
    `From: "${fromName}" <${from}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlBody).toString('base64'),
    '',
    `--${boundary}--`,
  ]

  return lines.join('\r\n')
}

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

    // Get fresh access token
    const accessToken = await refreshAccessToken(tokenData.refresh_token)

    // Update stored access token
    await supabase
      .from('user_google_tokens')
      .update({ access_token: accessToken, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    // Build and send email via Gmail API
    const fromName = user.user_metadata?.full_name || user.email || ''
    const rawEmail = buildRawEmail(user.email!, fromName, to, subject, html)
    const encodedEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const gmailRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      }
    )

    if (!gmailRes.ok) {
      const error = await gmailRes.text()
      console.error('Gmail API error:', error)
      return NextResponse.json(
        { error: 'gmail_error', message: 'שגיאה בשליחת המייל' },
        { status: 500 }
      )
    }

    const result = await gmailRes.json()
    return NextResponse.json({ success: true, messageId: result.id })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'server_error', message: 'שגיאה בשרת' },
      { status: 500 }
    )
  }
}
