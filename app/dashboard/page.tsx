'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientEmail, setClientEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    })
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const createBriefLink = async (email?: string) => {
    if (!user) return null

    const { data, error } = await supabase
      .from('brief_links')
      .insert({
        creator_id: user.id,
        creator_email: user.email,
        creator_name: user.user_metadata?.full_name || user.email,
        client_email: email || null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const buildEmailHtml = (briefLink: string, creatorName: string, recipientName: string, message: string) => {
    const messageHtml = message
      ? `<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#374151;white-space:pre-line">${message}</p>`
      : ''

    return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07)">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1e3a8a 0%,#0ea5e9 100%);padding:32px 40px;text-align:center">
<img src="https://leaders-brief.vercel.app/logo.png" alt="Leaders" width="140" style="margin-bottom:12px">
<h1 style="margin:0;font-size:22px;color:#ffffff;font-weight:700">בריף לקוח</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:36px 40px">
<p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1e3a8a">${recipientName ? `שלום ${recipientName},` : 'שלום,'}</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#374151"><strong>${creatorName}</strong> מזמין אותך למלא בריף עבור הפרויקט שלנו יחד.</p>
${messageHtml}
<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 28px">
<a href="${briefLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#1e3a8a 0%,#0ea5e9 100%);color:#ffffff;text-decoration:none;font-size:18px;font-weight:700;padding:14px 48px;border-radius:12px;letter-spacing:0.5px">מלא את הבריף</a>
</td></tr></table>

<div style="background-color:#f0f9ff;border-radius:12px;padding:20px 24px;border-right:4px solid #0ea5e9">
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1e3a8a">מה זה בריף?</p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563">שאלון קצר שעוזר לנו להבין את הצרכים שלך, את קהל היעד, המטרות והתקציב — כדי שנוכל ליצור עבורך את המהלך השיווקי המושלם.</p>
</div>
</td></tr>

<!-- Footer -->
<tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb">
<p style="margin:0 0 4px;font-size:13px;color:#9ca3af">נשלח על ידי <strong style="color:#6b7280">${creatorName}</strong> דרך Leaders</p>
<p style="margin:0;font-size:12px;color:#d1d5db">© ${new Date().getFullYear()} Leaders Group. All rights reserved.</p>
</td></tr>

</table>
</td></tr></table>
</body>
</html>`
  }

  const handleSendEmail = async () => {
    setEmailError('')
    if (!clientEmail || !clientEmail.includes('@')) {
      setEmailError('יש להזין כתובת מייל תקינה')
      return
    }

    setIsCreating(true)
    try {
      const briefLink = await createBriefLink(clientEmail)
      const link = `${window.location.origin}/brief/${briefLink.token}`
      const creatorName = user!.user_metadata?.full_name || user!.email!
      const subject = `${creatorName} מזמין אותך למלא בריף — Leaders`
      const html = buildEmailHtml(link, creatorName, clientName, customMessage)

      // Send via Gmail API (from the user's own email)
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: clientEmail,
          toName: clientName,
          subject,
          html,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        if (result.error === 'no_token') {
          alert('יש להתנתק ולהתחבר מחדש כדי לאפשר שליחת מיילים')
        } else {
          alert(result.message || 'אירעה שגיאה בשליחת המייל')
        }
        return
      }

      setSendSuccess(true)
      setClientEmail('')
      setClientName('')
      setCustomMessage('')
      setTimeout(() => setSendSuccess(false), 3000)
    } catch (error) {
      console.error('Error:', error)
      alert('אירעה שגיאה. אנא נסה שנית.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleGenerateLink = async () => {
    setIsCreating(true)
    try {
      const briefLink = await createBriefLink()
      const link = `${window.location.origin}/brief/${briefLink.token}`
      setGeneratedLink(link)
    } catch (error) {
      console.error('Error:', error)
      alert('אירעה שגיאה. אנא נסה שנית.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 md:py-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-3 md:px-4 mb-6 md:mb-8">
        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Leaders Logo"
                width={120}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user?.user_metadata?.full_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-all"
              >
                התנתק
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-3 md:px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
          שליחת בריף ללקוח
        </h1>

        <div className="grid gap-4 md:gap-6">
          {/* Option A: Send via email */}
          <div className="bg-white rounded-xl shadow-md p-5 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">שליחה במייל</h2>
                <p className="text-sm text-gray-500">הזן את המייל של הלקוח ושלח לו את הבריף</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">שם הלקוח</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="שם הלקוח (אופציונלי)"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm md:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">מייל הלקוח *</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => {
                      setClientEmail(e.target.value)
                      setEmailError('')
                    }}
                    placeholder="email@example.com"
                    dir="ltr"
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm md:text-base ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">הוסף הודעה אישית (אופציונלי)</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="היי, אשמח שתמלא את הבריף הזה כדי שנוכל להתחיל לעבוד על הפרויקט..."
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm md:text-base resize-none"
                />
              </div>

              <button
                onClick={handleSendEmail}
                disabled={isCreating}
                className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'שלח בריף במייל'
                )}
              </button>
            </div>

            {emailError && (
              <p className="mt-2 text-sm text-red-600">{emailError}</p>
            )}

            {sendSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                הבריף נשלח בהצלחה!
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-gray-400 font-medium text-sm">או</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Option B: Generate link */}
          <div className="bg-white rounded-xl shadow-md p-5 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-800">יצירת קישור</h2>
                <p className="text-sm text-gray-500">צור קישור והעתק אותו לשליחה ידנית</p>
              </div>
            </div>

            {!generatedLink ? (
              <button
                onClick={handleGenerateLink}
                disabled={isCreating}
                className="w-full bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  'צור קישור'
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    dir="ltr"
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-50 text-sm md:text-base text-gray-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-all whitespace-nowrap text-sm md:text-base"
                  >
                    {copied ? 'הועתק!' : 'העתק'}
                  </button>
                </div>
                <button
                  onClick={() => setGeneratedLink('')}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  צור קישור חדש
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
