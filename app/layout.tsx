import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'טופס לקוחות - לידרס',
  description: 'טופס מילוי בריף ללקוחות לידרס',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  )
}

