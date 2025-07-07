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
import { ArrowLeft, Plus, X, Building, MapPin, DollarSign, Clock } from 'lucide-react'
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

export default function NewJobPage() {
  const router = useRouter()
  const { user, company, supabase } = useAuth()
  const [formData, setFormData] = useState(JobFormData)
  const [skillInput, setSkillInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !company) {
      setError('You must be logged in with a company account to post jobs')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Generate a unique public link ID
      const publicLinkId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const jobData = {
        company_id: company.id,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        employment_type: formData.employment_type,
        salary_range: formData.salary_range || null,
        experience_level: formData.experience_level,
        skills_required: formData.skills_required,
        benefits: formData.benefits || null,
        company_description: formData.company_description || null,
        public_link_id: publicLinkId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('jobs')
        .insert([jobData])

      if (insertError) {
        console.error('Error creating job:', insertError)
        setError('Failed to create job posting. Please try again.')
        return
      }

      // Redirect to jobs list with success message
      router.push('/company/jobs?created=success')
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
          <div className="mb-8 text-center">
            <div className="mb-4">
              <Button variant="ghost" asChild>
                <Link href="/company/jobs">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Jobs
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post New Job</h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Create a new job posting and get AI-powered candidate screening
            </p>
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
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-red-600"
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
                    {isSubmitting ? 'Creating Job...' : 'Post Job'}
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