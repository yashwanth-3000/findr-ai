'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { LuLoader } from 'react-icons/lu'

interface AuthCheckerProps {
  children: ReactNode
  fallback?: ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

/**
 * Component that checks authentication state and ensures it's fully loaded
 * before rendering its children, preventing premature redirects
 */
export const AuthChecker = ({
  children,
  fallback = <DefaultLoading />,
  requireAuth = true,
  redirectTo = '/signin'
}: AuthCheckerProps) => {
  const { user, loading, error } = useAuth()
  const router = useRouter()
  const [isStable, setIsStable] = useState(false)
  
  useEffect(() => {
    // Only set stable after a short delay to ensure auth context is stable
    const timer = setTimeout(() => {
      setIsStable(true)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  useEffect(() => {
    // Only redirect if auth is loaded, stable, and we require auth but don't have a user
    if (!loading && isStable && requireAuth && !user) {
      console.log('Auth check failed, redirecting to', redirectTo)
      router.push(redirectTo)
    }
  }, [loading, isStable, requireAuth, user, router, redirectTo])
  
  // Show fallback while loading or while establishing stability
  if (loading || !isStable) {
    return <>{fallback}</>
  }
  
  // If we require auth and don't have a user, show fallback while the redirect happens
  if (requireAuth && !user) {
    return <>{fallback}</>
  }
  
  // Auth requirements are met, render children
  return <>{children}</>
}

const DefaultLoading = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px]">
    <LuLoader className="animate-spin h-8 w-8 text-primary mb-4" />
    <p className="text-muted-foreground">Verifying your session...</p>
  </div>
) 