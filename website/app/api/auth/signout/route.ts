import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  // Always redirect to home page after sign out
  const redirectTo = '/'
  
  console.log('Server-side sign out initiated')
  
  try {
    const supabase = createServerClient()
    
    // Sign out the user with 'global' scope to invalidate all sessions
    await supabase.auth.signOut({ scope: 'global' })
    
    // Create a response with cleared cookies
    const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
    
    // Find any existing Supabase cookies in the request
    const supabaseCookies = req.cookies.getAll()
      .filter(cookie => cookie.name.startsWith('sb-') || 
                        cookie.name.includes('supabase') || 
                        cookie.name.includes('auth'))
      .map(cookie => cookie.name)
    
    // Always include these common Supabase cookie names
    const baseAuthCookies = [
      'sb-refresh-token',
      'sb-access-token',
      'sb-provider-token',
      'sb-auth-token',
      'supabase-auth-token',
      'auth_in_progress'
    ]
    
    // Combine found cookies with base cookies to ensure we clear everything
    const cookiesToClear = [...new Set([...supabaseCookies, ...baseAuthCookies])]
    
    // Clear all auth-related cookies
    cookiesToClear.forEach(cookieName => {
      // Clear with multiple variations to handle different cookie settings
      response.cookies.set(cookieName, '', { 
        maxAge: 0,
        path: '/',
        expires: new Date(0),
        sameSite: 'lax'
      })
      
      // Also try clearing with secure flag
      response.cookies.set(cookieName, '', { 
        maxAge: 0,
        path: '/',
        expires: new Date(0),
        secure: true,
        sameSite: 'lax'
      })
    })
    
    // Also clear any project-specific tokens in local storage via client-side script
    const clearScript = `
      <script>
        // Clear all auth-related items from localStorage and sessionStorage
        try {
          // Clear localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.includes('auth') || key.includes('supabase') || key.includes('token') || key.startsWith('sb-')) {
              console.log('Clearing localStorage item:', key);
              localStorage.removeItem(key);
            }
          });
          
          // Clear sessionStorage
          Object.keys(sessionStorage).forEach(key => {
            if (key.includes('auth') || key.includes('supabase') || key.includes('token') || key.startsWith('sb-')) {
              console.log('Clearing sessionStorage item:', key);
              sessionStorage.removeItem(key);
            }
          });
          
          // Also clear all cookies from client side as backup
          document.cookie.split(';').forEach(function(c) {
            const cookieName = c.trim().split('=')[0];
            if (cookieName.startsWith('sb-') || cookieName.includes('supabase') || cookieName.includes('auth')) {
              document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=lax;';
              document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; sameSite=lax;';
            }
          });
          
          console.log('Auth data cleared');
        } catch (e) {
          console.error('Error clearing auth data:', e);
        }
        
        // Redirect to home page after a brief delay
        setTimeout(() => {
          window.location.href = '${redirectTo}';
        }, 100);
      </script>
    `;
    
    // Add Cache-Control headers to prevent browser caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Return an HTML response with the clear script
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Signing out...</title>
          <meta http-equiv="refresh" content="0;url=${redirectTo}">
        </head>
        <body>
          <p style="font-family: system-ui, -apple-system, sans-serif; text-align: center; margin-top: 40px;">
            Signing out...
          </p>
          ${clearScript}
        </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
    
  } catch (error) {
    console.error('Error during server-side sign out:', error)
    
    // Even on error, try to clear cookies and redirect to home
    const response = NextResponse.redirect(new URL('/', requestUrl.origin))
    
    // Clear common auth cookies
    const cookiesToClear = [
      'sb-refresh-token',
      'sb-access-token',
      'sb-provider-token',
      'sb-auth-token',
      'supabase-auth-token',
      'auth_in_progress'
    ]
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', { 
        maxAge: 0,
        path: '/',
        expires: new Date(0),
        sameSite: 'lax'
      })
    })
    
    return response
  }
} 