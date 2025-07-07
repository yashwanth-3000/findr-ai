'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { Container } from '@/components/layout/container'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

import { LuSave, LuLoader, LuX, LuChevronLeft } from 'react-icons/lu'
import Link from 'next/link'

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const { user, supabase } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const jobId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    job_type: 'full_time',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    salary_period: 'year',
    skills_required: '',
    experience_level: 'mid',
    education_level: '',
    remote_option: 'hybrid',
    application_deadline: ''
  })
  
  // Load job data
  useEffect(() => {
    const fetchJobData = async () => {
      if (!jobId || !user) return
      
      try {
        setIsLoading(true)
        
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .eq('company_id', user.id)
          .single()
        
        if (error) throw error
        
        if (data) {
          // Format the skills array back to a comma-separated string
          const skillsString = data.skills_required ? data.skills_required.join(', ') : ''
          
          setFormData({
            title: data.title || '',
            description: data.description || '',
            location: data.location || '',
            job_type: data.job_type || 'full_time',
            salary_min: data.salary_min ? data.salary_min.toString() : '',
            salary_max: data.salary_max ? data.salary_max.toString() : '',
            salary_currency: data.salary_currency || 'USD',
            salary_period: data.salary_period || 'year',
            skills_required: skillsString,
            experience_level: data.experience_level || 'mid',
            education_level: data.education_level || '',
            remote_option: data.remote_option || 'hybrid',
            application_deadline: data.application_deadline ? new Date(data.application_deadline).toISOString().split('T')[0] : ''
          })
        }
      } catch (error) {
        console.error('Error fetching job data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load job data',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchJobData()
  }, [jobId, user, supabase])
  
  // Form input handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Select input handler
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.location) {
        throw new Error('Please fill in all required fields')
      }
      
      if (!user || !jobId) {
        throw new Error('Unable to update job')
      }
      
      // Prepare skills array from comma-separated string
      const skills = formData.skills_required
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill !== '')
      
      // Update job
      const { error } = await supabase
        .from('jobs')
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          job_type: formData.job_type,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
          salary_currency: formData.salary_currency,
          salary_period: formData.salary_period,
          skills_required: skills,
          experience_level: formData.experience_level,
          education_level: formData.education_level || null,
          remote_option: formData.remote_option,
          application_deadline: formData.application_deadline || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('company_id', user.id)
      
      if (error) throw error
      
      toast({
        title: 'Success',
        description: 'Job updated successfully'
      })
      
      // Redirect to job details page
      router.push(`/company/jobs/${jobId}`)
      
    } catch (error) {
      console.error('Error updating job:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update job',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <PageContainer>
          <div className="flex flex-col justify-center items-center p-20 gap-4">
            <LuLoader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading... If not loaded in 3 seconds, please refresh the page</p>
          </div>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageContainer>
        <Container className="max-w-3xl">
            <div className="mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="mb-2"
              >
                <Link href={`/company/jobs/${jobId}`}>
                  <LuChevronLeft className="mr-1 h-4 w-4" /> Back to Job
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Edit Job</h1>
              <p className="text-muted-foreground">Update your job listing</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form id="job-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
                      <Input 
                        id="title" 
                        name="title" 
                        placeholder="e.g. Senior Frontend Developer" 
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Job Description <span className="text-red-500">*</span></Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Enter a detailed job description" 
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows={10}
                        className="resize-y"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                        <Input 
                          id="location" 
                          name="location" 
                          placeholder="e.g. San Francisco, CA" 
                          value={formData.location}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="remote_option">Remote Work</Label>
                        <Select
                          value={formData.remote_option}
                          onValueChange={(value) => handleSelectChange('remote_option', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select remote work option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on_site">On-site only</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="remote">Fully remote</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="job_type">Job Type</Label>
                        <Select
                          value={formData.job_type}
                          onValueChange={(value) => handleSelectChange('job_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Full-time</SelectItem>
                            <SelectItem value="part_time">Part-time</SelectItem>
                            <SelectItem value="contract">Contract</SelectItem>
                            <SelectItem value="internship">Internship</SelectItem>
                            <SelectItem value="temporary">Temporary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="experience_level">Experience Level</Label>
                        <Select
                          value={formData.experience_level}
                          onValueChange={(value) => handleSelectChange('experience_level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entry">Entry level</SelectItem>
                            <SelectItem value="mid">Mid level</SelectItem>
                            <SelectItem value="senior">Senior level</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <Label htmlFor="salary_currency">Currency</Label>
                        <Select
                          value={formData.salary_currency}
                          onValueChange={(value) => handleSelectChange('salary_currency', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="salary_min">Min Salary</Label>
                        <Input 
                          id="salary_min" 
                          name="salary_min" 
                          type="number" 
                          placeholder="e.g. 50000" 
                          value={formData.salary_min}
                          onChange={handleChange}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="salary_max">Max Salary</Label>
                        <Input 
                          id="salary_max" 
                          name="salary_max" 
                          type="number" 
                          placeholder="e.g. 80000" 
                          value={formData.salary_max}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="salary_period">Salary Period</Label>
                        <Select
                          value={formData.salary_period}
                          onValueChange={(value) => handleSelectChange('salary_period', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hour">Per hour</SelectItem>
                            <SelectItem value="day">Per day</SelectItem>
                            <SelectItem value="month">Per month</SelectItem>
                            <SelectItem value="year">Per year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="application_deadline">Application Deadline</Label>
                        <Input 
                          id="application_deadline" 
                          name="application_deadline" 
                          type="date" 
                          value={formData.application_deadline}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="skills_required">Skills Required (comma separated)</Label>
                      <Input 
                        id="skills_required" 
                        name="skills_required" 
                        placeholder="e.g. React, TypeScript, Node.js" 
                        value={formData.skills_required}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="education_level">Education Level</Label>
                      <Input 
                        id="education_level" 
                        name="education_level" 
                        placeholder="e.g. Bachelor's degree in Computer Science" 
                        value={formData.education_level}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => router.back()}
                >
                  <LuX className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="job-form"
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
            </Card>
        </Container>
      </PageContainer>
    </>
  )
} 