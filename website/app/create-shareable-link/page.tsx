'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Container } from '@/components/layout/container'
import { PageContainer } from '@/components/layout/page-container'
import Link from 'next/link'
import { 
  LuArrowLeft, 
  LuLink, 
  LuCopy, 
  LuCheck, 
  LuUser, 
  LuMail, 
  LuFileText, 
  LuGithub, 
  LuLinkedin,
  LuMessageSquare,
  LuShare,
  LuBriefcase,
  LuExternalLink
} from 'react-icons/lu'

export default function CreateShareableLinkPage() {
  const searchParams = useSearchParams()
  const { supabase } = useAuth()
  const fromJobPost = searchParams.get('from') === 'job-post'
  
  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    requireName: true,        // Always required - no toggle
    requireEmail: true,       // Always required - no toggle
    requireResume: true,      // Always required - no toggle
    requireGithubProfile: true, // Always required - no toggle
    requireLinkedin: false,   // Toggleable
    requireTopRepos: true,    // Always required - no toggle
    numberOfRepos: 3,         // How many repos to require
    customQuestion: '',
    customQuestionRequired: false
  })

  const [shareableLink, setShareableLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [jobData, setJobData] = useState<any>(null)
  const [isSavingToSupabase, setIsSavingToSupabase] = useState(false)

  // Load job data from sessionStorage if coming from job post
  useEffect(() => {
    if (fromJobPost) {
      const storedJobData = sessionStorage.getItem('pendingJobData')
      if (storedJobData) {
        try {
          const parsedJobData = JSON.parse(storedJobData)
          setJobData(parsedJobData)
          
          // Pre-fill form fields
          setFormData(prev => ({
            ...prev,
            companyName: parsedJobData.company_name || '',
            jobTitle: parsedJobData.title || ''
          }))
        } catch (error) {
          console.error('Error parsing job data:', error)
        }
      }
    }
  }, [fromJobPost])

  const generateLink = async () => {
    if (!formData.companyName.trim() || !formData.jobTitle.trim()) {
      alert('Please enter both company name and job title')
      return
    }

    setIsSavingToSupabase(true)

    try {
      // Create URL-friendly slugs
      const companySlug = formData.companyName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
      
      const jobSlug = formData.jobTitle.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')         // Replace spaces with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens

      const linkPath = `${companySlug}/${jobSlug}`
      const newLink = `${window.location.origin}/apply/${linkPath}`
      
      // Store the configuration for this link
      const linkConfig = {
        id: linkPath,
        companyName: formData.companyName,
        jobTitle: formData.jobTitle,
        requireName: formData.requireName,
        requireEmail: formData.requireEmail,
        requireResume: formData.requireResume,
        requireGithubProfile: formData.requireGithubProfile,
        requireLinkedin: formData.requireLinkedin,
        requireTopRepos: formData.requireTopRepos,
        numberOfRepos: formData.numberOfRepos,
        customQuestion: formData.customQuestion,
        customQuestionRequired: formData.customQuestionRequired,
        createdAt: new Date().toISOString()
      }
      
      // Store in localStorage (in a real app, this would be in a database)
      const existingConfigs = JSON.parse(localStorage.getItem('applicationConfigs') || '{}')
      existingConfigs[linkPath] = linkConfig
      localStorage.setItem('applicationConfigs', JSON.stringify(existingConfigs))
      
      setShareableLink(newLink)

      // If this came from a job post, now save the job to Supabase
      if (fromJobPost && jobData && supabase) {
        try {
          const jobDataForDB = {
            company_id: jobData.company_id,
            title: jobData.title,
            description: jobData.description,
            requirements: jobData.requirements || null, // Should already be an array from job posting form
            location: jobData.location,
            job_type: jobData.job_type,
            salary_min: jobData.salary_min || null,
            salary_max: jobData.salary_max || null,
            experience_level: jobData.experience_level,
            skills_required: jobData.skills_required || [],
            benefits: jobData.benefits || null, // Should already be an array from job posting form
            status: 'active', // Set to active now that shareable link is created
            public_link_id: linkPath // Store the shareable link path as text
          }

          console.log('📦 Job data to save:', jobDataForDB)

          const { data, error: insertError } = await supabase
            .from('jobs')
            .insert([jobDataForDB])
            .select()

          if (insertError) {
            console.error('Error saving job to Supabase:', insertError)
            console.error('Error details:', JSON.stringify(insertError, null, 2))
            alert(`Shareable link created, but failed to save job: ${insertError.message}`)
          } else {
            console.log('✅ Job saved successfully:', data)
            // Clear the sessionStorage as job is now saved
            sessionStorage.removeItem('pendingJobData')
            alert('🎉 Job posted and shareable link created successfully!')
            
            // Redirect to job management page after a short delay
            setTimeout(() => {
              window.location.href = '/company/jobs?created=success'
            }, 2000)
          }
        } catch (error) {
          console.error('Error saving to Supabase:', error)
          console.error('Error details:', JSON.stringify(error, null, 2))
          alert(`Shareable link created, but failed to save job: ${(error as Error).message}`)
        }
      }
    } catch (error) {
      console.error('Error generating link:', error)
      alert('Failed to generate shareable link. Please try again.')
    } finally {
      setIsSavingToSupabase(false)
    }
  }

  const copyToClipboard = async () => {
    if (!shareableLink) return
    
    try {
      await navigator.clipboard.writeText(shareableLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href={fromJobPost ? "/company/jobs" : "/"}>
                <LuArrowLeft className="h-4 w-4 mr-2" />
                {fromJobPost ? 'Back to Jobs' : 'Back to Home'}
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {fromJobPost ? 'Create Application Link & Publish Job' : 'Create Shareable Application Link'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {fromJobPost 
                  ? 'Configure the application requirements and create a shareable link to publish your job'
                  : 'Configure what information applicants need to provide when applying'
                }
              </p>
              {fromJobPost && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    📋 <strong>Final Step:</strong> Your job details are ready. Create the application link to publish your job posting.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Column - Job Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Info Summary */}
              {fromJobPost && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <LuBriefcase className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">Job Posting Workflow</span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Step 2 of 2: Configure application requirements → Publish job
                  </p>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LuBriefcase className="h-5 w-5" />
                    {fromJobPost ? 'Application Link Details' : 'Job Information'}
                  </CardTitle>
                  <CardDescription>
                    {fromJobPost 
                      ? 'Configure the shareable link for your job posting'
                      : 'Enter the basic job details'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Job Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Job Details (Required)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          placeholder="e.g., TechFlow Solutions"
                          value={formData.companyName}
                          onChange={(e) => 
                            setFormData(prev => ({ ...prev, companyName: e.target.value }))
                          }
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title *</Label>
                        <Input
                          id="jobTitle"
                          placeholder="e.g., Senior Full-Stack Developer"
                          value={formData.jobTitle}
                          onChange={(e) => 
                            setFormData(prev => ({ ...prev, jobTitle: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>
                    
                    {(formData.companyName.trim() || formData.jobTitle.trim()) && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <Label className="text-xs font-medium text-red-900 dark:text-red-100">URL Preview:</Label>
                        <p className="font-mono text-sm text-red-700 dark:text-red-300 mt-1">
                          /apply/{formData.companyName ? formData.companyName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'company' : 'company'}/{formData.jobTitle ? formData.jobTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'job' : 'job'}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />
                </CardContent>
              </Card>

              {/* Job Details Section - shown when coming from job post */}
              {fromJobPost && jobData && (
                <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <LuBriefcase className="h-5 w-5" />
                      Job Details Preview
                    </CardTitle>
                    <CardDescription className="text-red-700 dark:text-red-300">
                      These details will be saved to your job posting once the shareable link is created
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="font-medium text-red-800 dark:text-red-200">Location</Label>
                        <p className="text-red-700 dark:text-red-300">{jobData.location}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-red-800 dark:text-red-200">Employment Type</Label>
                        <p className="text-red-700 dark:text-red-300">{jobData.employment_type}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-red-800 dark:text-red-200">Experience Level</Label>
                        <p className="text-red-700 dark:text-red-300">{jobData.experience_level}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-red-800 dark:text-red-200">Salary Range</Label>
                        <p className="text-red-700 dark:text-red-300">{jobData.salary_range || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    {jobData.description && (
                      <div>
                        <Label className="font-medium text-red-800 dark:text-red-200">Job Description</Label>
                        <p className="text-red-700 dark:text-red-300 text-sm mt-1 line-clamp-3">{jobData.description}</p>
                      </div>
                    )}
                    
                    {jobData.skills_required && jobData.skills_required.length > 0 && (
                      <div>
                        <Label className="font-medium text-red-800 dark:text-red-200">Required Skills</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {jobData.skills_required.map((skill: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs border-red-300 text-red-700 dark:border-red-700 dark:text-red-300">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Application Configuration */}
            <div className="lg:col-span-3 space-y-6">
              {/* Configuration Header */}
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <LuUser className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-900 dark:text-red-100">Application Requirements</span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Configure what information applicants need to provide
                </p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Basic Information (Always Required)
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LuUser className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Full Name</Label>
                          <p className="text-sm text-muted-foreground">Applicant's full name</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LuMail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Email Address</Label>
                          <p className="text-sm text-muted-foreground">Contact email</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LuFileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>Resume/CV</Label>
                          <p className="text-sm text-muted-foreground">PDF or document upload</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Tech Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Technical Information
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LuGithub className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>GitHub Profile</Label>
                          <p className="text-sm text-muted-foreground">GitHub username or profile URL</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <LuGithub className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label>Top GitHub Repositories</Label>
                            <p className="text-sm text-muted-foreground">Best repositories to showcase</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      </div>
                      
                      <div className="ml-7 space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-xs">Number of repositories required</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              value={formData.numberOfRepos}
                              onChange={(e) => 
                                setFormData(prev => ({ 
                                  ...prev, 
                                  numberOfRepos: Number(e.target.value)
                                }))
                              }
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <LuLinkedin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label>LinkedIn Profile</Label>
                          <p className="text-sm text-muted-foreground">LinkedIn profile URL</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={formData.requireLinkedin}
                          onCheckedChange={(checked) => 
                            setFormData(prev => ({ ...prev, requireLinkedin: checked }))
                          }
                        />
                        <Badge variant={formData.requireLinkedin ? "secondary" : "outline"} className="text-xs">
                          {formData.requireLinkedin ? "Required" : "Optional"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Custom Question */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Custom Question
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <LuMessageSquare className="h-4 w-4 text-muted-foreground" />
                        <Label>Additional Question (Optional)</Label>
                      </div>
                      
                      <Textarea
                        placeholder="e.g., Tell us about a challenging project you've worked on..."
                        value={formData.customQuestion}
                        onChange={(e) => 
                          setFormData(prev => ({ ...prev, customQuestion: e.target.value }))
                        }
                        className="min-h-[80px]"
                      />
                      
                      {formData.customQuestion && (
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Make this question required</Label>
                          <Switch 
                            checked={formData.customQuestionRequired}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({ ...prev, customQuestionRequired: checked }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generate Link Button */}
              <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 lg:sticky lg:top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <LuLink className="h-5 w-5" />
                    {fromJobPost ? 'Publish Job & Create Link' : 'Generate Application Link'}
                  </CardTitle>
                  <CardDescription>
                    {fromJobPost 
                      ? 'Complete the process by creating your shareable application link'
                      : 'Create a professional application form for candidates'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      onClick={generateLink}
                      className="w-full"
                      size="lg"
                      disabled={!formData.companyName.trim() || !formData.jobTitle.trim() || isSavingToSupabase}
                    >
                      {isSavingToSupabase ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {fromJobPost ? 'Creating Link & Saving Job...' : 'Creating Link...'}
                        </>
                      ) : (
                        <>
                          <LuLink className="h-4 w-4 mr-2" />
                          {fromJobPost ? 'Create Link & Save Job' : 'Generate Shareable Link'}
                        </>
                      )}
                    </Button>
                    
                    {shareableLink && (
                      <div className="space-y-4">
                        <Label className="text-sm font-medium">Your shareable application link:</Label>
                        <div className="flex gap-2">
                          <Input
                            value={shareableLink}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyToClipboard}
                            title="Copy to clipboard"
                          >
                            {linkCopied ? (
                              <LuCheck className="h-4 w-4 text-green-600" />
                            ) : (
                              <LuCopy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(shareableLink, '_blank')}
                            title="Open in new tab"
                          >
                            <LuExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => window.open(shareableLink, '_blank')}
                            className="flex-1"
                          >
                            <LuExternalLink className="h-4 w-4 mr-2" />
                            Test Application Form
                          </Button>
                        </div>
                        
                        <Alert>
                          <LuShare className="h-4 w-4" />
                          <AlertDescription>
                            Share this link with potential applicants. They'll be able to apply directly through this URL.
                            <br />
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                              /apply/{formData.companyName ? formData.companyName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') : 'company'}/{formData.jobTitle ? formData.jobTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') : 'job'}
                            </span>
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
} 