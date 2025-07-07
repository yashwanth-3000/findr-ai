'use client'

import { useAuth } from '@/contexts/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LuLoader, LuLogOut } from 'react-icons/lu'
import { UserProfile as UserProfileType, ApplicantProfile, CompanyProfile } from '@/lib/supabase-types'

export default function UserProfile() {
  const { userProfile, loading, signOut } = useAuth()
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <LuLoader className="animate-spin h-6 w-6 text-gray-400" />
      </div>
    )
  }
  
  if (!userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Not Available</CardTitle>
          <CardDescription>
            You need to sign in to view your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/signin">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  // Get the role-specific content
  const roleContent = getRoleContent(userProfile)
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <CardTitle className="text-xl">{userProfile.display_name || 'User'}</CardTitle>
            <CardDescription>
              {userProfile.email}
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded capitalize">
                {userProfile.role || 'No role'}
              </span>
            </CardDescription>
          </div>
          <Avatar className="h-12 w-12">
            <AvatarImage src={userProfile.avatar_url || ''} alt="User avatar" />
            <AvatarFallback>
              {getInitials(userProfile.display_name || 'User')}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {roleContent}
        
        <Button 
          variant="outline"
          className="w-full flex items-center gap-2" 
          onClick={signOut}
        >
          <LuLogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  )
}

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Helper function to render role-specific content
function getRoleContent(profile: UserProfileType) {
  if (!profile.role) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Please select a role to complete your profile.</p>
        <Button asChild className="mt-2">
          <a href="/role-select">Select Role</a>
        </Button>
      </div>
    )
  }
  
  if (profile.role === 'applicant') {
    const applicantData = profile.profile_data as ApplicantProfile || {};
    
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Applicant Profile</h3>
        
        {applicantData.about && (
          <div className="mt-4">
            <div className="text-xs text-gray-500">About</div>
            <p className="text-sm">{applicantData.about}</p>
          </div>
        )}
        
        {applicantData.skills && applicantData.skills.length > 0 && (
          <div>
            <div className="text-xs text-gray-500">Skills</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {applicantData.skills.map((skill: string, i: number) => (
                <span key={i} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <Button variant="link" asChild className="p-0 h-auto">
          <a href="/edit-profile/applicant">Edit Profile</a>
        </Button>
      </div>
    )
  }
  
  if (profile.role === 'company') {
    const companyData = profile.profile_data as CompanyProfile || {};
    
    return (
      <div className="space-y-3">
        <h3 className="font-medium text-sm">Company Profile</h3>
        
        {companyData.company_name && (
          <div>
            <div className="text-xs text-gray-500">Company Name</div>
            <p className="text-sm font-medium">{companyData.company_name}</p>
          </div>
        )}
        
        {companyData.industry && (
          <div>
            <div className="text-xs text-gray-500">Industry</div>
            <p className="text-sm">{companyData.industry}</p>
          </div>
        )}
        
        {companyData.description && (
          <div>
            <div className="text-xs text-gray-500">Description</div>
            <p className="text-sm">{companyData.description}</p>
          </div>
        )}
        
        <Button variant="link" asChild className="p-0 h-auto">
          <a href="/edit-profile/company">Edit Profile</a>
        </Button>
      </div>
    )
  }
  
  return null
} 