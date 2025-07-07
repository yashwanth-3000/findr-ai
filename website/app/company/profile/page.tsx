'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Container } from '@/components/layout/container'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  LuLoader, 
  LuPenLine, 
  LuBriefcase, 
  LuMapPin, 
  LuGlobe, 
  LuBuilding, 
  LuUsers, 
  LuLinkedin,
  LuPlus
} from 'react-icons/lu'

export default function CompanyProfilePage() {
  const router = useRouter()
  const { user, userProfile, loading, supabase } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  
  // Load profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return
      
      try {
        setLoadingProfile(true)
        
        // Get company profile data
        const { data, error } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (error) {
          console.error('Error fetching company profile:', error)
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error('Error loading profile data:', err)
      } finally {
        setLoadingProfile(false)
      }
    }
    
    if (user) {
      fetchProfileData()
    }
  }, [user, supabase])
  
  // Redirect non-company users
  useEffect(() => {
    if (!loading && userProfile?.role !== 'company') {
      router.push('/profile')
    }
  }, [loading, userProfile, router])
  
  if (loading || loadingProfile) {
    return (
      <>
        <Navbar />
        <Container>
          <div className="pt-24 flex justify-center">
            <div className="flex flex-col items-center">
              <LuLoader className="animate-spin h-8 w-8 text-primary" />
              <p className="mt-4 text-muted-foreground">Loading profile data...</p>
            </div>
          </div>
        </Container>
      </>
    )
  }
  
  if (!user) {
    return (
      <>
        <Navbar />
        <Container>
          <div className="pt-24 pb-12">
            <Card>
              <CardHeader>
                <CardTitle>Profile Not Available</CardTitle>
                <CardDescription>
                  You need to be signed in to view your profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={() => router.push('/signin')}>Sign In</Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </>
    )
  }
  
  return (
    <>
      <Navbar />
      <Container>
        <div className="pt-24 pb-12">
          {/* Profile header */}
          <div className="mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-background bg-white">
                {profile?.logo_url ? (
                  <AvatarImage src={profile.logo_url} alt={profile.company_name || 'Company'} />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    <LuBuilding className="h-10 w-10 text-primary" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">{profile?.company_name || userProfile?.display_name || 'Company'}</h1>
              <p className="text-xl text-muted-foreground">{profile?.industry || 'Technology'}</p>
              
              {profile?.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2 justify-center md:justify-start">
                  <LuMapPin className="h-4 w-4" />
                  {profile.location}
                </p>
              )}
              
              <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                {profile?.website_url && (
                  <a 
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <LuGlobe className="h-4 w-4" />
                    Website
                  </a>
                )}
                
                {profile?.linkedin_url && (
                  <a 
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <LuLinkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>
              
              {profile?.company_size && (
                <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1 justify-center md:justify-start">
                  <LuUsers className="h-4 w-4" />
                  {profile.company_size} employees
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" size="sm" className="gap-1 whitespace-nowrap">
              <a href="/company/edit">
                <LuPenLine className="h-4 w-4" /> 
                Edit Profile
              </a>
            </Button>
            </div>
          </div>
          
          {/* Content tabs */}
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="jobs">Job Listings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="space-y-6">
              {profile?.description ? (
              <Card>
                  <CardHeader>
                    <CardTitle>About the Company</CardTitle>
                </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{profile.description}</p>
                </CardContent>
              </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>About the Company</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">No company description added yet.</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <a href="/company/edit">Add Description</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            
              {/* Company details */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
                      <p className="text-base">{profile?.company_name || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Industry</h3>
                      <p className="text-base">{profile?.industry || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Company Size</h3>
                      <p className="text-base">{profile?.company_size || 'Not specified'}</p>
                    </div>
                    
                        <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                      <p className="text-base">{profile?.location || 'Not specified'}</p>
                        </div>
                      
                        <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Contact Email</h3>
                      <p className="text-base">{userProfile?.email || user?.email || 'Not available'}</p>
                    </div>
                        </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="jobs" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Active Job Listings</CardTitle>
                  <Button asChild size="sm" className="gap-1">
                    <a href="/company/jobs/new">
                      <LuPlus className="h-4 w-4" />
                      Post New Job
                    </a>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <LuBriefcase className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Job listings will appear here once you've posted them.</p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <a href="/company/jobs/new">Post Your First Job</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Job Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full flex items-center justify-between">
                    <a href="/company/jobs">
                      <LuBriefcase className="h-4 w-4 mr-2" />
                      <span>Manage All Job Postings</span>
                      <span className="ml-auto">→</span>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="w-full flex items-center justify-between">
                    <a href="/company/jobs/new">
                      <LuPlus className="h-4 w-4 mr-2" />
                      <span>Create New Job Listing</span>
                      <span className="ml-auto">→</span>
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </>
  )
} 