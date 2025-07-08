'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { LuArrowLeft, LuUser, LuMail, LuGithub, LuLinkedin, LuFileText, LuLoader, LuEye } from 'react-icons/lu'
import { Container } from '@/components/layout/container'
import { PageContainer } from '@/components/layout/page-container'
import { formatDistance } from 'date-fns'

interface Applicant {
  id: string
  full_name: string
  email_address: string
  github_profile: string
  linkedin_url?: string
  repository_1_url: string
  repository_2_url?: string
  repository_3_url?: string
  resume_cv_url: string
  ai_evaluation_status: string
  ai_evaluation_results?: any
  created_at: string
  job_name: string
  company_name: string
}

interface Job {
  id: string
  title: string
  description: string
  location: string
  company_id: string
  created_at: string
}

export default function JobApplicantsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, company, supabase } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const jobId = params.id as string

  useEffect(() => {
    const fetchJobAndApplicants = async () => {
      if (!user || !company || !jobId) return

      try {
        setLoading(true)
        
        // First, fetch the job details
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .eq('company_id', company.id)
          .single()

        if (jobError) {
          console.error('❌ [Applicants] Error fetching job:', jobError)
          return
        }

        if (!jobData) {
          console.error('❌ [Applicants] Job not found')
          return
        }

        setJob(jobData)

        // Then fetch applicants for this job
        const { data: applicantsData, error: applicantsError } = await supabase
          .from('applicants')
          .select('*')
          .eq('job_name', jobData.title)
          .eq('company_name', company.company_name)
          .order('created_at', { ascending: false })

        if (applicantsError) {
          console.error('❌ [Applicants] Error fetching applicants:', applicantsError)
          return
        }

        console.log('✅ [Applicants] Found applicants:', applicantsData)
        setApplicants(applicantsData || [])

      } catch (error) {
        console.error('❌ [Applicants] Error in fetchJobAndApplicants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobAndApplicants()
  }, [user, company, supabase, jobId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'started':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'AI Analysis Complete'
      case 'started':
        return 'AI Analysis In Progress'
      case 'failed':
        return 'AI Analysis Failed'
      default:
        return 'Pending AI Analysis'
    }
  }

  const formatAppliedDate = (date: string) => {
    try {
      return formatDistance(new Date(date), new Date(), { addSuffix: true })
    } catch (e) {
      return 'Unknown date'
    }
  }

  if (loading || !user || !company) {
    return (
      <>
        <Navbar />
        <PageContainer>
          <div className="flex flex-col justify-center items-center p-12 gap-4">
            <LuLoader className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading applicants...</p>
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
          <div className="text-center p-12">
            <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
            <p className="text-muted-foreground mb-6">The job you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button asChild>
              <Link href="/company/jobs">
                <LuArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
              </Link>
            </Button>
          </div>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <PageContainer>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Button variant="outline" asChild className="mb-4">
                <Link href="/company/jobs">
                  <LuArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">{job.title} - Applicants</h1>
              <p className="text-muted-foreground mt-2">
                {applicants.length} {applicants.length === 1 ? 'applicant' : 'applicants'} • Posted {formatAppliedDate(job.created_at)}
              </p>
            </div>
          </div>

          {/* Job Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Job Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Position</p>
                  <p className="font-medium">{job.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="font-medium">{job.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Applications</p>
                  <p className="font-medium">{applicants.length} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applicants List */}
          {applicants.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-6">
                When candidates apply for this position, they'll appear here.
              </p>
              <Button asChild>
                <Link href={`/company/jobs/${job.id}`}>
                  <LuEye className="mr-2 h-4 w-4" /> View Job Posting
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Applications ({applicants.length})</h2>
              
              <div className="grid gap-6">
                {applicants.map((applicant) => (
                  <Card key={applicant.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Applicant Info */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                              <LuUser className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{applicant.full_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Applied {formatAppliedDate(applicant.created_at)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <LuMail className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={`mailto:${applicant.email_address}`}
                                className="text-blue-600 hover:underline"
                              >
                                {applicant.email_address}
                              </a>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <LuGithub className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={applicant.github_profile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                GitHub Profile
                              </a>
                            </div>

                            {applicant.linkedin_url && (
                              <div className="flex items-center gap-1">
                                <LuLinkedin className="h-4 w-4 text-muted-foreground" />
                                <a 
                                  href={applicant.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  LinkedIn
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions & Status */}
                        <div className="flex flex-col items-end gap-3">
                          <Badge className={getStatusColor(applicant.ai_evaluation_status)}>
                            {getStatusText(applicant.ai_evaluation_status)}
                          </Badge>
                          
                          <div className="flex gap-2">
                            {applicant.ai_evaluation_status === 'completed' && (
                              <Button size="sm" asChild>
                                <Link href={`/review/${applicant.id}`}>
                                  <LuEye className="mr-1 h-4 w-4" /> View AI Analysis
                                </Link>
                              </Button>
                            )}
                            
                            <Button variant="outline" size="sm" asChild>
                              <a 
                                href={applicant.resume_cv_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <LuFileText className="mr-1 h-4 w-4" /> Resume
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  )
} 