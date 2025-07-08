'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  LuCheck, 
  LuX, 
  LuStar, 
  LuUser, 
  LuMail, 
  LuGraduationCap, 
  LuBriefcase, 
  LuCode, 
  LuGithub, 
  LuActivity, 
  LuInfo, 
  LuFileText, 
  LuLinkedin, 
  LuMapPin, 
  LuCalendar, 
  LuAward,
  LuChevronDown,
  LuChevronRight,
  LuExternalLink,
  LuClock
} from 'react-icons/lu'
import { useState } from 'react'

interface AIResults {
  results: {
    resume_analysis: {
      pdf_parsing: string
      job_matching: string
      matching_score: number
      resume_analysis: string
      github_extraction: string
    }
    github_verification: {
      triggered: boolean
      invalid_repos: number
      verified_repos: number
      specified_repos: number
      profile_activity?: {
        error?: string
      }
      project_matching: string
      repository_content: Array<{
        url: string
        type: string
        error?: string
        content: string | null
        summary: string | null
        file_tree: string | null
        content_size: number
        extraction_status: string
      }>
      credibility_scoring: string
      verification_report: string
      authenticity_analysis: string
      repositories_analyzed: number
    }
    matching_score: number
    analysis_summary: {
      invalid_repos: number
      github_profile: string
      matching_score: number
      verified_repos: number
      specified_repos: number
      repositories_analyzed: number
      processing_time_seconds: number
      github_verification_triggered: boolean
    }
    processing_time_seconds: number
    github_verification_triggered: boolean
  }
}

export default function AIResultsDisplay({ 
  results, 
  onClose 
}: { 
  results: AIResults
  onClose: () => void 
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    breakdown: false,
    resumeAnalysis: false,
    githubVerification: false,
    processingSummary: false
  })

  if (!results || !results.results) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-medium">No AI analysis results available</div>
          <div className="text-sm text-muted-foreground mt-2">
            The analysis may still be in progress or failed to complete.
          </div>
        </div>
      </div>
    )
  }

  // Access the results data
  const analysisResults = results.results

  const toggleSection = (sectionId: string) => {
    const newExpanded = { ...expandedSections }
    newExpanded[sectionId] = !newExpanded[sectionId]
    setExpandedSections(newExpanded)
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400'
    if (score >= 70) return 'text-blue-600 dark:text-blue-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 85) return 'default'
    if (score >= 70) return 'secondary'
    if (score >= 50) return 'outline'
    return 'destructive'
  }

  const getMatchingScore = () => {
    const score = analysisResults.resume_analysis?.matching_score
    if (typeof score === 'number') return score
    if (typeof score === 'string') {
      const parsed = parseInt(score, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const matchingScore = getMatchingScore()

  const parseContactInfo = (pdfParsing: string) => {
    const lines = pdfParsing.split('\n')
    const contactSection = lines.find(line => line.includes('**Contact Information**'))
    if (!contactSection) return null

    const startIndex = lines.indexOf(contactSection)
    const endIndex = lines.findIndex((line, index) => 
      index > startIndex && line.startsWith('**') && !line.includes('Contact Information')
    )
    
    const contactLines = lines.slice(startIndex + 1, endIndex > -1 ? endIndex : startIndex + 10)
    return contactLines.filter(line => line.trim() && !line.startsWith('**'))
  }

  const parseEducation = (pdfParsing: string) => {
    const lines = pdfParsing.split('\n')
    const educationSection = lines.find(line => line.includes('**Education**'))
    if (!educationSection) return null

    const startIndex = lines.indexOf(educationSection)
    const endIndex = lines.findIndex((line, index) => 
      index > startIndex && line.startsWith('**') && !line.includes('Education')
    )
    
    const educationLines = lines.slice(startIndex + 1, endIndex > -1 ? endIndex : startIndex + 15)
    return educationLines.filter(line => line.trim() && !line.startsWith('**'))
  }

  const parseProjects = (pdfParsing: string) => {
    const lines = pdfParsing.split('\n')
    const projectsSection = lines.find(line => line.includes('**Projects**'))
    if (!projectsSection) return []

    const startIndex = lines.indexOf(projectsSection)
    const endIndex = lines.findIndex((line, index) => 
      index > startIndex && line.startsWith('**') && !line.includes('Projects')
    )
    
    const projectLines = lines.slice(startIndex + 1, endIndex > -1 ? endIndex : lines.length)
    const projects: Array<{ name: string; details: string[] }> = []
    let currentProject: { name: string; details: string[] } | null = null

    for (const line of projectLines) {
      if (line.trim().match(/^\d+\./)) {
        if (currentProject) projects.push(currentProject)
        currentProject = { name: line.trim(), details: [] }
      } else if (currentProject && line.trim()) {
        currentProject.details.push(line.trim())
      }
    }
    if (currentProject) projects.push(currentProject)
    
    return projects
  }

  const parseJobMatchingBreakdown = (jobMatching: string) => {
    const breakdown = {
      technical_skills: 0,
      experience_level: 0,
      industry_experience: 0,
      education_requirements: 0,
      additional_qualifications: 0
    }

    // Extract detailed breakdown from job_matching text
    const technicalMatch = jobMatching.match(/Technical skills match.*?(\d+)\/(\d+)/)
    const experienceMatch = jobMatching.match(/Experience level match.*?(\d+)\/(\d+)/)
    const industryMatch = jobMatching.match(/Industry\/domain experience.*?(\d+)\/(\d+)/)
    const educationMatch = jobMatching.match(/Education requirements.*?(\d+)\/(\d+)/)
    const additionalMatch = jobMatching.match(/Additional qualifications.*?(\d+)\/(\d+)/)

    if (technicalMatch) breakdown.technical_skills = parseInt(technicalMatch[1])
    if (experienceMatch) breakdown.experience_level = parseInt(experienceMatch[1])
    if (industryMatch) breakdown.industry_experience = parseInt(industryMatch[1])
    if (educationMatch) breakdown.education_requirements = parseInt(educationMatch[1])
    if (additionalMatch) breakdown.additional_qualifications = parseInt(additionalMatch[1])

    return breakdown
  }

  const parseStrengthsAndGaps = (jobMatching: string) => {
    const strengthsMatch = jobMatching.match(/\*\*Specific Strengths:\*\*([\s\S]*?)\*\*Specific Gaps:\*\*/)
    const gapsMatch = jobMatching.match(/\*\*Specific Gaps:\*\*([\s\S]*?)\*\*Hiring Recommendation:\*\*/)
    
    const strengths = strengthsMatch ? strengthsMatch[1].split('*').filter(s => s.trim()).map(s => s.trim()) : []
    const gaps = gapsMatch ? gapsMatch[1].split('*').filter(g => g.trim()).map(g => g.trim()) : []
    
    return { strengths, gaps }
  }

  const parseHiringRecommendation = (jobMatching: string) => {
    const recommendationMatch = jobMatching.match(/\*\*Hiring Recommendation:\*\*([\s\S]*)$/)
    return recommendationMatch ? recommendationMatch[1].trim() : ''
  }

  const parseWorkExperience = (pdfParsing: string) => {
    const lines = pdfParsing.split('\n')
    const workSection = lines.find(line => line.includes('**Work Experience**'))
    if (!workSection) return []

    const startIndex = lines.indexOf(workSection)
    const endIndex = lines.findIndex((line, index) => 
      index > startIndex && line.startsWith('**') && !line.includes('Work Experience')
    )
    
    const workLines = lines.slice(startIndex + 1, endIndex > -1 ? endIndex : startIndex + 20)
    const experiences: Array<{ title: string; details: string[] }> = []
    let currentExp: { title: string; details: string[] } | null = null

    for (const line of workLines) {
      if (line.trim().startsWith('- **') && line.includes('**')) {
        if (currentExp) experiences.push(currentExp)
        currentExp = { title: line.trim().replace(/^- \*\*/, '').replace(/\*\*$/, ''), details: [] }
      } else if (currentExp && line.trim()) {
        currentExp.details.push(line.trim())
      }
    }
    if (currentExp) experiences.push(currentExp)
    
    return experiences
  }

  const parseTechnicalSkills = (pdfParsing: string) => {
    const lines = pdfParsing.split('\n')
    const skillsSection = lines.find(line => line.includes('**Technical Skills'))
    if (!skillsSection) return []

    const startIndex = lines.indexOf(skillsSection)
    const endIndex = lines.findIndex((line, index) => 
      index > startIndex && line.startsWith('**') && !line.includes('Technical Skills')
    )
    
    const skillLines = lines.slice(startIndex + 1, endIndex > -1 ? endIndex : startIndex + 10)
    return skillLines.filter(line => line.trim() && line.startsWith('-')).map(line => line.trim().replace(/^- /, ''))
  }

  const getCredibilityScore = (credibilityText: string) => {
    const scoreMatch = credibilityText.match(/(\d+) out of (\d+)/)
    return scoreMatch ? { score: parseInt(scoreMatch[1]), total: parseInt(scoreMatch[2]) } : null
  }

  const contactInfo = parseContactInfo(analysisResults.resume_analysis.pdf_parsing)
  const education = parseEducation(analysisResults.resume_analysis.pdf_parsing)
  const projects = parseProjects(analysisResults.resume_analysis.pdf_parsing)
  const workExperience = parseWorkExperience(analysisResults.resume_analysis.pdf_parsing)
  const technicalSkills = parseTechnicalSkills(analysisResults.resume_analysis.pdf_parsing)
  const jobMatchingBreakdown = parseJobMatchingBreakdown(analysisResults.resume_analysis.job_matching)
  const strengthsAndGaps = parseStrengthsAndGaps(analysisResults.resume_analysis.job_matching)
  const hiringRecommendation = parseHiringRecommendation(analysisResults.resume_analysis.job_matching)
  const credibilityScore = analysisResults.github_verification?.credibility_scoring ? 
    getCredibilityScore(analysisResults.github_verification.credibility_scoring) : null

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Close Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          <LuX className="h-4 w-4 mr-2" />
          Close Results
        </Button>
      </div>

      {/* Overall Match Score - Enhanced */}
      <Card className="shadow-2xl border-2 border-gradient-to-r from-emerald-200 to-blue-200 dark:from-emerald-800 dark:to-blue-800">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/50 dark:to-blue-950/50">
          <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-white">
            AI Hiring Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Overall Match Score</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Comprehensive evaluation across 5 key areas
              </p>
            </div>
            <div className="text-right">
              <div className={`text-6xl font-bold ${getScoreColor(matchingScore)}`}>
                {matchingScore || 'N/A'}%
              </div>
              <Badge variant={getScoreBadgeVariant(matchingScore)} className="mt-2 text-lg px-4 py-1">
                {matchingScore >= 85 ? 'Excellent Match' : 
                 matchingScore >= 70 ? 'Good Match' : 
                 matchingScore >= 50 ? 'Moderate Match' : 'Weak Match'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Score Breakdown - NEW */}
      <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('breakdown')}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
              <LuActivity className="h-5 w-5 text-emerald-600" />
              Detailed Score Breakdown
            </CardTitle>
            {expandedSections.breakdown ? 
              <LuChevronDown className="h-5 w-5 text-slate-400" /> : 
              <LuChevronRight className="h-5 w-5 text-slate-400" />
            }
          </div>
        </CardHeader>
        {expandedSections.breakdown && (
          <CardContent className="space-y-6">


            {/* Strengths and Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
                  <LuCheck className="h-4 w-4" />
                  Key Strengths
                </h4>
                <ul className="space-y-2">
                  {strengthsAndGaps.strengths.slice(0, 5).map((strength, index) => (
                    <li key={index} className="text-sm text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
                      <LuStar className="h-3 w-3 mt-1 text-emerald-600" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                  <LuInfo className="h-4 w-4" />
                  Areas for Growth
                </h4>
                <ul className="space-y-2">
                  {strengthsAndGaps.gaps.slice(0, 5).map((gap, index) => (
                    <li key={index} className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                      <LuActivity className="h-3 w-3 mt-1 text-amber-600" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Hiring Recommendation */}
            {hiringRecommendation && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Hiring Recommendation</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {hiringRecommendation}
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Resume Analysis Section - Enhanced */}
      <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('resumeAnalysis')}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
              <LuFileText className="h-5 w-5 text-red-600" />
              Comprehensive Resume Analysis
            </CardTitle>
            {expandedSections.resumeAnalysis ? 
              <LuChevronDown className="h-5 w-5 text-slate-400" /> : 
              <LuChevronRight className="h-5 w-5 text-slate-400" />
            }
          </div>
        </CardHeader>
        {expandedSections.resumeAnalysis && (
          <CardContent className="space-y-6">
            {/* Contact Information */}
            {contactInfo && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-3">
                  <LuUser className="h-4 w-4" />
                  Contact Information
                </h4>
                <div className="space-y-1">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="text-sm text-blue-800 dark:text-blue-200">{info}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {workExperience.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2 mb-3">
                  <LuBriefcase className="h-4 w-4" />
                  Work Experience
                </h4>
                <div className="space-y-4">
                  {workExperience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <h5 className="font-medium text-green-900 dark:text-green-100">{exp.title}</h5>
                      <div className="space-y-1 mt-2">
                        {exp.details.slice(0, 8).map((detail, detailIndex) => (
                          <div key={detailIndex} className="text-sm text-green-800 dark:text-green-200">
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Skills */}
            {technicalSkills.length > 0 && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-3">
                  <LuCode className="h-4 w-4" />
                  Technical Skills & Competencies
                </h4>
                <div className="space-y-2">
                  {technicalSkills.map((skill, index) => (
                    <div key={index} className="text-sm text-purple-800 dark:text-purple-200">
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2 mb-3">
                  <LuGraduationCap className="h-4 w-4" />
                  Education Background
                </h4>
                <div className="space-y-1">
                  {education.map((edu, index) => (
                    <div key={index} className="text-sm text-orange-800 dark:text-orange-200">{edu}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects Showcase */}
            {projects.length > 0 && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2 mb-3">
                  <LuAward className="h-4 w-4" />
                  Notable Projects & Achievements
                </h4>
                <div className="space-y-4">
                  {projects.slice(0, 4).map((project, index) => (
                    <div key={index} className="border-l-4 border-indigo-500 pl-4">
                      <h5 className="font-medium text-indigo-900 dark:text-indigo-100">{project.name}</h5>
                      <div className="space-y-1 mt-2">
                        {project.details.slice(0, 6).map((detail, detailIndex) => (
                          <div key={detailIndex} className="text-sm text-indigo-800 dark:text-indigo-200">
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Resume Analysis */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">AI Career Assessment</h4>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm leading-relaxed">
                  {analysisResults.resume_analysis.resume_analysis}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* GitHub Verification Section - Completely Enhanced */}
      <Card className="shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('githubVerification')}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
              <LuGithub className="h-5 w-5 text-purple-600" />
              GitHub Verification & Authenticity Analysis
            </CardTitle>
            {expandedSections.githubVerification ? 
              <LuChevronDown className="h-5 w-5 text-slate-400" /> : 
              <LuChevronRight className="h-5 w-5 text-slate-400" />
            }
          </div>
        </CardHeader>
        {expandedSections.githubVerification && (
          <CardContent className="space-y-6">
            {/* GitHub Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analysisResults.github_verification.verified_repos}
                </div>
                <div className="text-xs text-green-700 dark:text-green-300">Verified Repos</div>
              </div>

              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analysisResults.github_verification.specified_repos}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">Total Analyzed</div>
              </div>

              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analysisResults.github_verification.invalid_repos}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300">Invalid Repos</div>
              </div>
            </div>

            {/* GitHub Profile */}
            {analysisResults.analysis_summary?.github_profile && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <LuExternalLink className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-white">GitHub Profile:</span>
                  <a 
                    href={analysisResults.analysis_summary.github_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {analysisResults.analysis_summary.github_profile}
                  </a>
                </div>
              </div>
            )}

            {/* Credibility Assessment */}
            {credibilityScore && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <LuActivity className="h-4 w-4" />
                  GitHub Credibility Assessment
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800 dark:text-blue-200">Overall Credibility Score</span>
                    <Badge variant={credibilityScore.score >= 70 ? 'default' : credibilityScore.score >= 50 ? 'secondary' : 'destructive'}>
                      {credibilityScore.score}/{credibilityScore.total}
                    </Badge>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-blue-800 dark:text-blue-200 text-sm whitespace-pre-line">
                      {analysisResults.github_verification?.credibility_scoring ? 
                        analysisResults.github_verification.credibility_scoring.split('\n').slice(0, 8).join('\n') :
                        'Credibility scoring not available'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Repository Analysis */}
            {analysisResults.github_verification?.repository_content && analysisResults.github_verification.repository_content.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-950/20 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <LuCode className="h-4 w-4" />
                  Repository Analysis Results
                </h4>
                <div className="space-y-3">
                  {analysisResults.github_verification.repository_content.map((repo, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <a 
                          href={repo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <LuGithub className="h-3 w-3" />
                          {repo.url.split('/').pop()}
                        </a>
                        <Badge variant={repo.extraction_status === 'success' ? 'default' : 'destructive'}>
                          {repo.extraction_status}
                        </Badge>
                      </div>
                      {repo.error && (
                        <p className="text-xs text-red-600 dark:text-red-400">Error: {repo.error}</p>
                      )}
                      {repo.summary && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">{repo.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Matching Analysis */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <LuFileText className="h-4 w-4" />
                Project Matching Analysis
              </h4>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-amber-800 dark:text-amber-200 text-sm whitespace-pre-line">
                  {analysisResults.github_verification?.project_matching ? 
                    analysisResults.github_verification.project_matching.split('\n').slice(0, 20).join('\n') + 
                    (analysisResults.github_verification.project_matching.split('\n').length > 20 ? '...' : '') :
                    'Project matching analysis not available'
                  }
                </p>
              </div>
            </div>

            {/* Verification Report */}
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                <LuInfo className="h-4 w-4" />
                Comprehensive Verification Report
              </h4>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="text-red-800 dark:text-red-200 text-sm whitespace-pre-line leading-relaxed">
                  {analysisResults.github_verification?.verification_report ? 
                    analysisResults.github_verification.verification_report.split('\n').slice(0, 30).join('\n') + 
                    (analysisResults.github_verification.verification_report.split('\n').length > 30 ? '...' : '') :
                    'Verification report not available'
                  }
                </div>
              </div>
            </div>

            {/* Authenticity Analysis */}
            <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
              <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-3 flex items-center gap-2">
                <LuActivity className="h-4 w-4" />
                Authenticity Analysis
              </h4>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-violet-800 dark:text-violet-200 text-sm whitespace-pre-line leading-relaxed">
                  {analysisResults.github_verification?.authenticity_analysis ? 
                    analysisResults.github_verification.authenticity_analysis.split('\n').slice(0, 25).join('\n') + 
                    (analysisResults.github_verification.authenticity_analysis.split('\n').length > 25 ? '...' : '') :
                    'Authenticity analysis not available'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>



      {/* Call to Action */}
      <div className="text-center space-y-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
          Analysis Complete ✅
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Our AI has performed a comprehensive evaluation of the candidate's profile, resume, and GitHub repositories. 
          The detailed analysis above provides actionable insights for hiring decisions.
        </p>
        <Button 
          onClick={onClose} 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-2"
        >
          Return to Application Review
        </Button>
      </div>
    </div>
  )
} 