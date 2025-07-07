'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'
import { LuLoader } from 'react-icons/lu'

export default function TokenHandler() {
  const router = useRouter()
  const [message, setMessage] = useState('Processing authentication...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const supabase = createBrowserClient()
        
        // Check if there's a hash fragment with auth data
        if (window.location.hash) {
          setMessage('Processing authentication from URL...')
          
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const error = hashParams.get('error')
          const errorDescription = hashParams.get('error_description')
          
          if (error) {
            console.error('Auth error from URL hash:', error, errorDescription)
            setError(errorDescription || error)
            setMessage('Authentication failed')
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
            
            // Redirect to sign-in after a delay
            setTimeout(() => {
              router.push(`/auth/sign-in?error=${encodeURIComponent(errorDescription || error)}`)
            }, 2000)
            return
          }
          
          if (accessToken) {
            console.log('Found access token in URL hash, setting session...')
            
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })
            
            if (sessionError) {
              console.error('Error setting session:', sessionError)
              setError('Failed to establish session')
              setMessage('Authentication failed')
              
              setTimeout(() => {
                router.push('/auth/sign-in?error=session_failed')
              }, 2000)
              return
            }
            
            if (data.session) {
              console.log('Session established successfully')
              setMessage('Authentication successful! Redirecting...')
              
              // Clean up URL hash
              window.history.replaceState({}, document.title, window.location.pathname)
              
              // Redirect to company dashboard
              setTimeout(() => {
                router.push('/company/dashboard')
              }, 1000)
              return
            }
          }
        }
        
        // If no hash fragment, check for existing session
        setMessage('Checking existing session...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('Found existing session, redirecting to dashboard')
          setMessage('Session found! Redirecting...')
          
          setTimeout(() => {
            router.push('/company/dashboard')
          }, 1000)
        } else {
          console.log('No session found, redirecting to sign-in')
          setMessage('No active session found')
          
          setTimeout(() => {
            router.push('/auth/sign-in')
          }, 2000)
        }
        
      } catch (err) {
        console.error('Token handler error:', err)
        setError('An unexpected error occurred')
        setMessage('Authentication failed')
        
        setTimeout(() => {
          router.push('/auth/sign-in?error=unexpected_error')
        }, 2000)
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 max-w-md mx-auto p-8">
        <LuLoader className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h1 className="text-xl font-semibold">{message}</h1>
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Please wait while we complete your authentication...
        </p>
      </div>
    </div>
  )
} 