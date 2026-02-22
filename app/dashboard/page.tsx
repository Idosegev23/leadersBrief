'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'

const WEBHOOK_URL = 'https://hook.eu2.make.com/uryu3mv7m9tu3dtbkqto6qfdbnrdbjr0'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientEmail, setClientEmail] = useState('')
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

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _type: 'send_brief',
          client_email: clientEmail,
          brief_link: link,
          creator_email: user!.email,
          creator_name: user!.user_metadata?.full_name || user!.email,
        }),
      })

      setSendSuccess(true)
      setClientEmail('')
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

            <div className="flex gap-2">
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value)
                  setEmailError('')
                }}
                placeholder="email@example.com"
                dir="ltr"
                className={`flex-1 px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm md:text-base ${
                  emailError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                onClick={handleSendEmail}
                disabled={isCreating}
                className="bg-primary text-white px-5 md:px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm md:text-base"
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'שלח'
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
