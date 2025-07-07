'use client'

import { useState } from 'react'
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
  LuEye, 
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
  const [showPreview, setShowPreview] = useState(false)

  const generateLink = () => {
    if (!formData.companyName.trim() || !formData.jobTitle.trim()) {
      alert('Please enter both company name and job title')
      return
    }

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
              <Link href="/">
                <LuArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create Shareable Application Link</h1>
              <p className="text-muted-foreground mt-1">
                Configure what information applicants need to provide when applying
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LuBriefcase className="h-5 w-5" />
                    Job Information
                  </CardTitle>
                  <CardDescription>
                    Enter the basic job details
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
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Label className="text-xs font-medium text-blue-900 dark:text-blue-100">URL Preview:</Label>
                        <p className="font-mono text-sm text-blue-700 dark:text-blue-300 mt-1">
                          /apply/{formData.companyName ? formData.companyName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'company' : 'company'}/{formData.jobTitle ? formData.jobTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'job' : 'job'}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LuUser className="h-5 w-5" />
                    Required Information
                  </CardTitle>
                  <CardDescription>
                    Choose what applicants must provide
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Button 
                      onClick={generateLink}
                      className="w-full"
                      size="lg"
                      disabled={!formData.companyName.trim() || !formData.jobTitle.trim()}
                    >
                      <LuLink className="h-4 w-4 mr-2" />
                      Generate Shareable Link
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

            {/* Preview Panel */}
            <div>
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <LuEye className="h-5 w-5" />
                      Applicant Preview
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                  </div>
                  <CardDescription>
                    This is what applicants will see
                  </CardDescription>
                </CardHeader>
                
                {showPreview && (
                  <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <h3 className="font-semibold mb-4">Application Form</h3>
                      <div className="space-y-4">
                        {formData.requireName && (
                          <div>
                            <Label className="flex items-center gap-2">
                              <LuUser className="h-3 w-3" />
                              Full Name *
                            </Label>
                            <Input placeholder="Enter your full name" disabled />
                          </div>
                        )}
                        
                        {formData.requireEmail && (
                          <div>
                            <Label className="flex items-center gap-2">
                              <LuMail className="h-3 w-3" />
                              Email Address *
                            </Label>
                            <Input placeholder="your.email@example.com" disabled />
                          </div>
                        )}
                        
                        {formData.requireResume && (
                          <div>
                            <Label className="flex items-center gap-2">
                              <LuFileText className="h-3 w-3" />
                              Resume/CV *
                            </Label>
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center text-sm text-muted-foreground">
                              Drop your resume here or click to upload
                            </div>
                          </div>
                        )}
                        
                        {formData.requireGithubProfile && (
                          <div>
                            <Label className="flex items-center gap-2">
                              <LuGithub className="h-3 w-3" />
                              GitHub Profile *
                            </Label>
                            <Input placeholder="github.com/yourusername" disabled />
                          </div>
                        )}
                        
                        {formData.requireLinkedin && (
                          <div>
                            <Label className="flex items-center gap-2">
                              <LuLinkedin className="h-3 w-3" />
                              LinkedIn Profile {formData.requireLinkedin ? '*' : '(Optional)'}
                            </Label>
                            <Input placeholder="linkedin.com/in/yourprofile" disabled />
                          </div>
                        )}
                        
                        {formData.requireTopRepos && (
                          <div>
                            <Label className="flex items-center gap-2">
                              <LuGithub className="h-3 w-3" />
                              Top {formData.numberOfRepos} GitHub Repositories *
                            </Label>
                            <div className="space-y-2">
                              {Array.from({ length: formData.numberOfRepos }, (_, i) => (
                                <Input 
                                  key={i}
                                  placeholder={`Repository ${i + 1} URL`} 
                                  disabled 
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {formData.customQuestion && (
                          <div>
                            <Label className="flex items-center gap-2">
                              <LuMessageSquare className="h-3 w-3" />
                              {formData.customQuestion} {formData.customQuestionRequired ? '*' : '(Optional)'}
                            </Label>
                            <Textarea 
                              placeholder="Your answer..." 
                              disabled
                              className="min-h-[80px]"
                            />
                          </div>
                        )}
                        
                        <Button className="w-full" disabled>
                          Submit Application
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
} 