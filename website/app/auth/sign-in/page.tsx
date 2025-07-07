'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { Loader2 } from 'lucide-react'

export default function SignInPage() {
  const { signInWithGoogle, loading, error, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  // Redirect authenticated users to company dashboard
  useEffect(() => {
    if (user) {
      console.log('User authenticated, redirecting to company dashboard')
      router.push('/company/dashboard')
    }
  }, [user, router])

  const handleSignInWithGoogle = async () => {
    try {
      setIsLoading(true)
      await signInWithGoogle()
    } catch (err) {
      console.error('Sign in error:', err)
      setIsLoading(false)
    }
  }

  // Show loading state while checking auth
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Sign in to your company account</CardTitle>
          <CardDescription>
            Access your AI-powered hiring dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSignInWithGoogle}
            disabled={isLoading}
            className="w-full gap-2"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FcGoogle className="h-4 w-4" />
            )}
            Continue with Google
          </Button>
          
          {error && (
            <div className="text-sm text-red-600 text-center">
              {error}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground text-center">
            By signing in, you agree to our terms of service and privacy policy.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 