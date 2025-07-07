'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Plus, X, Building, MapPin, DollarSign, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'

const JobFormData = {
  title: '',
  description: '',
  requirements: '',
  location: '',
  employment_type: '',
  salary_range: '',
  experience_level: '',
  skills_required: [] as string[],
  benefits: '',
  company_description: ''
}

// Sample company data for testing
const sampleCompanies = [
  {
    id: 'company-a',
    name: 'TechFlow Solutions',
    description: 'A cutting-edge fintech company revolutionizing digital payments',
    hiringFor: 'Full-stack developers and product designers',
    jobData: {
      title: 'Senior Full-Stack Developer',
      description: 'We are looking for a passionate Senior Full-Stack Developer to join our growing team. You will be responsible for developing and maintaining our core platform that processes millions of transactions daily. You\'ll work with cutting-edge technologies and have the opportunity to shape the future of digital payments.',
      requirements: 'Bachelor\'s degree in Computer Science or related field\n5+ years of experience in full-stack development\nProficiency in React, Node.js, and TypeScript\nExperience with PostgreSQL and Redis\nKnowledge of payment processing systems\nStrong problem-solving skills and attention to detail\nExperience with cloud platforms (AWS preferred)',
      location: 'San Francisco, CA',
      employment_type: 'full-time',
      salary_range: '$140,000 - $180,000',
      experience_level: 'senior',
      skills_required: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Payment Systems'],
      benefits: 'Competitive salary and equity package\nComprehensive health, dental, and vision insurance\nFlexible PTO and remote work options\nProfessional development budget\n401(k) with company matching\nDaily catered meals and snacks\nState-of-the-art office in downtown SF',
      company_description: 'TechFlow Solutions is at the forefront of financial technology, providing secure and efficient payment processing solutions to businesses worldwide. Our mission is to make digital transactions seamless, secure, and accessible to everyone. We\'re a fast-growing company with a collaborative culture that values innovation, transparency, and work-life balance.'
    }
  },
  {
    id: 'company-b',
    name: 'DataVision Analytics',
    description: 'AI-powered data analytics platform for enterprise clients',
    hiringFor: 'Junior Gen AI developers and AI enthusiasts',
    jobData: {
      title: 'Junior Gen AI Developer',
      description: 'Join our innovative AI team to help build the next generation of generative AI solutions for enterprise clients. As a Junior Gen AI Developer, you\'ll work alongside senior engineers to develop, fine-tune, and deploy large language models and generative AI applications. This is an excellent opportunity to learn cutting-edge AI technologies including prompt engineering, model fine-tuning, and AI agent development while contributing to real-world enterprise solutions.',
      requirements: 'Bachelor\'s degree in Computer Science, AI, or related field\n0-2 years of experience in software development or AI\nBasic knowledge of Python and machine learning concepts\nFamiliarity with AI frameworks (OpenAI API, Hugging Face, LangChain)\nUnderstanding of large language models (LLMs) and generative AI\nStrong problem-solving skills and eagerness to learn\nExperience with Git and basic software development practices\nPassion for AI and emerging technologies',
      location: 'Remote',
      employment_type: 'full-time',
      salary_range: '$75,000 - $95,000',
      experience_level: 'entry',
      skills_required: ['Python', 'OpenAI API', 'LangChain', 'Prompt Engineering', 'Hugging Face', 'Gen AI'],
      benefits: 'Competitive entry-level salary with growth potential\nStock options and equity participation\nComprehensive health and wellness benefits\nFlexible remote work with optional office days\nMentorship program with senior AI engineers\nProfessional development budget for AI courses\nLatest MacBook Pro and home office setup\nUnlimited PTO policy\nQuarterly team building events',
      company_description: 'DataVision Analytics empowers businesses to unlock the full potential of their data through advanced AI and machine learning solutions. We specialize in generative AI applications that help Fortune 500 companies automate workflows, enhance customer experiences, and drive innovation. Our team is passionate about democratizing AI technology and fostering the next generation of AI talent.'
    }
  }
]

export default function NewJobPage() {
  const router = useRouter()
  const { user, company, supabase } = useAuth()
  const [formData, setFormData] = useState(JobFormData)
  const [skillInput, setSkillInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)

  // Debug auth state
  console.log('🔍 Auth Debug:', {
    user: !!user,
    userEmail: user?.email,
    company: !!company,
    companyName: company?.company_name,
    companyId: company?.id
  })



  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills_required.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const handleTestCompanySelect = (companyData: typeof sampleCompanies[0]) => {
    setFormData(companyData.jobData)
    setIsTestDialogOpen(false)
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 Form Submit:', { user: !!user, company: !!company, userEmail: user?.email, companyName: company?.company_name })
    
    if (!user || !company) {
      console.log('❌ Auth check failed:', { user: !!user, company: !!company })
      setError('You must be logged in with a company account to post jobs')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Parse salary range if provided
      let salary_min = null;
      let salary_max = null;
      if (formData.salary_range) {
        const salaryMatch = formData.salary_range.match(/\$?(\d+(?:,\d+)*)\s*[-–]\s*\$?(\d+(?:,\d+)*)/);
        if (salaryMatch) {
          salary_min = parseInt(salaryMatch[1].replace(/,/g, ''));
          salary_max = parseInt(salaryMatch[2].replace(/,/g, ''));
        }
      }

      const jobData = {
        company_id: company.id,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements ? [formData.requirements] : null, // Convert string to array
        location: formData.location,
        job_type: formData.employment_type, // Map employment_type to job_type
        salary_min: salary_min,
        salary_max: salary_max,
        experience_level: formData.experience_level,
        skills_required: formData.skills_required, // Already an array
        benefits: formData.benefits ? [formData.benefits] : null, // Convert string to array
        status: 'draft' // Set to draft initially, will be changed to active when link is created
      }

      // Store job data in sessionStorage to pass to create-shareable-link page
      const jobDataForLink = {
        ...jobData,
        company_name: company.company_name,
        salary_range: formData.salary_range,
        employment_type: formData.employment_type,
        company_description: formData.company_description
      }

      sessionStorage.setItem('pendingJobData', JSON.stringify(jobDataForLink))
      
      // Redirect to create-shareable-link page
      router.push('/create-shareable-link?from=job-post')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container max-w-4xl px-6 mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <Button variant="ghost" asChild>
                <Link href="/company/jobs">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Jobs
                </Link>
              </Button>
              
              {/* Testing Feature Button - Top Right */}
              <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30">
                    <Zap className="mr-2 h-3 w-3" />
                    Testing Findr-AI?
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Test Finder-AI with Sample Companies</DialogTitle>
                    <DialogDescription>
                      Choose a sample company to automatically fill the job posting form with realistic data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {sampleCompanies.map((company) => (
                      <Card 
                        key={company.id} 
                        className="cursor-pointer transition-all duration-300 ease-in-out border-2 hover:border-red-300 dark:hover:border-red-700 hover:shadow-xl hover:shadow-red-100/20 dark:hover:shadow-red-900/20 hover:scale-[1.02] hover:-translate-y-1 group"
                        onClick={() => handleTestCompanySelect(company)}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                            <Building className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                            {company.name}
                          </CardTitle>
                          <CardDescription className="group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                            {company.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md group-hover:bg-red-50/50 dark:group-hover:bg-red-900/10 transition-colors duration-300">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors duration-300">Currently hiring for:</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300">{company.hiringFor}</p>
                          </div>
                          <div className="mt-3">
                            <Badge variant="secondary" className="text-xs bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:scale-105 transition-all duration-300">
                              {company.jobData.title}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post New Job</h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Step 1 of 2: Fill in job details, then create a shareable application link
            </p>
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                📋 <strong>New Workflow:</strong> After entering job details, you'll configure application requirements and create a shareable link to publish your job.
              </p>
            </div>
            
            {/* Quick Debug Info */}
            <div className="mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
              <span className="font-medium">Auth:</span> User: {user ? '✅' : '❌'} | Company: {company ? '✅' : '❌'} 
              {user && <span className="ml-2">({user.email})</span>}
              {company && <span className="ml-2">({company.company_name})</span>}
            </div>
            </div>
          </div>

          {/* Form */}
          <Card className="dark:bg-black dark:border-gray-800">
            <CardHeader className="text-center">
              <CardTitle className="dark:text-white">Job Details</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Fill in the job information below. Our AI will help screen candidates based on these requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    {error}
                  </div>
                )}

                {/* Job Title */}
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-base font-medium dark:text-gray-200">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                    className="h-12 text-base"
                    required
                  />
                </div>

                {/* Job Description */}
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-base font-medium dark:text-gray-200">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
                    rows={6}
                    className="text-base"
                    required
                  />
                </div>

                {/* Requirements */}
                <div className="space-y-3">
                  <Label htmlFor="requirements" className="text-base font-medium dark:text-gray-200">Requirements *</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="List the key requirements, qualifications, and experience needed..."
                    rows={4}
                    className="text-base"
                    required
                  />
                </div>

                {/* Location and Employment Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="location" className="text-base font-medium dark:text-gray-200">
                      <MapPin className="inline mr-1 h-4 w-4" />
                      Location *
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g. San Francisco, CA or Remote"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="employment_type" className="text-base font-medium dark:text-gray-200">
                      <Clock className="inline mr-1 h-4 w-4" />
                      Employment Type *
                    </Label>
                    <Select
                      value={formData.employment_type}
                      onValueChange={(value) => handleInputChange('employment_type', value)}
                      required
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Experience Level and Salary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="experience_level" className="text-base font-medium dark:text-gray-200">Experience Level *</Label>
                    <Select
                      value={formData.experience_level}
                      onValueChange={(value) => handleInputChange('experience_level', value)}
                      required
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                        <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                        <SelectItem value="senior">Senior Level (5+ years)</SelectItem>
                        <SelectItem value="lead">Lead/Principal (8+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="salary_range" className="text-base font-medium dark:text-gray-200">
                      <DollarSign className="inline mr-1 h-4 w-4" />
                      Salary Range (Optional)
                    </Label>
                    <Input
                      id="salary_range"
                      value={formData.salary_range}
                      onChange={(e) => handleInputChange('salary_range', e.target.value)}
                      placeholder="e.g. $80,000 - $120,000"
                      className="h-12 text-base"
                    />
                  </div>
                </div>

                {/* Skills Required */}
                <div className="space-y-3">
                  <Label htmlFor="skills" className="text-base font-medium dark:text-gray-200">Skills Required</Label>
                  <div className="flex gap-3">
                    <Input
                      id="skills"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add a skill and press Enter"
                      className="h-12 text-base"
                    />
                    <Button type="button" onClick={addSkill} size="sm" className="h-12 px-4">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.skills_required.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-red-800 dark:hover:text-red-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <Label htmlFor="benefits" className="text-base font-medium dark:text-gray-200">Benefits & Perks (Optional)</Label>
                  <Textarea
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    placeholder="List benefits, perks, and what makes this role attractive..."
                    rows={3}
                    className="text-base"
                  />
                </div>

                {/* Company Description */}
                <div className="space-y-3">
                  <Label htmlFor="company_description" className="text-base font-medium dark:text-gray-200">
                    <Building className="inline mr-1 h-4 w-4" />
                    Company Description (Optional)
                  </Label>
                  <Textarea
                    id="company_description"
                    value={formData.company_description}
                    onChange={(e) => handleInputChange('company_description', e.target.value)}
                    placeholder="Tell candidates about your company, culture, and mission..."
                    rows={3}
                    className="text-base"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6 justify-center">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3"
                  >
                                          {isSubmitting ? 'Continuing...' : 'Continue to Create Application Link'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/company/jobs')}
                    disabled={isSubmitting}
                    className="px-8 py-3"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 