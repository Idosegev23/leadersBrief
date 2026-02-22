import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendGmailEmail } from '@/lib/gmail'
import { isOlderThanNBusinessDays } from '@/lib/businessDays'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function buildReminderEmailHtml(params: {
  creatorName: string
  clientEmail: string
  briefLink: string
  daysPassed: number
  language: string
}) {
  const { creatorName, clientEmail, briefLink, daysPassed, language } = params

  if (language === 'en') {
    return `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f0f8;font-family:Arial,Helvetica,sans-serif;direction:ltr;color:#1a1a2e;line-height:1.8">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f8;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,26,46,0.08)">

<tr><td align="center" style="padding:50px 40px 20px">
<img src="https://leaders-brief.vercel.app/_next/image?url=%2Flogo.png&w=384&q=75" width="160" alt="Leaders" style="display:block" />
</td></tr>

<tr><td align="center" style="padding:10px 40px 5px">
<div style="font-size:28px;font-weight:bold;color:#1a1a2e;margin:0">Follow-Up Reminder</div>
</td></tr>
<tr><td align="center" style="padding:8px 0 30px">
<table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#f0c040;height:3px;width:60px;font-size:1px;line-height:3px">&nbsp;</td></tr></table>
</td></tr>

<tr><td style="padding:0 40px">
<table width="100%" cellpadding="24" cellspacing="0" border="0" style="background-color:#1a1a2e;border-radius:10px;margin-bottom:24px">
<tr><td>
<div style="font-size:10px;font-weight:bold;color:#f0c040;text-transform:uppercase;margin-bottom:10px">&#9888; PENDING BRIEF</div>
<div style="font-size:20px;font-weight:bold;color:#ffffff;margin-bottom:12px">Hello ${creatorName},</div>
<div style="font-size:16px;color:#ffffff;line-height:1.8;opacity:0.9">The brief sent to <strong style="color:#f0c040">${clientEmail}</strong> has not been filled yet. It has been <strong style="color:#e94560">${daysPassed} business days</strong> since it was sent.</div>
</td></tr>
</table>

<table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color:#fafbfe;border:1px solid #f0f0f8;border-radius:10px;margin-bottom:28px">
<tr><td>
<div style="font-size:10px;font-weight:bold;color:#e94560;text-transform:uppercase;margin-bottom:10px">&#9679; RECOMMENDED ACTION</div>
<div style="font-size:14px;color:#1a1a2e;line-height:1.9">We recommend reaching out to the client and reminding them to fill out the brief. You can resend the link below or contact them directly.</div>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:0 0 36px">
<a href="${briefLink}" target="_blank" style="display:inline-block;background-color:#e94560;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 48px;border-radius:8px;letter-spacing:0.5px">View Brief Link</a>
</td></tr></table>

</td></tr>

<tr><td style="background-color:#1a1a2e;padding:28px 40px;text-align:center">
<div style="font-size:12px;color:#8e8ea0;margin-bottom:4px">Automatic reminder from <strong style="color:#e94560">Leaders Brief</strong></div>
<div style="font-size:11px;color:rgba(255,255,255,0.3)">&copy; ${new Date().getFullYear()} Leaders Group. All rights reserved.</div>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`
  }

  // Hebrew (default)
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f0f8;font-family:Arial,Helvetica,sans-serif;direction:rtl;color:#1a1a2e;line-height:1.8">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f8;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(26,26,46,0.08)">

<tr><td align="center" style="padding:50px 40px 20px">
<img src="https://leaders-brief.vercel.app/_next/image?url=%2Flogo.png&w=384&q=75" width="160" alt="Leaders" style="display:block" />
</td></tr>

<tr><td align="center" style="padding:10px 40px 5px">
<div style="font-size:28px;font-weight:bold;color:#1a1a2e;margin:0">תזכורת מעקב</div>
</td></tr>
<tr><td align="center" style="padding:8px 0 30px">
<table cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#f0c040;height:3px;width:60px;font-size:1px;line-height:3px">&nbsp;</td></tr></table>
</td></tr>

<tr><td style="padding:0 40px">
<table width="100%" cellpadding="24" cellspacing="0" border="0" style="background-color:#1a1a2e;border-radius:10px;margin-bottom:24px">
<tr><td>
<div style="font-size:10px;font-weight:bold;color:#f0c040;text-transform:uppercase;margin-bottom:10px">&#9888; בריף ממתין</div>
<div style="font-size:20px;font-weight:bold;color:#ffffff;margin-bottom:12px">שלום ${creatorName},</div>
<div style="font-size:16px;color:#ffffff;line-height:1.8;opacity:0.9">הבריף שנשלח ל-<strong style="color:#f0c040">${clientEmail}</strong> טרם מולא. עברו <strong style="color:#e94560">${daysPassed} ימי עסקים</strong> מאז השליחה.</div>
</td></tr>
</table>

<table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color:#fafbfe;border:1px solid #f0f0f8;border-radius:10px;margin-bottom:28px">
<tr><td>
<div style="font-size:10px;font-weight:bold;color:#e94560;text-transform:uppercase;margin-bottom:10px">&#9679; מה מומלץ לעשות?</div>
<div style="font-size:14px;color:#1a1a2e;line-height:1.9">מומלץ ליצור קשר עם הלקוח ולהזכיר לו למלא את הבריף. ניתן לשלוח מחדש את הקישור למטה או לפנות ישירות.</div>
</td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:0 0 36px">
<a href="${briefLink}" target="_blank" style="display:inline-block;background-color:#e94560;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 48px;border-radius:8px;letter-spacing:0.5px">צפה בקישור הבריף</a>
</td></tr></table>

</td></tr>

<tr><td style="background-color:#1a1a2e;padding:28px 40px;text-align:center">
<div style="font-size:12px;color:#8e8ea0;margin-bottom:4px">תזכורת אוטומטית מ-<strong style="color:#e94560">Leaders Brief</strong></div>
<div style="font-size:11px;color:rgba(255,255,255,0.3)">© ${new Date().getFullYear()} Leaders Group. All rights reserved.</div>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`
}

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch pending briefs that haven't had a reminder sent
    const { data: pendingBriefs, error } = await supabase
      .from('brief_links')
      .select('id, token, creator_id, creator_email, creator_name, client_email, language, created_at')
      .eq('status', 'pending')
      .is('reminder_sent_at', null)
      .not('client_email', 'is', null)

    if (error) {
      console.error('DB query error:', error)
      return NextResponse.json({ error: 'db_error' }, { status: 500 })
    }

    if (!pendingBriefs || pendingBriefs.length === 0) {
      return NextResponse.json({ message: 'No pending briefs to remind', count: 0 })
    }

    // Filter to those older than 7 business days
    const overdueBriefs = pendingBriefs.filter((brief) =>
      isOlderThanNBusinessDays(new Date(brief.created_at), 7)
    )

    if (overdueBriefs.length === 0) {
      return NextResponse.json({ message: 'No overdue briefs', count: 0 })
    }

    // Get unique creator IDs and fetch their tokens
    const creatorIds = [...new Set(overdueBriefs.map((b) => b.creator_id))]
    const { data: tokens } = await supabase
      .from('user_google_tokens')
      .select('user_id, refresh_token')
      .in('user_id', creatorIds)

    const tokenMap = new Map(tokens?.map((t) => [t.user_id, t.refresh_token]) || [])

    let sentCount = 0
    const errors: string[] = []

    for (const brief of overdueBriefs) {
      const refreshToken = tokenMap.get(brief.creator_id)
      if (!refreshToken) {
        errors.push(`No token for creator ${brief.creator_email}`)
        continue
      }

      const briefLink = `https://leaders-brief.vercel.app/brief/${brief.token}`
      const creatorName = brief.creator_name || brief.creator_email
      const daysPassed = Math.floor(
        (Date.now() - new Date(brief.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      const subject = brief.language === 'en'
        ? `Reminder: ${brief.client_email} hasn't filled the brief yet — Leaders`
        : `תזכורת: ${brief.client_email} טרם מילא את הבריף — Leaders`

      const html = buildReminderEmailHtml({
        creatorName,
        clientEmail: brief.client_email!,
        briefLink,
        daysPassed,
        language: brief.language || 'he',
      })

      try {
        await sendGmailEmail({
          refreshToken,
          from: brief.creator_email,
          fromName: creatorName,
          to: brief.creator_email, // Send to self (creator)
          subject,
          html,
        })

        // Mark reminder as sent
        await supabase
          .from('brief_links')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', brief.id)

        sentCount++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push(`Failed for ${brief.client_email}: ${msg}`)
        console.error(`Reminder failed for brief ${brief.id}:`, msg)
      }
    }

    return NextResponse.json({
      message: `Processed ${overdueBriefs.length} overdue briefs`,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
