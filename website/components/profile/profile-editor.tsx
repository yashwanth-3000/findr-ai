'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LuLoader, LuSave, LuInfo, LuCheck, LuX } from 'react-icons/lu'
import { ApplicantProfile, CompanyProfile } from '@/lib/supabase-types'

export default function ProfileEditor() {
  const { user, userProfile, loading, refreshSession, supabase } = useAuth()
  const [activeTab, setActiveTab] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Basic profile form state
  const [displayName, setDisplayName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch user data if not available - using useCallback to avoid dependency issues
  const initializeSession = useCallback(async () => {
    if (!userProfile && !loading) {
      await refreshSession()
    }
  }, [userProfile, loading, refreshSession])

  // Initialize form values safely
  const initializeFormValues = useCallback(() => {
    if (userProfile && !isInitialized) {
      setDisplayName(userProfile.display_name || '')
      setAvatarUrl(userProfile.avatar_url || '')
      setIsInitialized(true)
    }
  }, [userProfile, isInitialized])

  // Split the effects to prevent the "useInsertionEffect must not schedule updates" error
  useEffect(() => {
    // Initialize the session if needed
    initializeSession()
  }, [initializeSession])

  // Second effect to initialize form values after userProfile is available
  useEffect(() => {
    // Only initialize form values when userProfile is available
    if (userProfile) {
      initializeFormValues()
    }
  }, [userProfile, initializeFormValues])

  // Handle basic profile update
  const handleBasicProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !userProfile) return
    
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          display_name: displayName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) {
        throw updateError
      }
      
      await refreshSession()
      setSuccess('Basic profile updated successfully')
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clear notification messages
  const clearMessages = () => {
    setSuccess(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LuLoader className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2 text-muted-foreground">Loading profile data...</span>
      </div>
    )
  }

  if (!user || !userProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Not Available</CardTitle>
          <CardDescription>
            You need to be signed in to edit your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => router.push('/signin')}>Sign In</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification messages */}
      {(success || error) && (
        <div className={`p-4 rounded-md ${success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} flex items-start justify-between`}>
          <div className="flex items-center">
            {success ? (
              <LuCheck className="h-5 w-5 mr-2 text-green-500" />
            ) : (
              <LuInfo className="h-5 w-5 mr-2 text-yellow-500" />
            )}
            <p>{success || error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="h-8 w-8 p-0 rounded-full"
          >
            <LuX className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          {userProfile.role === 'applicant' && (
            <TabsTrigger value="applicant">Applicant Details</TabsTrigger>
          )}
          {userProfile.role === 'company' && (
            <TabsTrigger value="company">Company Details</TabsTrigger>
          )}
        </TabsList>
        
        {/* Basic profile information tab */}
        <TabsContent value="basic" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Basic Profile Information</CardTitle>
              <CardDescription>Update your name and profile picture</CardDescription>
            </CardHeader>
            <form onSubmit={handleBasicProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={avatarUrl || ''} alt={displayName || 'User'} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground text-center">
                      Profile picture is currently pulled from your sign-in provider
                    </p>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={userProfile.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email is managed by your auth provider and cannot be changed here
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end space-x-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <LuSave className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        {/* Applicant-specific profile tab */}
        {userProfile.role === 'applicant' && (
          <TabsContent value="applicant" className="mt-0">
            <ApplicantProfileEditor 
              user={user}
              userProfile={userProfile}
              supabase={supabase}
              onSuccess={(message) => {
                setSuccess(message)
                refreshSession()
              }}
              onError={(message) => setError(message)}
            />
          </TabsContent>
        )}
        
        {/* Company-specific profile tab */}
        {userProfile.role === 'company' && (
          <TabsContent value="company" className="mt-0">
            <CompanyProfileEditor 
              user={user}
              userProfile={userProfile}
              supabase={supabase}
              onSuccess={(message) => {
                setSuccess(message)
                refreshSession()
              }}
              onError={(message) => setError(message)}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// Helper to get avatar initials
function getInitials(name: string | null | undefined): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Applicant-specific profile editor
function ApplicantProfileEditor({ 
  user,
  userProfile,
  supabase,
  onSuccess,
  onError
}: { 
  user: any,
  userProfile: any,
  supabase: any,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
}) {
  const profileData = userProfile.profile_data as ApplicantProfile || {};
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Form state
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')
  const [education, setEducation] = useState('')
  const [experienceYears, setExperienceYears] = useState<number | null>(null)
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  
  // URL validation
  const [githubUrlError, setGithubUrlError] = useState('')
  const [linkedinUrlError, setLinkedinUrlError] = useState('')
  const [resumeUrlError, setResumeUrlError] = useState('')
  
  // Initialize form values safely to prevent React errors
  const initializeFormValues = useCallback(() => {
    if (profileData && !isInitialized) {
      setBio(profileData.bio || '')
      setSkills(profileData.skills || [])
      setEducation(profileData.education || '')
      setExperienceYears(
        profileData.experience_years !== undefined ? profileData.experience_years : null
      )
      setGithubUrl(profileData.github_url || '')
      setLinkedinUrl(profileData.linkedin_url || '')
      setResumeUrl(profileData.resume_url || '')
      setIsInitialized(true)
    }
  }, [profileData, isInitialized])
  
  // Use effect to initialize form values
  useEffect(() => {
    initializeFormValues()
  }, [initializeFormValues])
  
  // Basic URL validation function
  const validateUrl = (url: string): boolean => {
    if (!url) return true // Empty URLs are allowed
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }
  
  // Validate GitHub URL
  const handleGithubUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setGithubUrl(url)
    
    if (url && !validateUrl(url)) {
      setGithubUrlError('Please enter a valid URL (e.g., https://github.com/username)')
    } else if (url && !url.includes('github.com')) {
      setGithubUrlError('URL should include github.com')
    } else {
      setGithubUrlError('')
    }
  }
  
  // Validate LinkedIn URL
  const handleLinkedinUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setLinkedinUrl(url)
    
    if (url && !validateUrl(url)) {
      setLinkedinUrlError('Please enter a valid URL (e.g., https://linkedin.com/in/username)')
    } else if (url && !url.includes('linkedin.com')) {
      setLinkedinUrlError('URL should include linkedin.com')
    } else {
      setLinkedinUrlError('')
    }
  }
  
  // Validate Resume URL
  const handleResumeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setResumeUrl(url)
    
    if (url && !validateUrl(url)) {
      setResumeUrlError('Please enter a valid URL')
    } else {
      setResumeUrlError('')
    }
  }
  
  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields before submitting
    let hasErrors = false
    
    // Validate GitHub URL
    if (githubUrl) {
      if (!validateUrl(githubUrl)) {
        setGithubUrlError('Please enter a valid URL')
        hasErrors = true
      } else if (!githubUrl.includes('github.com')) {
        setGithubUrlError('URL should include github.com')
        hasErrors = true
      }
    }
    
    // Validate LinkedIn URL
    if (linkedinUrl) {
      if (!validateUrl(linkedinUrl)) {
        setLinkedinUrlError('Please enter a valid URL')
        hasErrors = true
      } else if (!linkedinUrl.includes('linkedin.com')) {
        setLinkedinUrlError('URL should include linkedin.com')
        hasErrors = true
      }
    }
    
    // Validate Resume URL
    if (resumeUrl && !validateUrl(resumeUrl)) {
      setResumeUrlError('Please enter a valid URL')
      hasErrors = true
    }
    
    // Don't proceed if there are validation errors
    if (hasErrors) {
      onError('Please fix the errors in the form')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Check if applicant profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('applicant_profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      const applicantData = {
        bio,
        skills,
        education,
        experience_years: experienceYears,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        resume_url: resumeUrl,
        updated_at: new Date().toISOString()
      }
      
      let error;
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('applicant_profiles')
          .update(applicantData)
          .eq('id', user.id)
        
        error = updateError
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('applicant_profiles')
          .insert({
            id: user.id,
            created_at: new Date().toISOString(),
            ...applicantData
          })
        
        error = insertError
      }
      
      if (error) {
        throw error
      }
      
      onSuccess('Applicant profile updated successfully')
    } catch (err: any) {
      console.error('Error updating applicant profile:', err)
      onError(err.message || 'Failed to update applicant profile')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Applicant Profile</CardTitle>
        <CardDescription>Update your professional details and experience</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="A brief description of your professional background and interests"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>
          
          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <div className="flex gap-2">
              <Input
                id="skills"
                placeholder="Add a skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddSkill}
                className="shrink-0"
              >
                Add
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skills.map((skill, index) => (
                  <div 
                    key={index} 
                    className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-primary/20"
                    >
                      <LuX className="h-3 w-3" />
                      <span className="sr-only">Remove {skill}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Education */}
            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                placeholder="Highest degree or certification"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>
            
            {/* Experience Years */}
            <div className="space-y-2">
              <Label htmlFor="experienceYears">Years of Experience</Label>
              <Input
                id="experienceYears"
                type="number"
                min="0"
                max="50"
                placeholder="Years of professional experience"
                value={experienceYears === null ? '' : experienceYears}
                onChange={(e) => setExperienceYears(
                  e.target.value === '' ? null : parseInt(e.target.value, 10)
                )}
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Professional Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-6">Professional Links</h3>
            <p className="text-sm text-muted-foreground">Add your social and professional profiles to enhance your visibility to employers</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0A66C2]">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect width="4" height="12" x="2" y="9"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedinUrl"
                  placeholder="https://linkedin.com/in/yourusername"
                  value={linkedinUrl}
                  onChange={handleLinkedinUrlChange}
                  className={`bg-white/50 ${linkedinUrlError ? 'border-red-500' : ''}`}
                />
                <p className="text-xs text-muted-foreground">
                  Add your LinkedIn profile to showcase your professional experience
                </p>
                {linkedinUrlError && (
                  <p className="text-xs text-red-500 mt-1">{linkedinUrlError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="githubUrl" className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#333]">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                    <path d="M9 18c-4.51 2-5-2-7-2"></path>
                  </svg>
                  GitHub Profile
                </Label>
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/yourusername"
                  value={githubUrl}
                  onChange={handleGithubUrlChange}
                  className={`bg-white/50 ${githubUrlError ? 'border-red-500' : ''}`}
                />
                <p className="text-xs text-muted-foreground">
                  Showcase your code and projects to potential employers
                </p>
                {githubUrlError && (
                  <p className="text-xs text-red-500 mt-1">{githubUrlError}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label htmlFor="resumeUrl">Resume URL</Label>
              <Input
                id="resumeUrl"
                placeholder="Link to your resume (PDF, Google Doc, etc.)"
                value={resumeUrl}
                onChange={handleResumeUrlChange}
                className={resumeUrlError ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Provide a link to your resume hosted on Google Drive, Dropbox, or similar services
              </p>
              {resumeUrlError && (
                <p className="text-xs text-red-500 mt-1">{resumeUrlError}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch space-y-6">
          {/* Preview section */}
          <div className="w-full border rounded-lg p-4 bg-muted/20">
            <h4 className="text-sm font-medium mb-2">Profile Preview</h4>
            <p className="text-xs text-muted-foreground mb-3">This is how your profile will appear to recruiters</p>
            
            <div className="flex flex-wrap gap-3 mt-3">
              {linkedinUrl && (
                <a 
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs gap-1.5 px-3 py-1.5 bg-[#0A66C2]/10 text-[#0A66C2] rounded-full hover:bg-[#0A66C2]/20 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect width="4" height="12" x="2" y="9"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                  LinkedIn
                </a>
              )}
              
              {githubUrl && (
                <a 
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                    <path d="M9 18c-4.51 2-5-2-7-2"></path>
                  </svg>
                  GitHub
                </a>
              )}
              
              {resumeUrl && (
                <a 
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" x2="8" y1="13" y2="13"></line>
                    <line x1="16" x2="8" y1="17" y2="17"></line>
                    <line x1="10" x2="8" y1="9" y2="9"></line>
                  </svg>
                  Resume
                </a>
              )}
              
              {!linkedinUrl && !githubUrl && !resumeUrl && (
                <span className="text-xs text-muted-foreground italic">
                  Add professional links to see how they'll appear
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-end w-full">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <LuSave className="mr-2 h-4 w-4" />
                  Save Applicant Profile
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

// Company-specific profile editor
function CompanyProfileEditor({ 
  user,
  userProfile,
  supabase,
  onSuccess,
  onError
}: { 
  user: any,
  userProfile: any,
  supabase: any,
  onSuccess: (message: string) => void,
  onError: (message: string) => void
}) {
  const profileData = userProfile.profile_data as CompanyProfile || {};
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Form state
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  
  // Initialize form values safely to prevent React errors
  const initializeFormValues = useCallback(() => {
    if (profileData && !isInitialized) {
      setCompanyName(profileData.company_name || '')
      setIndustry(profileData.industry || '')
      setCompanySize(profileData.company_size || '')
      setDescription(profileData.description || '')
      setWebsiteUrl(profileData.website_url || '')
      setLinkedinUrl(profileData.linkedin_url || '')
      setLogoUrl(profileData.logo_url || '')
      setIsInitialized(true)
    }
  }, [profileData, isInitialized])
  
  // Use effect to initialize form values
  useEffect(() => {
    initializeFormValues()
  }, [initializeFormValues])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsSubmitting(true)
      
      // Check if company profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      const companyData = {
        company_name: companyName,
        industry,
        company_size: companySize,
        description,
        website_url: websiteUrl,
        linkedin_url: linkedinUrl,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      }
      
      let error;
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('company_profiles')
          .update(companyData)
          .eq('id', user.id)
        
        error = updateError
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('company_profiles')
          .insert({
            id: user.id,
            created_at: new Date().toISOString(),
            ...companyData
          })
        
        error = insertError
      }
      
      if (error) {
        throw error
      }
      
      onSuccess('Company profile updated successfully')
    } catch (err: any) {
      console.error('Error updating company profile:', err)
      onError(err.message || 'Failed to update company profile')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>Update your company information</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Your company's name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            
            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="e.g. Technology, Healthcare, Finance"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
          </div>
          
          {/* Company Size */}
          <div className="space-y-2">
            <Label htmlFor="companySize">Company Size</Label>
            <Input
              id="companySize"
              placeholder="e.g. 1-10, 11-50, 51-200, 201-500, 500+"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your company, mission, and what you do"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          
          <Separator />
          
          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Company Links</h3>
            
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                placeholder="https://yourcompany.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn Company Page</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/company/yourcompany"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Company Logo URL</Label>
              <Input
                id="logoUrl"
                placeholder="URL to your company logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Provide a direct URL to your company logo image
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end space-x-2">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LuLoader className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <LuSave className="mr-2 h-4 w-4" />
                Save Company Profile
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 