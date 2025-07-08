'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getBrowserClient } from '@/lib/supabase-browser'
import AIResultsDisplay from '@/components/ai-results-display'
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
  const router = useRouter()
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
  
  // AI Analysis states
  const [aiAnalysisProgress, setAiAnalysisProgress] = useState<{
    stage: 'idle' | 'starting' | 'analyzing' | 'completed' | 'error'
    message: string
    progress: number
    jobId?: string
    applicationId?: string
  }>({
    stage: 'idle',
    message: '',
    progress: 0
  })

  // AI Analysis Results state
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any>(null)

  // Function to close results and reset form
  const handleCloseResults = () => {
    setAiAnalysisResults(null)
    setFormData({
      fullName: '',
      email: '',
      resume: null,
      githubProfile: '',
      linkedin: '',
      repositories: Array(config?.numberOfRepos || 3).fill(''),
      customAnswer: ''
    })
    setAiAnalysisProgress({
      stage: 'idle',
      message: '',
      progress: 0
    })
  }

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
    
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('❌ Please upload a PDF file only')
        e.target.value = '' // Clear the input
        return
      }
      
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        alert('❌ File too large! Maximum size is 50MB')
        e.target.value = '' // Clear the input
        return
      }
      
      if (file.size === 0) {
        alert('❌ File appears to be empty')
        e.target.value = '' // Clear the input
        return
      }
      
      console.log('PDF file selected:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type
      })
    }
    
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
      const file = e.dataTransfer.files[0]
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('❌ Please upload a PDF file only')
        return
      }
      
      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        alert('❌ File too large! Maximum size is 50MB')
        return
      }
      
      if (file.size === 0) {
        alert('❌ File appears to be empty')
        return
      }
      
      console.log('PDF file dropped:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type
      })
      
      setFormData(prev => ({ ...prev, resume: file }))
    }
  }

  // AI Analysis Functions
  const startAIAnalysis = async (applicationId: string, resumeFile: File, repositoryUrls: string[], resumeStorageUrl?: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://139-84-149-99.sslip.io'
    
    try {
      setAiAnalysisProgress({
        stage: 'starting',
        message: 'Starting AI analysis...',
        progress: 0.1,
        applicationId
      })

      // Enhanced PDF file validation
      if (!resumeFile || resumeFile.type !== 'application/pdf') {
        throw new Error('Invalid PDF file - please upload a valid PDF resume')
      }

      // Additional file size validation (50MB limit as per API)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (resumeFile.size > maxSize) {
        throw new Error('PDF file too large - maximum size is 50MB')
      }

      // Validate file is actually readable
      if (resumeFile.size === 0) {
        throw new Error('PDF file appears to be empty or corrupted')
      }

      console.log('PDF validation passed:', {
        name: resumeFile.name,
        size: resumeFile.size,
        type: resumeFile.type,
        storageUrl: resumeStorageUrl
      })

      // Validate GitHub profile
      if (!formData.githubProfile.includes('github.com/')) {
        throw new Error('Please provide a valid GitHub profile URL')
      }

      // Filter valid repositories
      const validRepos = repositoryUrls.filter(repo => repo.trim() && repo.includes('github.com/'))
      
      if (validRepos.length === 0) {
        throw new Error('Please provide at least one valid GitHub repository URL')
      }

      // Create comprehensive job description
      const fullJobDescription = jobData ? [
        'About the Role',
        jobData.description,
        '',
        'Requirements',
        ...jobData.requirements,
        '',
        'Benefits',
        ...jobData.benefits,
        '',
        'Key Technologies',
        ...jobData.skills,
        '',
        `About ${jobData.company.name}`,
        `Industry: ${jobData.company.industry}`,
        `Company Size: ${jobData.company.size}`
      ].join('\n') : ''

      // Prepare form data for API
      const apiFormData = new FormData()
      apiFormData.append('pdf_file', resumeFile)
      apiFormData.append('github_profile_url', formData.githubProfile)
      apiFormData.append('best_project_repos', JSON.stringify(validRepos))
      apiFormData.append('job_description', fullJobDescription)
      apiFormData.append('company_name', config?.companyName || '')
      apiFormData.append('job_name', config?.jobTitle || '')

      console.log('Sending to Resume Analyzer API:', {
        apiUrl: `${API_URL}/analyze-resume-async`,
        pdfSize: resumeFile.size,
        githubProfile: formData.githubProfile,
        repositoryCount: validRepos.length,
        jobTitle: config?.jobTitle,
        companyName: config?.companyName
      })

      setAiAnalysisProgress(prev => ({
        ...prev,
        stage: 'analyzing',
        message: 'Submitting to AI analyzer...',
        progress: 0.2
      }))

      // Start async analysis without timeout (as requested)
      let response: Response
      try {
        response = await fetch(`${API_URL}/analyze-resume-async`, {
          method: 'POST',
          body: apiFormData
        })
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`)
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500) // Log first 500 chars
        })
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      if (!result.success || !result.job_id) {
        throw new Error(result.message || 'Failed to start analysis')
      }

      setAiAnalysisProgress(prev => ({
        ...prev,
        message: 'Analysis started successfully. Monitoring progress...',
        progress: 0.3,
        jobId: result.job_id
      }))

      // Poll for results
      await pollAnalysisResults(result.job_id, applicationId)

    } catch (error) {
      console.error('AI Analysis error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setAiAnalysisProgress({
        stage: 'error',
        message: `Analysis failed: ${errorMessage}`,
        progress: 0,
        applicationId
      })
      
      // Update database with error status
      try {
        await updateApplicationStatus(applicationId, 'failed', { 
          error: errorMessage,
          timestamp: new Date().toISOString(),
          step: 'api_submission'
        })
      } catch (dbError) {
        console.error('Failed to update database after AI analysis error:', dbError)
      }
    }
  }

  const pollAnalysisResults = async (jobId: string, applicationId: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://139-84-149-99.sslip.io'
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    let attempts = 0

    const pollInterval = setInterval(async () => {
      try {
        attempts++
        
        const response = await fetch(`${API_URL}/analysis-status/${jobId}`)
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`)
        }

        const statusData = await response.json()
        const progress = Math.min(0.3 + (statusData.progress || 0) * 0.6, 0.9)

        setAiAnalysisProgress(prev => ({
          ...prev,
          message: `AI Analysis: ${statusData.status} (${Math.round(progress * 100)}%)`,
          progress,
          jobId
        }))

        if (statusData.status === 'completed' && statusData.results) {
          clearInterval(pollInterval)
          
          setAiAnalysisProgress(prev => ({
            ...prev,
            stage: 'completed',
            message: 'Analysis completed successfully!',
            progress: 1.0
          }))

          // Save results to database
          await updateApplicationStatus(applicationId, 'completed', statusData.results)
          
          // Store results for display
          setAiAnalysisResults(statusData.results)
          
          // Redirect to review page after a short delay
          setTimeout(() => {
            router.push(`/review/${applicationId}`)
          }, 3000) // 3 second delay to show completion message
          
          // Clean up job on server
          try {
            await fetch(`${API_URL}/analysis-job/${jobId}`, { method: 'DELETE' })
          } catch (e) {
            console.warn('Failed to clean up job:', e)
          }

        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval)
          
          const errorMessage = statusData.error || 'Analysis failed on server'
          
          setAiAnalysisProgress({
            stage: 'error',
            message: `Analysis failed: ${errorMessage}`,
            progress: 0,
            applicationId
          })
          
          try {
            await updateApplicationStatus(applicationId, 'failed', { 
              error: errorMessage,
              timestamp: new Date().toISOString(),
              step: 'api_processing'
            })
          } catch (dbError) {
            console.error('Failed to update database after polling error:', dbError)
          }
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          
          setAiAnalysisProgress({
            stage: 'error',
            message: 'Analysis is taking longer than expected. Please check back later.',
            progress: 0,
            applicationId
          })
          
          try {
            await updateApplicationStatus(applicationId, 'failed', { 
              error: 'Analysis timeout after 5 minutes',
              timestamp: new Date().toISOString(),
              step: 'polling_timeout'
            })
          } catch (dbError) {
            console.error('Failed to update database after timeout:', dbError)
          }
          return
        }

      } catch (error) {
        clearInterval(pollInterval)
        console.error('Polling error:', error)
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        setAiAnalysisProgress({
          stage: 'error',
          message: `Monitoring failed: ${errorMessage}`,
          progress: 0,
          applicationId
        })
        
        try {
          await updateApplicationStatus(applicationId, 'failed', { 
            error: errorMessage,
            timestamp: new Date().toISOString(),
            step: 'polling_error'
          })
        } catch (dbError) {
          console.error('Failed to update database after polling error:', dbError)
        }
      }
    }, 5000) // Poll every 5 seconds
  }

  const updateApplicationStatus = async (applicationId: string, status: string, results?: any) => {
    try {
      const supabase = getBrowserClient()
      
      // Validate status value against database constraint
      const allowedStatuses = ['not_started', 'started', 'completed', 'failed']
      if (!allowedStatuses.includes(status)) {
        console.error('Invalid status value:', status)
        status = 'failed' // Default to failed for invalid statuses
      }
      
      const updateData: any = {
        ai_evaluation_status: status,
        updated_at: new Date().toISOString()
    }
      
      if (results) {
        updateData.ai_evaluation_results = results
      }
      
      console.log('Updating application status:', { applicationId, status, hasResults: !!results })
      
      const { error } = await supabase
        .from('applicants')
        .update(updateData)
        .eq('id', applicationId)
      
      if (error) {
        console.error('Database update error:', error)
        console.error('Update data was:', updateData)
      } else {
        console.log('Application status updated successfully')
      }
    } catch (error) {
      console.error('Failed to update application status:', error)
    }
  }

  // Test data filling function
  const fillTestData = () => {
    const testRepos = [
      'https://github.com/yashwanth-3000/content--hub',
      'https://github.com/yashwanth-3000/cyber-verse',
      'https://github.com/yashwanth-3000/insta_dm'
    ]
    
    // Create repositories array matching the config length
    const repoCount = config?.numberOfRepos || 3
    const repositories = Array(repoCount).fill('').map((_, index) => 
      index < testRepos.length ? testRepos[index] : ''
    )

    setFormData({
      fullName: 'yash',
      email: 'yashwanthkrishna169@gmail.com',
      resume: formData.resume, // Keep existing resume if uploaded
      githubProfile: 'https://github.com/yashwanth-3000',
      linkedin: 'https://linkedin.com/in/yashwanth-krishna',
      repositories,
      customAnswer: 'I am passionate about software development and have experience building various projects including web applications, AI tools, and automation systems. My GitHub repositories showcase my skills in different technologies and my commitment to continuous learning.'
    })

    // Show a brief success message
    console.log('✅ Test data filled successfully!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const supabase = getBrowserClient()
      
      let resumeUrl = ''
      
      // Upload PDF to Supabase Storage if provided
      if (formData.resume) {
        const uploadStartTime = Date.now()
        const fileExt = formData.resume.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `resumes/${fileName}`
        
        console.log('🔄 Step 1: Uploading PDF to Supabase Storage...', {
          fileName,
          fileSize: formData.resume.size,
          fileType: formData.resume.type,
          timestamp: new Date().toISOString()
        })
        
        // Direct upload with timeout (removed connectivity test that was hanging)
        console.log('📤 Starting file upload directly...')
        const uploadPromise = supabase.storage
          .from('application-files')
          .upload(filePath, formData.resume!, {
            cacheControl: '3600',
            upsert: false
          })
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout after 15 seconds - please try a smaller file or check your internet connection')), 15000)
        )
        
        const { data: uploadData, error: uploadError } = await Promise.race([
          uploadPromise,
          timeoutPromise
        ]) as any
        
        if (uploadError) {
          console.error('❌ PDF upload error:', uploadError)
          throw new Error(`Failed to upload resume: ${uploadError.message}`)
        }
        
        console.log('✅ Upload completed! Getting public URL...')
        
        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('application-files')
          .getPublicUrl(filePath)
        
        resumeUrl = urlData.publicUrl
        console.log('🎉 PDF uploaded successfully:', {
          url: resumeUrl,
          duration: `${Date.now() - uploadStartTime} ms`,
          size: `${(formData.resume.size / 1024 / 1024).toFixed(2)} MB`
        })
      }
      
      // Create comprehensive job description combining all sections
      const fullJobDescription = jobData ? [
        'About the Role',
        jobData.description,
        '',
        'Requirements',
        ...jobData.requirements,
        '',
        'Benefits',
        ...jobData.benefits,
        '',
        'Key Technologies',
        ...jobData.skills,
        '',
        `About ${jobData.company.name}`,
        `Industry: ${jobData.company.industry}`,
        `Company Size: ${jobData.company.size}`
      ].join('\n') : ''
      
      // Prepare application data for the applicants table
      const applicationData = {
        job_name: config?.jobTitle || job?.toString().replace(/-/g, ' ') || '',
        company_name: config?.companyName || company?.toString().replace(/-/g, ' ') || '',
        job_description: fullJobDescription,
        full_name: formData.fullName,
        email_address: formData.email,
        resume_cv_url: resumeUrl,
        github_profile: formData.githubProfile,
        repository_1_url: formData.repositories[0] || '',
        repository_2_url: formData.repositories[1] || null,
        repository_3_url: formData.repositories[2] || null,
        linkedin_url: formData.linkedin || null,
        ai_evaluation_status: 'started'
      }
      
      console.log('💾 Step 2: Saving application to database...', {
        jobName: applicationData.job_name,
        companyName: applicationData.company_name,
        applicantEmail: applicationData.email_address
      })

      // Insert application data into the applicants table
      const { data, error } = await supabase
        .from('applicants')
        .insert([applicationData])
        .select()
      
      if (error) {
        console.error('❌ Error saving application:', error)
        throw new Error(error.message)
      }
      
      const applicationId = data[0]?.id
      console.log('✅ Application saved to database!', { applicationId })
      
      // Show success message
      alert(`🎉 Application submitted successfully for ${config?.jobTitle || 'the position'} at ${config?.companyName || 'the company'}! Application ID: ${applicationId}`)
      
      // Start AI Analysis if PDF and repositories are provided
      if (formData.resume && formData.githubProfile && formData.repositories.some(repo => repo.trim())) {
        // Don't reset form yet - keep it visible for AI analysis progress
        
        // Start AI analysis immediately
        startAIAnalysis(applicationId, formData.resume!, formData.repositories, resumeUrl)
          .catch(error => {
            console.error('AI Analysis failed:', error)
            // Error is already handled in startAIAnalysis function
          })
        
      } else {
        // No AI analysis possible, reset form
      setFormData({
        fullName: '',
        email: '',
        resume: null,
        githubProfile: '',
        linkedin: '',
        repositories: Array(config?.numberOfRepos || 3).fill(''),
        customAnswer: ''
      })
        
        // Update status to not_started since no analysis will happen
        await updateApplicationStatus(applicationId, 'not_started')
      }
      
    } catch (error) {
      console.error('Application submission error:', error)
      alert('❌ Failed to submit application. Please try again. Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enhanced form validation
  const isFormValid = config ? (
    (!config.requireName || formData.fullName.trim()) &&
    (!config.requireEmail || (formData.email.trim() && formData.email.includes('@'))) &&
    (!config.requireResume || (formData.resume && formData.resume.type === 'application/pdf')) &&
    (!config.requireGithubProfile || (formData.githubProfile.trim() && formData.githubProfile.includes('github.com/'))) &&
    (!config.requireLinkedin || (formData.linkedin.trim() && formData.linkedin.includes('linkedin.com/'))) &&
    (!config.requireTopRepos || formData.repositories.every(repo => !repo.trim() || repo.includes('github.com/'))) &&
    (!config.customQuestion || !config.customQuestionRequired || formData.customAnswer.trim())
  ) : false

  // Check if AI analysis can be performed
  const canPerformAIAnalysis = formData.resume && 
    formData.resume.type === 'application/pdf' && 
    formData.githubProfile.includes('github.com/') && 
    formData.repositories.some(repo => repo.trim() && repo.includes('github.com/'))

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

  // Show AI results if analysis is completed and results are available
  if (aiAnalysisResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <AIResultsDisplay 
            results={aiAnalysisResults} 
            onClose={handleCloseResults}
          />
        </div>
      </div>
    )
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

                {/* Test Data Button */}
                <div className="pt-6">
                  <Button 
                    type="button"
                    onClick={fillTestData}
                    variant="outline"
                    className="w-full h-12 text-base font-semibold border-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-950/20 transition-all duration-200 rounded-xl mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🧪</span>
                      <span>Fill Test Data</span>
                    </div>
                  </Button>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                      <strong>Note:</strong> After clicking "Fill Test Data", you still need to upload the <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">SWE_Resume_Template.pdf</code> file manually using the file upload area above.
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
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
                  
                  {/* AI Analysis Info */}
                  {canPerformAIAnalysis && aiAnalysisProgress.stage === 'idle' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🤖</div>
                        <div>
                          <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                            AI Analysis Ready!
                          </h4>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            Your PDF resume and GitHub repositories will be analyzed by our AI after submission. 
                            This will provide insights on your technical skills, project authenticity, and job match score.
                          </p>
                </div>
                      </div>
                    </div>
                  )}
                  
                  {!canPerformAIAnalysis && formData.resume && aiAnalysisProgress.stage === 'idle' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                          <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                            Limited AI Analysis
                          </h4>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            For full AI analysis, ensure you have: 
                            <br />• A PDF resume file
                            <br />• Valid GitHub profile URL
                            <br />• At least one GitHub repository URL
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Analysis Progress */}
                  {aiAnalysisProgress.stage !== 'idle' && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                          🤖 AI Resume Analysis
                        </h3>
                        {aiAnalysisProgress.stage === 'completed' && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300">
                            Completed
                          </Badge>
                        )}
                        {aiAnalysisProgress.stage === 'error' && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300">
                            Error
                          </Badge>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-2">
                          <span>{aiAnalysisProgress.message}</span>
                          <span>{Math.round(aiAnalysisProgress.progress * 100)}%</span>
                        </div>
                        <div className="w-full bg-blue-100 dark:bg-blue-950/50 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              aiAnalysisProgress.stage === 'error' 
                                ? 'bg-red-500' 
                                : aiAnalysisProgress.stage === 'completed'
                                ? 'bg-green-500'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }`}
                            style={{ width: `${aiAnalysisProgress.progress * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Status Information */}
                      {aiAnalysisProgress.stage === 'starting' && (
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Validating your resume and GitHub profile...</span>
                        </div>
                      )}
                      
                      {aiAnalysisProgress.stage === 'analyzing' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Our AI is analyzing your profile...</span>
                          </div>
                          {aiAnalysisProgress.jobId && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                              Analysis ID: {aiAnalysisProgress.jobId.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      )}
                      
                      {aiAnalysisProgress.stage === 'completed' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <LuCheck className="h-4 w-4" />
                            <span className="text-sm font-medium">Analysis completed successfully!</span>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              ✨ Your application has been analyzed by our AI. The hiring team will review your results along with your application.
                            </p>
                            {aiAnalysisProgress.applicationId && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
                                Application ID: {aiAnalysisProgress.applicationId}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {aiAnalysisProgress.stage === 'error' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <span className="text-lg">⚠️</span>
                            <span className="text-sm font-medium">Analysis failed</span>
                          </div>
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-700 dark:text-red-300">
                              {aiAnalysisProgress.message}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                              Don't worry! Your application was still submitted successfully. The hiring team will review it manually.
                            </p>
                          </div>
                        </div>
                      )}
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