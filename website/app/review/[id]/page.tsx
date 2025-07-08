'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getBrowserClient } from '@/lib/supabase-browser'
import AIResultsDisplay from '@/components/ai-results-display'
import { 
  LuUser, 
  LuMail, 
  LuFileText, 
  LuGithub,
  LuLinkedin,
  LuCalendar,
  LuBriefcase,
  LuBuilding,
  LuArrowLeft,
  LuLoader,
  LuDownload,
  LuExternalLink,
  LuSparkles
} from 'react-icons/lu'

interface ApplicationData {
  id: string
  job_name: string
  company_name: string
  job_description: string | null
  full_name: string
  email_address: string
  resume_cv_url: string | null
  github_profile: string
  repository_1_url: string
  repository_2_url: string | null
  repository_3_url: string | null
  linkedin_url: string | null
  ai_evaluation_status: 'not_started' | 'started' | 'completed' | 'failed'
  ai_evaluation_results: any
  created_at: string | null
  updated_at: string | null
}

export default function ReviewPage() {
  const params = useParams()
  const applicationId = params.id as string
  
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const supabase = getBrowserClient()
        
        console.log('Fetching application data for ID:', applicationId)
        
        const { data, error } = await supabase
          .from('applicants')
          .select('*')
          .eq('id', applicationId)
          .single()

        if (error) {
          console.error('Supabase error:', error)
          setError(`Failed to fetch application data: ${error.message}`)
          return
        }

        if (!data) {
          setError('Application not found')
          return
        }

        console.log('Application data fetched:', data)
        setApplicationData(data as ApplicationData)
        
      } catch (err) {
        console.error('Fetch error:', err)
        setError('An unexpected error occurred while fetching the application data')
      } finally {
        setLoading(false)
      }
    }

    if (applicationId) {
      fetchApplicationData()
    }
  }, [applicationId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <LuLoader className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Loading Review
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-center">
              Fetching application data from database...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-96 shadow-xl border-red-200 dark:border-red-800">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <LuFileText className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Error Loading Review
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
              {error}
            </p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700">
                <LuArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Application Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
              The requested application could not be found.
            </p>
            <Link href="/">
              <Button>
                <LuArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { variant: 'default' as const, label: 'Analysis Complete', icon: LuSparkles }
      case 'started':
        return { variant: 'secondary' as const, label: 'In Progress', icon: LuLoader }
      case 'failed':
        return { variant: 'destructive' as const, label: 'Analysis Failed', icon: LuFileText }
      default:
        return { variant: 'outline' as const, label: 'Not Started', icon: LuFileText }
    }
  }

  const statusBadge = getStatusBadge(applicationData.ai_evaluation_status)
  const StatusIcon = statusBadge.icon

  // If AI analysis is complete and has results, show the AI Results Display
  if (applicationData.ai_evaluation_status === 'completed' && applicationData.ai_evaluation_results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <AIResultsDisplay 
            results={applicationData.ai_evaluation_results} 
            onClose={() => window.location.href = '/'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <LuArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Application Review
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                ID: {applicationId}
              </p>
            </div>
          </div>
          <Badge variant={statusBadge.variant} className="px-3 py-1">
            <StatusIcon className="h-4 w-4 mr-2" />
            {statusBadge.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Information */}
            <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <LuBriefcase className="h-5 w-5 text-blue-600" />
                  Position Applied For
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <LuBuilding className="h-4 w-4 text-slate-500" />
                  <span className="font-semibold text-lg">{applicationData.company_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <LuBriefcase className="h-4 w-4 text-slate-500" />
                  <span className="text-lg text-slate-700 dark:text-slate-300">{applicationData.job_name}</span>
                </div>
                {applicationData.job_description && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Job Description:</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {applicationData.job_description}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Applicant Information */}
            <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <LuUser className="h-5 w-5 text-green-600" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <LuUser className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Full Name</p>
                      <p className="font-semibold">{applicationData.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <LuMail className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                      <p className="font-semibold">{applicationData.email_address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume and Documents */}
            <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <LuFileText className="h-5 w-5 text-red-600" />
                  Resume & Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applicationData.resume_cv_url ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <LuFileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100">Resume/CV</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">PDF Document</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <a 
                        href={applicationData.resume_cv_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <LuDownload className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">No resume uploaded</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Links & Social */}
            <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <LuExternalLink className="h-5 w-5 text-purple-600" />
                  Links & Social
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {applicationData.github_profile && (
                  <div className="flex items-center gap-3">
                    <LuGithub className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    <a 
                      href={applicationData.github_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      GitHub Profile
                    </a>
                  </div>
                )}
                {applicationData.linkedin_url && (
                  <div className="flex items-center gap-3">
                    <LuLinkedin className="h-5 w-5 text-blue-600" />
                    <a 
                      href={applicationData.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Repositories */}
            <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <LuGithub className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                  GitHub Repositories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {applicationData.repository_1_url && (
                  <a 
                    href={applicationData.repository_1_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Repository 1</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {applicationData.repository_1_url.replace('https://github.com/', '')}
                    </p>
                  </a>
                )}
                {applicationData.repository_2_url && (
                  <a 
                    href={applicationData.repository_2_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Repository 2</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {applicationData.repository_2_url.replace('https://github.com/', '')}
                    </p>
                  </a>
                )}
                {applicationData.repository_3_url && (
                  <a 
                    href={applicationData.repository_3_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Repository 3</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {applicationData.repository_3_url.replace('https://github.com/', '')}
                    </p>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <LuCalendar className="h-5 w-5 text-indigo-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Application Submitted</p>
                    <p className="text-xs text-slate-500">
                      {applicationData.created_at ? new Date(applicationData.created_at).toLocaleDateString() : 'N/A'} at{' '}
                      {applicationData.created_at ? new Date(applicationData.created_at).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    applicationData.ai_evaluation_status === 'completed' ? 'bg-blue-500' : 
                    applicationData.ai_evaluation_status === 'started' ? 'bg-yellow-500' : 
                    applicationData.ai_evaluation_status === 'failed' ? 'bg-red-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium">AI Analysis {statusBadge.label}</p>
                    <p className="text-xs text-slate-500">
                      {applicationData.updated_at ? new Date(applicationData.updated_at).toLocaleDateString() : 'N/A'} at{' '}
                      {applicationData.updated_at ? new Date(applicationData.updated_at).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 