import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const oauthError = searchParams.get('error_code') ?? searchParams.get('error')

  // Sirf same-site relative path allow karo (open redirect se bachne ke liye)
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Vercel/proxy ke peeche sahi host use karo
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocal = process.env.NODE_ENV === 'development'
      if (!isLocal && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.code ?? 'auth_failed')}`)
  }

  const safeCode = oauthError && /^[a-z0-9_]{1,64}$/.test(oauthError) ? oauthError : 'missing_code'
  return NextResponse.redirect(`${origin}/auth/error?error=${safeCode}`)
}
