import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  // Default redirect to company dashboard for our simplified company-only app
  const next = requestUrl.searchParams.get('next') || '/company/dashboard'

  console.log('Auth callback received with:', {
    code: code ? 'present' : 'missing',
    error: requestUrl.searchParams.get('error') || 'none',
    url: requestUrl.toString(),
    hasHash: requestUrl.hash ? true : false,
    searchParams: Object.fromEntries(requestUrl.searchParams)
  })

  if (code) {
    const supabase = createServerClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // In development, always redirect to localhost
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // In production, use the forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // Fallback to origin
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  console.log('No code or token found, redirecting to token handler as fallback')
  
  // Return to the token handler as a fallback
  return NextResponse.redirect(`${origin}/auth/token-handler`)
}

// Helper function to create redirect responses consistently
function createAuthRedirectResponse(path: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  console.log(`Creating auth redirect to: ${origin}${path}`)
  
  return NextResponse.redirect(`${origin}${path}`, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

// Handle CSRF error
export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const formData = await request.formData()
  const code = String(formData.get('code') ?? '')
  const next = String(formData.get('next') ?? '/company/dashboard')

  if (code) {
    const supabase = createServerClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return createAuthRedirectResponse(next)
    }
  }

  // Return to the origin URL in case of an error
  return createAuthRedirectResponse('/company/dashboard')
} 