'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Linkedin, Github, Building2, MapPin, Clock, DollarSign } from 'lucide-react'
import { useParams } from 'next/navigation'

// Mock job data for demonstration
const mockJob = {
  id: "1",
  title: "Senior Frontend Developer",
  company: "TechCorp Inc.",
  location: "San Francisco, CA",
  type: "Full-time",
  salary: "$120,000 - $160,000",
  description: "We're looking for a senior frontend developer to join our team and build amazing user experiences. You'll work with React, TypeScript, and modern web technologies.",
  requirements: [
    "5+ years of React experience",
    "Strong TypeScript skills",
    "Experience with modern CSS frameworks",
    "Knowledge of state management (Redux/Zustand)",
    "Experience with testing frameworks (Jest, React Testing Library)"
  ],
  benefits: [
    "Competitive salary and equity",
    "Health, dental, and vision insurance",
    "Flexible work schedule",
    "Remote work options",
    "Professional development budget"
  ]
}

export default function JobApplicationPage() {
  const params = useParams()
  const jobId = params.jobId as string
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    coverLetter: '',
    resume: null as File | null
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (file: File | null) => {
    setFormData(prev => ({ ...prev, resume: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitted(true)
    setIsSubmitting(false)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Application Submitted!</CardTitle>
            <CardDescription>
              Our AI is now analyzing your application. You'll hear from us within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• AI reviews your resume and profiles</li>
                  <li>• Skills are matched against job requirements</li>
                  <li>• GitHub projects are analyzed for code quality</li>
                  <li>• LinkedIn experience is validated</li>
                  <li>• You receive a personalized response</li>
                </ul>
              </div>
              <Button onClick={() => window.close()} className="w-full">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{mockJob.company}</h1>
                              <p className="text-muted-foreground">Powered by findr-ai</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-xl">{mockJob.title}</CardTitle>
                <CardDescription className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {mockJob.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {mockJob.type}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {mockJob.salary}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Job Description</h3>
                  <p className="text-sm text-muted-foreground">{mockJob.description}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {mockJob.requirements.map((req, index) => (
                      <li key={index}>• {req}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Benefits</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {mockJob.benefits.map((benefit, index) => (
                      <li key={index}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Apply for this position</CardTitle>
                <CardDescription>
                  Our AI will analyze your application and match your skills to the job requirements. 
                  Most decisions are made within 24-48 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <Label htmlFor="resume">Resume *</Label>
                    <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload your resume (PDF, DOC, DOCX)
                      </p>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                        className="max-w-xs"
                        required
                      />
                      {formData.resume && (
                        <p className="text-sm text-green-600 mt-2">
                          ✓ {formData.resume.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Profile Links */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn Profile URL *
                      </Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={formData.linkedinUrl}
                        onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Our AI will verify your work experience and connections
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="githubUrl" className="flex items-center gap-2">
                        <Github className="h-4 w-4" />
                        GitHub Profile URL *
                      </Label>
                      <Input
                        id="githubUrl"
                        type="url"
                        placeholder="https://github.com/yourusername"
                        value={formData.githubUrl}
                        onChange={(e) => handleInputChange('githubUrl', e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Our AI will analyze your repositories and code quality
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="portfolioUrl">Portfolio/Website URL</Label>
                      <Input
                        id="portfolioUrl"
                        type="url"
                        placeholder="https://yourwebsite.com"
                        value={formData.portfolioUrl}
                        onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <Label htmlFor="coverLetter">Additional Information (Optional)</Label>
                    <Textarea
                      id="coverLetter"
                      placeholder="Tell us anything else you'd like us to know..."
                      value={formData.coverLetter}
                      onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* AI Notice */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">AI-Powered Review Process</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Your resume will be analyzed for skills and experience</li>
                      <li>• GitHub repositories will be assessed for code quality</li>
                      <li>• LinkedIn profile will be verified for work history</li>
                      <li>• All information is scored against job requirements</li>
                      <li>• You'll receive a personalized response based on fit score</li>
                    </ul>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 