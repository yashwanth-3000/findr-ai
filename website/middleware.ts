import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Define routes that should redirect to home if already authenticated
const AUTH_ROUTES = [
  '/signin'
]

export async function middleware(request: NextRequest) {
  try {
    // Create supabase server client
    const supabase = createServerClient()
    
    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Debug logs to help trace the issue
    console.log('Middleware checking path:', request.nextUrl.pathname)
    console.log('Session present:', !!session)
    if (sessionError) {
      console.error('Error getting session:', sessionError)
    }

    const requestUrl = new URL(request.url)
    const pathName = requestUrl.pathname
    
    // Important: Check for auth redirect flag in the URL
    // This is a special flag that indicates the user is being redirected from the auth flow
    // When present, we should not redirect, allowing cookies to properly set
    const isAuthRedirect = requestUrl.searchParams.get('auth_redirect') === 'true'
    
    // If we're in the middle of auth flow, don't interrupt
    if (isAuthRedirect) {
      console.log('Auth flow in progress, skipping middleware redirects')
      return NextResponse.next()
    }
    
    // If user is authenticated and trying to access auth routes (signin), 
    // redirect to home page
    const isAuthRoute = AUTH_ROUTES.some(route => pathName === route || pathName === `${route}/`)
    if (isAuthRoute && session) {
      console.log('Auth route access with active session, redirecting to home page')
      
      // Redirect to home page instead of dashboard
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
    
    // Always allow access to signin page when not authenticated
    if (isAuthRoute && !session) {
      return NextResponse.next()
    }
    
    // Allow the request to continue for all routes
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // In case of error, allow the request to continue
    // This prevents middleware errors from blocking the application
    return NextResponse.next()
  }
}

// Updated matcher to only catch signin pages
export const config = {
  matcher: [
    '/signin',
  ],
} 