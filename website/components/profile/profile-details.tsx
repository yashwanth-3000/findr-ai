'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LuLoader, LuExternalLink, LuGithub, LuLinkedin } from 'react-icons/lu'
import Link from 'next/link'

export default function ProfileDetails() {
  const { user, company, loading, refreshSession } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh if no company profile
  useEffect(() => {
    if (!company && !loading) {
      refreshSession()
    }
  }, [company, loading, refreshSession])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LuLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show error if no user
  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please sign in to view your profile</p>
        <Button asChild className="mt-4">
          <Link href="/auth/sign-in">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.user_metadata?.avatar_url || ''} alt={company?.company_name || 'Company'} />
              <AvatarFallback className="text-lg">
                {getInitials(company?.company_name || user.user_metadata?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="font-medium text-lg">{company?.company_name || user.user_metadata?.full_name || 'Company'}</div>
              <div className="text-sm text-muted-foreground">{company?.company_email || user.email}</div>
              <div className="text-sm text-muted-foreground">Company Account</div>
            </div>
          </div>

          {/* Company Details */}
          {company && (
            <div className="space-y-4 pt-4 border-t">
              {company.company_website && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Website</div>
                  <Link 
                    href={company.company_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center"
                  >
                    {company.company_website} <LuExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              )}

              {company.location && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Location</div>
                  <div className="text-sm">{company.location}</div>
                </div>
              )}

              {company.industry && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Industry</div>
                  <div className="text-sm">{company.industry}</div>
                </div>
              )}

              {company.company_size && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Company Size</div>
                  <div className="text-sm">{company.company_size}</div>
                </div>
              )}

              {company.company_description && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                  <div className="text-sm whitespace-pre-wrap">{company.company_description}</div>
                </div>
              )}
            </div>
          )}

          {!company && (
            <div className="bg-muted p-4 rounded-md text-center">
              <p className="text-muted-foreground mb-2">Company profile not found</p>
              <Button asChild size="sm">
                <Link href="/company/profile/edit">Complete Your Profile</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || isRefreshing}>
          {isRefreshing ? <LuLoader className="mr-2 h-4 w-4 animate-spin" /> : null}
          Refresh Profile Data
        </Button>
      </div>
    </div>
  )
} 