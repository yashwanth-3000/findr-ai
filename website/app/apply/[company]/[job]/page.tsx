'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LuUser, 
  LuMail, 
  LuFileText, 
  LuGithub,
  LuUpload,
  LuCheck,
  LuSparkles,
  LuRocket,
  LuMapPin,
  LuClock,
  LuDollarSign,
  LuUsers,
  LuBuilding,
  LuCalendar,
  LuBriefcase,
  LuClipboardList,
  LuLinkedin,
  LuMessageSquare,
  LuLink,
  LuArrowLeft
} from 'react-icons/lu'

export default function ApplicationPage() {
  const params = useParams()
  const company = params.company as string
  const job = params.job as string
  const linkId = `${company}/${job}`
  
  // State for configuration and error handling
  const [config, setConfig] = useState<any>(null)
  const [configError, setConfigError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Load configuration when component mounts
  useEffect(() => {
    const loadConfig = () => {
      try {
        const storedConfigs = localStorage.getItem('applicationConfigs')
        if (!storedConfigs) {
          setConfigError('No application configurations found.')
          setLoading(false)
          return
        }

        const configs = JSON.parse(storedConfigs)
        const linkConfig = configs[linkId]
        
        if (!linkConfig) {
          setConfigError('This application link is invalid or has expired.')
          setLoading(false)
          return
        }

        setConfig(linkConfig)
        // Initialize repositories array based on config
        setFormData(prev => ({
          ...prev,
          repositories: Array(linkConfig.numberOfRepos || 3).fill('')
        }))
        setLoading(false)
      } catch (error) {
        setConfigError('Error loading application configuration.')
        setLoading(false)
      }
    }

    loadConfig()
  }, [linkId])

  // Dynamic job data based on config and URL parameters
  const jobData = config ? {
    company: {
      name: config.companyName || "Company",
      logo: "🏢",
      location: "Remote",
      size: "Growing Team",
      industry: "Technology"
    },
    position: {
      title: config.jobTitle || "Job Position",
      department: "Engineering",
      type: "Full-time",
      remote: "Hybrid",
      salary: "Competitive",
      experience: "Experience Required",
      posted: "Recently"
    },
    description: `Join our team as a ${config.jobTitle} at ${config.companyName}. We're looking for talented individuals to help us grow and innovate.`,
    requirements: [
      "Relevant experience in the field",
      "Strong problem-solving skills",
      "Excellent communication abilities",
      "Team collaboration mindset",
      "Continuous learning attitude"
    ],
    benefits: [
      "Competitive salary package",
      "Health and wellness benefits",
      "Flexible working arrangements",
      "Professional development opportunities",
      "Collaborative work environment"
    ],
    skills: ["Problem Solving", "Communication", "Teamwork", "Adaptability", "Technical Skills"]
  } : null

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    resume: null as File | null,
    githubProfile: '',
    linkedin: '',
    repositories: [] as string[],
    customAnswer: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRepositoryChange = (index: number, value: string) => {
    const newRepos = [...formData.repositories]
    newRepos[index] = value
    setFormData(prev => ({ ...prev, repositories: newRepos }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, resume: file }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData(prev => ({ ...prev, resume: e.dataTransfer.files[0] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`🎉 Application submitted successfully for ${config?.jobTitle || 'the position'} at ${config?.companyName || 'the company'}! Our AI will review it soon.`)
      setFormData({
        fullName: '',
        email: '',
        resume: null,
        githubProfile: '',
        linkedin: '',
        repositories: Array(config?.numberOfRepos || 3).fill(''),
        customAnswer: ''
      })
    } catch (error) {
      alert('❌ Failed to submit application. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dynamic form validation based on config
  const isFormValid = config ? (
    (!config.requireName || formData.fullName.trim()) &&
    (!config.requireEmail || formData.email.trim()) &&
    (!config.requireResume || formData.resume) &&
    (!config.requireGithubProfile || formData.githubProfile.trim()) &&
    (!config.requireLinkedin || formData.linkedin.trim()) &&
    (!config.requireTopRepos || formData.repositories.every(repo => repo.trim())) &&
    (!config.customQuestion || !config.customQuestionRequired || formData.customAnswer.trim())
  ) : false

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading application form...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (configError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Application Link Not Found</h1>
          <p className="text-slate-600 dark:text-slate-300 mb-4">{configError}</p>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              <strong>Looking for:</strong>
            </p>
            <p className="font-mono text-sm bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded text-blue-800 dark:text-blue-200">
              /apply/{company}/{job}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
              💡 This application link needs to be created first through the "Create Shareable Link" page with company "{company}" and job "{job}".
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link href="/create-shareable-link">
                <LuLink className="h-4 w-4 mr-2" />
                Create This Link
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">
                <LuArrowLeft className="h-4 w-4 mr-2" />
                Return to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if jobData is not available
  if (!jobData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-2 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-lg shadow-red-500/25">
              <LuSparkles className="h-5 w-5 animate-pulse" />
              AI-Powered Application
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
              Apply to {jobData.company.name}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Our AI will analyze your profile and provide personalized feedback within 24-48 hours
            </p>
          </div>

          {/* Two-Column Layout */}
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left Side - Company Information */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl border border-red-100/50 dark:border-red-900/20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md sticky top-6 overflow-hidden">
                <CardHeader className="pb-6 bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/20">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-2xl text-white shadow-lg">
                      {jobData.company.logo}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                        {jobData.position.title}
                      </CardTitle>
                      <CardDescription className="text-xl font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-4">
                        {jobData.company.name}
                      </CardDescription>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <LuMapPin className="h-4 w-4" />
                          {jobData.company.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <LuBriefcase className="h-4 w-4" />
                          {jobData.position.type} • {jobData.position.remote}
                        </div>
                        <div className="flex items-center gap-1">
                          <LuDollarSign className="h-4 w-4" />
                          {jobData.position.salary}
                        </div>
                        <div className="flex items-center gap-1">
                          <LuCalendar className="h-4 w-4" />
                          Posted {jobData.position.posted}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Job Description */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 dark:bg-red-950/50 rounded-lg">
                        <LuBriefcase className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      About the Role
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                      {jobData.description}
                    </p>
                  </div>

                  {/* Requirements */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 dark:bg-red-950/50 rounded-lg">
                        <LuClipboardList className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      Requirements
                    </h3>
                    <ul className="space-y-2">
                      {jobData.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 group">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 group-hover:bg-red-600 transition-colors"></div>
                          <span className="group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 dark:bg-red-950/50 rounded-lg">
                        <LuSparkles className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      Benefits
                    </h3>
                    <ul className="space-y-2">
                      {jobData.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 group">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0 group-hover:bg-red-600 transition-colors"></div>
                          <span className="group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Skills */}
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 dark:bg-red-950/50 rounded-lg">
                        <LuRocket className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      Key Technologies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {jobData.skills.map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200/50 dark:border-red-800/50 rounded-xl p-5 shadow-inner">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 dark:bg-red-950/50 rounded-lg">
                        <LuBuilding className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      About {jobData.company.name}
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/30 rounded-lg">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Industry:</span> 
                        <span className="text-red-700 dark:text-red-300 font-medium">{jobData.company.industry}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/30 rounded-lg">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Company Size:</span> 
                        <span className="text-red-700 dark:text-red-300 font-medium">{jobData.company.size}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

                        {/* Right Side - Application Form */}
            <div className="lg:col-span-3">
            <Card className="shadow-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md overflow-hidden">
              <CardHeader className="pb-8 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50">
                <CardTitle className="flex items-center gap-3 text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl text-white shadow-lg">
                    <LuRocket className="h-6 w-6" />
                  </div>
                  Apply for {jobData.position.title}
                </CardTitle>
                <CardDescription className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                  Submit your application for the <span className="font-semibold text-red-600 dark:text-red-400">{jobData.position.title}</span> position at <span className="font-semibold text-red-600 dark:text-red-400">{jobData.company.name}</span>. Our AI will analyze your profile and match your skills to the role requirements.
                </CardDescription>
              </CardHeader>
            
                          <CardContent className="p-8 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Personal Information Section */}
                  {(config?.requireName || config?.requireEmail) && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></div>
                        <Badge variant="outline" className="text-sm font-semibold px-4 py-2 border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                          Personal Information
                        </Badge>
                      </div>
                    
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {config?.requireName && (
                          <div className="space-y-3">
                            <Label className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                <LuUser className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                              Full Name *
                            </Label>
                            <Input 
                              placeholder="Enter your full name" 
                              value={formData.fullName}
                              onChange={(e) => handleInputChange('fullName', e.target.value)}
                              required
                              className="h-12 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl text-base shadow-sm hover:shadow-md transition-all duration-200"
                            />
                          </div>
                        )}
                        
                        {config?.requireEmail && (
                          <div className="space-y-3">
                            <Label className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                <LuMail className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                              Email Address *
                            </Label>
                            <Input 
                              placeholder="your.email@example.com" 
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              required
                              className="h-12 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl text-base shadow-sm hover:shadow-md transition-all duration-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resume Upload Section */}
                  {config?.requireResume && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></div>
                        <Badge variant="outline" className="text-sm font-semibold px-4 py-2 border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                          Documents
                        </Badge>
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <LuFileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          Resume/CV *
                        </Label>
                        <div 
                          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                            dragActive 
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                              : formData.resume
                              ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                              : 'border-slate-300 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-500 bg-slate-50 dark:bg-slate-800/50'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required
                          />
                          
                          <div className="space-y-3">
                            {formData.resume ? (
                              <>
                                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                                  <LuCheck className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                    ✓ {formData.resume.name}
                                  </p>
                                  <p className="text-xs text-green-600 dark:text-green-500">
                                    File uploaded successfully
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <LuUpload className={`h-12 w-12 mx-auto ${dragActive ? 'text-red-500' : 'text-slate-400'}`} />
                                <div>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {dragActive ? 'Drop your resume here' : 'Drop your resume here or click to upload'}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    PDF, DOC, DOCX up to 10MB
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LinkedIn Section */}
                  {config?.requireLinkedin && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></div>
                        <Badge variant="outline" className="text-sm font-semibold px-4 py-2 border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                          LinkedIn Profile
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <LuLinkedin className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          LinkedIn Profile *
                        </Label>
                        <Input 
                          placeholder="linkedin.com/in/yourprofile" 
                          value={formData.linkedin}
                          onChange={(e) => handleInputChange('linkedin', e.target.value)}
                          required
                          className="h-12 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl text-base shadow-sm hover:shadow-md transition-all duration-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* GitHub Section */}
                  {(config?.requireGithubProfile || config?.requireTopRepos) && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></div>
                        <Badge variant="outline" className="text-sm font-semibold px-4 py-2 border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                          GitHub Profile
                        </Badge>
                      </div>
                      
                      <div className="space-y-6">
                        {config?.requireGithubProfile && (
                          <div className="space-y-3">
                            <Label className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                <LuGithub className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                              GitHub Profile *
                            </Label>
                            <Input 
                              placeholder="github.com/yourusername" 
                              value={formData.githubProfile}
                              onChange={(e) => handleInputChange('githubProfile', e.target.value)}
                              required
                              className="h-12 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl text-base shadow-sm hover:shadow-md transition-all duration-200"
                            />
                          </div>
                        )}
                        
                        {config?.requireTopRepos && formData.repositories.length > 0 && (
                          <div className="space-y-4">
                            <Label className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                              <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                <LuGithub className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                              Top {config.numberOfRepos} GitHub Repositories *
                            </Label>
                            <div className="space-y-4">
                              {formData.repositories.map((repo, i) => (
                                <div key={i} className="relative group">
                                  <Input 
                                    placeholder={`Repository ${i + 1} URL (e.g., github.com/user/repo)`}
                                    value={repo}
                                    onChange={(e) => handleRepositoryChange(i, e.target.value)}
                                    required
                                    className="h-12 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl text-base shadow-sm hover:shadow-md transition-all duration-200 pl-12"
                                  />
                                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                                    {i + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                <span className="text-lg">💡</span>
                                <span>Choose repositories that best showcase your skills and coding ability. Public repositories work best for our AI analysis.</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Question Section */}
                  {config?.customQuestion && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></div>
                        <Badge variant="outline" className="text-sm font-semibold px-4 py-2 border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                          Additional Information
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200">
                          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <LuMessageSquare className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </div>
                          {config.customQuestion} {config.customQuestionRequired ? '*' : '(Optional)'}
                        </Label>
                        <Textarea 
                          placeholder="Your answer..." 
                          value={formData.customAnswer}
                          onChange={(e) => handleInputChange('customAnswer', e.target.value)}
                          required={config.customQuestionRequired}
                          className="min-h-[120px] border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-xl text-base shadow-sm hover:shadow-md transition-all duration-200"
                        />
                      </div>
                    </div>
                  )}

                {/* Submit Button */}
                <div className="pt-8">
                  <Button 
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className={`w-full h-14 text-lg font-semibold transition-all duration-300 rounded-xl ${
                      isFormValid 
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-xl hover:shadow-2xl hover:scale-[1.02] text-white' 
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Application...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <LuRocket className="h-5 w-5" />
                        <span>Apply to {jobData.company.name}</span>
                      </div>
                    )}
                  </Button>
                  
                  {!isFormValid && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <p className="text-sm text-amber-700 dark:text-amber-300 text-center">
                        Please fill in all required fields to submit your application
                      </p>
                    </div>
                  )}
                </div>


              </form>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 