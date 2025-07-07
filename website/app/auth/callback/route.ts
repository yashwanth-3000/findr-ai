import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const state = requestUrl.searchParams.get('state')
  const origin = requestUrl.origin

  // Default redirect to home page after successful login
  const next = requestUrl.searchParams.get('next') || '/'

  console.log('Auth callback received with:', {
    code: code ? 'present' : 'missing',
    error: error || 'none',
    errorDescription: errorDescription || 'none',
    state: state || 'none',
    url: requestUrl.toString(),
    hasHash: requestUrl.hash ? true : false,
    searchParams: Object.fromEntries(requestUrl.searchParams),
    headers: {
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin')
    }
  })

  // Check for OAuth errors first
  if (error) {
    console.error('OAuth error received:', {
      error,
      errorDescription,
      fullUrl: requestUrl.toString()
    })
    
    // Redirect to sign-in with error message
    return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = createServerClient()

    try {
      console.log('Attempting to exchange code for session...')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange failed:', exchangeError)
        return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent('Code exchange failed')}`)
      }
      
      if (data.session) {
        console.log('Session created successfully for user:', data.user?.email)
        
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
    } catch (err) {
      console.error('Exception during code exchange:', err)
      return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent('Authentication failed')}`)
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
  const next = String(formData.get('next') ?? '/')

  if (code) {
    const supabase = createServerClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return createAuthRedirectResponse(next)
    }
  }

  // Return to the home page in case of an error
  return createAuthRedirectResponse('/')
} 