import { redirect } from 'next/navigation'

// Middleware handles auth-based redirects.
// This is a fallback in case middleware doesn't catch it.
export default function Home() {
  redirect('/login')
}
