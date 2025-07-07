'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { LuLoader, LuSave, LuCheck, LuX } from 'react-icons/lu'

export default function CompanyEditPage() {
  const router = useRouter()
  const { user, userProfile, loading, supabase, refreshSession } = useAuth()
  
  // Form state
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Load user data - use a simple approach to avoid hook issues
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        if (!user) return
        
        // Get company profile data
        const { data: companyProfile } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (companyProfile) {
          // Initialize form with profile data
          setCompanyName(companyProfile.company_name || '')
          setIndustry(companyProfile.industry || '')
          setCompanySize(companyProfile.company_size || '')
          setDescription(companyProfile.description || '')
          setWebsiteUrl(companyProfile.website_url || '')
          setLinkedinUrl(companyProfile.linkedin_url || '')
          setLogoUrl(companyProfile.logo_url || '')
        }
      } catch (err) {
        console.error('Error loading company profile:', err)
      }
    }
    
    // Only load when user is available
    if (user) {
      loadProfileData()
    }
  }, [user, supabase])
  
  // Redirect non-company users
  useEffect(() => {
    if (!loading && userProfile?.role !== 'company') {
      router.push('/profile')
    }
  }, [loading, userProfile, router])
  
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
  
  // Form validation and submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(null)
      
      // Check if company profile exists
      const { data: existingProfile } = await supabase
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
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('company_profiles')
          .update(companyData)
          .eq('id', user.id)
        
        if (updateError) throw updateError
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('company_profiles')
          .insert({
            id: user.id,
            created_at: new Date().toISOString(),
            ...companyData
          })
        
        if (insertError) throw insertError
      }
      
      // Update user_profiles to ensure role is set
      await supabase
        .from('user_profiles')
        .update({ role: 'company' })
        .eq('id', user.id)
      
      // Refresh session to update context
      await refreshSession()
      
      setSuccess('Profile updated successfully')
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto pt-24 px-6 pb-12">
          <div className="flex justify-center items-center py-16">
            <LuLoader className="animate-spin h-8 w-8 text-primary" />
            <span className="ml-2 text-muted-foreground">Loading profile data...</span>
          </div>
        </main>
      </>
    )
  }
  
  if (!user) {
    return (
      <>
        <Navbar />
        <main className="container mx-auto pt-24 px-6 pb-12">
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
        </main>
      </>
    )
  }
  
  return (
    <>
      <Navbar />
      <main className="container mx-auto pt-24 px-6 pb-12">
        <h1 className="text-3xl font-bold mb-8">Edit Your Company Profile</h1>
        
        {(success || error) && (
          <div className={`p-4 rounded-md ${success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} flex items-start justify-between mb-6`}>
            <div className="flex items-center">
              {success ? (
                <LuCheck className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <LuX className="h-5 w-5 mr-2 text-red-500" />
              )}
              <p>{success || error}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSuccess(null)
                setError(null)
              }}
              className="h-8 w-8 p-0 rounded-full"
            >
              <LuX className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        )}
        
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
              
              {/* Preview section */}
              <div className="w-full border rounded-lg p-4 bg-muted/20">
                <h4 className="text-sm font-medium mb-2">Profile Preview</h4>
                <p className="text-xs text-muted-foreground mb-3">This is how your company profile will appear</p>
                
                <div className="flex items-start gap-4">
                  {logoUrl && (
                    <div className="w-16 h-16 rounded overflow-hidden bg-white shadow-sm">
                      <img src={logoUrl} alt={companyName || 'Company logo'} 
                        className="w-full h-full object-contain" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h5 className="font-medium">{companyName || 'Your Company Name'}</h5>
                    {industry && <p className="text-sm text-muted-foreground">{industry}</p>}
                    {companySize && <p className="text-sm text-muted-foreground">{companySize} employees</p>}
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {websiteUrl && (
                        <a 
                          href={websiteUrl} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Website
                        </a>
                      )}
                      
                      {linkedinUrl && (
                        <a 
                          href={linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#0A66C2] hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
            </CardContent>
            <CardFooter className="justify-end">
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
                    Save Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </>
  )
} 