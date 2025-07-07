'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { useAuth } from '@/contexts/auth-context'
import { Container } from '@/components/layout/container'
import { PageContainer } from '@/components/layout/page-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { toast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { LuLoader, LuChevronLeft, LuPenLine, LuUsers, LuMenu } from 'react-icons/lu'
import Link from 'next/link'

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user, supabase } = useAuth()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const jobId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : null
  
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId || !user) return
      
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .eq('company_id', user.id)
          .single()
        
        if (error) throw error
        
        setJob(data)
      } catch (error) {
        console.error('Error fetching job details:', error)
        toast({
          title: 'Error',
          description: 'Failed to load job details',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchJobDetails()
  }, [jobId, user, supabase])
  
  const handleStatusUpdate = async (newStatus: string) => {
    if (!jobId || !user) return
    
    try {
      setUpdatingStatus(true)
      
      const { error } = await supabase
        .from('jobs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('company_id', user.id)
      
      if (error) throw error
      
      // Update local state
      setJob((prev: typeof job) => ({
        ...prev,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }))
      
      toast({
        title: 'Success',
        description: `Job status updated to ${newStatus}`,
      })
    } catch (error) {
      console.error('Error updating job status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatus(false)
    }
  }
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    try {
      return format(new Date(dateString), 'PPP')
    } catch (e) {
      return 'Invalid date'
    }
  }
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'closed':
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  // Get job type display
  const getJobTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract',
      internship: 'Internship',
      temporary: 'Temporary',
    }
    return typeMap[type] || type
  }
  
  // Get remote option display
  const getRemoteOptionDisplay = (option: string) => {
    const optionMap: Record<string, string> = {
      on_site: 'On-site only',
      hybrid: 'Hybrid',
      remote: 'Fully remote',
    }
    return optionMap[option] || option
  }
  
  // Get experience level display
  const getExperienceLevelDisplay = (level: string) => {
    const levelMap: Record<string, string> = {
      entry: 'Entry level',
      mid: 'Mid level',
      senior: 'Senior level',
      executive: 'Executive',
    }
    return levelMap[level] || level
  }
  
  // Format salary range
  const formatSalary = () => {
    if (!job) return 'Not specified'
    
    const { salary_min, salary_max, salary_currency, salary_period } = job
    
    if (!salary_min && !salary_max) return 'Not specified'
    
    const currency = salary_currency || 'USD'
    const period = salary_period || 'year'
    
    const periodMap: Record<string, string> = {
      hour: 'per hour',
      day: 'per day',
      month: 'per month',
      year: 'per year',
    }
    
    if (salary_min && salary_max) {
      return `${currency} ${salary_min.toLocaleString()} - ${salary_max.toLocaleString()} ${periodMap[period]}`
    } else if (salary_min) {
      return `${currency} ${salary_min.toLocaleString()} ${periodMap[period]}`
    } else if (salary_max) {
      return `Up to ${currency} ${salary_max.toLocaleString()} ${periodMap[period]}`
    }
    
    return 'Not specified'
  }

  if (loading) {
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
  
  if (!job) {
    return (
      <>
        <Navbar />
        <PageContainer>
          <Card className="p-8 text-center">
            <h3 className="text-xl font-medium mb-2">Job Not Found</h3>
            <p className="text-muted-foreground mb-6">The job posting you are looking for does not exist or you don't have permission to view it.</p>
            <Button asChild>
              <Link href="/company/jobs">
                <LuChevronLeft className="mr-2 h-4 w-4" /> Back to Jobs
              </Link>
            </Button>
          </Card>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageContainer>
        <Container>
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="mb-2"
                >
                  <Link href="/company/jobs">
                    <LuChevronLeft className="mr-1 h-4 w-4" /> Back to Jobs
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold">{job.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(job.status)}
                  <span className="text-muted-foreground text-sm">Posted on {formatDate(job.created_at)}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                >
                  <Link href={`/company/jobs/${job.id}/edit`}>
                    <LuPenLine className="mr-1 h-4 w-4" /> Edit Job
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                >
                  <Link href={`/company/jobs/${job.id}/applicants`}>
                    <LuUsers className="mr-1 h-4 w-4" /> View Applicants
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <LuLoader className="h-4 w-4 animate-spin" />
                      ) : (
                        <LuMenu className="h-4 w-4" />
                      )}
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {job.status === 'draft' && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate('active')}
                        className="text-green-600 focus:text-green-600"
                      >
                        Activate Job
                      </DropdownMenuItem>
                    )}
                    {job.status === 'active' && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate('closed')}
                      >
                        Close Job
                      </DropdownMenuItem>
                    )}
                    {job.status === 'closed' && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate('active')}
                        className="text-green-600 focus:text-green-600"
                      >
                        Reactivate Job
                      </DropdownMenuItem>
                    )}
                    {job.status !== 'draft' && (
                      <DropdownMenuItem 
                        onClick={() => handleStatusUpdate('draft')}
                      >
                        Move to Draft
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Job Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-1">Location</h3>
                    <p>{job.location} ({getRemoteOptionDisplay(job.remote_option)})</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Job Type</h3>
                    <p>{getJobTypeDisplay(job.job_type)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Experience Level</h3>
                    <p>{getExperienceLevelDisplay(job.experience_level)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Salary Range</h3>
                    <p>{formatSalary()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Education</h3>
                    <p>{job.education_level || 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Application Deadline</h3>
                    <p>{formatDate(job.application_deadline)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required && job.skills_required.length > 0 ? (
                    job.skills_required.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No specific skills listed</p>
                  )}
                </div>
              </CardContent>
            </Card>
        </Container>
      </PageContainer>
    </>
  )
} 