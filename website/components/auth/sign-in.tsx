'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignIn() {
  const { signInWithGoogle, loading, error: authError, user, company, resetAuthState } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Clear any previous errors when component mounts
  useEffect(() => {
    setError(null)
    if (authError) {
      console.log('Auth error detected:', authError)
    }
  }, [authError])

  // Handle authentication state changes
  useEffect(() => {
    console.log('Auth state - User:', !!user, 'Company:', !!company, 'Loading:', loading)
    
    if (user && !loading) {
      // User is authenticated, redirect to company dashboard
      console.log('User authenticated, redirecting to company dashboard')
      router.push('/company/dashboard')
    }
  }, [user, company, loading, router])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Initiating Google sign in...')
      await signInWithGoogle()
    } catch (err) {
      console.error('Sign in failed:', err)
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    resetAuthState()
  }

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Please wait...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
                          <CardTitle className="text-2xl font-bold">Welcome to findr-ai</CardTitle>
          <CardDescription>
            Sign in to manage your company's hiring process with AI-powered candidate screening
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display error if any */}
          {(error || authError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || authError}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="ml-2 h-auto p-0 text-xs underline"
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading || loading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FcGoogle className="mr-2 h-5 w-5" />
            )}
            Sign in with Google
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 