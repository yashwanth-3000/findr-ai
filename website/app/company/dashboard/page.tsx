'use client'

import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { AuthChecker } from '@/components/auth/auth-checker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BriefcaseBusiness, 
  Users, 
  TrendingUp, 
  Star, 
  Plus, 
  BarChart3,
  MessageSquare,
  Download,
  Clock,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/page-container'

// Mock data for demonstration
const mockMetrics = {
  totalJobs: 5,
  totalApplications: 142,
  averageScore: 7.3,
  topPerformers: 12,
  pendingReviews: 8
}

const mockJobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    applications: 34,
    averageScore: 8.1,
    topCandidates: 5,
    status: "active",
    postedDays: 3
  },
  {
    id: 2,
    title: "Backend Engineer",
    applications: 28,
    averageScore: 7.5,
    topCandidates: 3,
    status: "active",
    postedDays: 7
  },
  {
    id: 3,
    title: "DevOps Engineer",
    applications: 19,
    averageScore: 6.9,
    topCandidates: 2,
    status: "paused",
    postedDays: 12
  }
]

const mockRecentApplications = [
  {
    id: 1,
    name: "Alex Chen",
    position: "Senior Frontend Developer",
    score: 9.2,
    skills: ["React", "TypeScript", "Node.js"],
    githubProjects: 15,
    linkedinExperience: "5 years",
    status: "shortlisted"
  },
  {
    id: 2,
    name: "Sarah Kim",
    position: "Backend Engineer",
    score: 8.7,
    skills: ["Python", "Django", "PostgreSQL"],
    githubProjects: 12,
    linkedinExperience: "4 years",
    status: "pending"
  },
  {
    id: 3,
    name: "Marcus Johnson",
    position: "DevOps Engineer",
    score: 8.1,
    skills: ["AWS", "Docker", "Kubernetes"],
    githubProjects: 8,
    linkedinExperience: "6 years",
    status: "pending"
  }
]

function CompanyDashboardContent() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <PageContainer>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Hiring Dashboard</h1>
              <p className="text-muted-foreground">AI-powered candidate screening and insights</p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/company/jobs/new">
                <Plus className="h-4 w-4" />
                Post New Job
              </Link>
            </Button>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.totalJobs}</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.totalApplications}</div>
                <p className="text-xs text-muted-foreground">+23% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average AI Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.averageScore}/10</div>
                <p className="text-xs text-muted-foreground">+0.3 from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.topPerformers}</div>
                <p className="text-xs text-muted-foreground">Score ≥ 8.5</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMetrics.pendingReviews}</div>
                <p className="text-xs text-muted-foreground">Flagged by AI</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job Listings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Your Job Listings</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/company/jobs">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>{job.applications} applications • Avg score: {job.averageScore}</div>
                        <div>{job.topCandidates} top candidates • Posted {job.postedDays}d ago</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/company/jobs/${job.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Recent Applications</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ask AI
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRecentApplications.map((application) => (
                  <div key={application.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{application.name}</h3>
                        <p className="text-sm text-muted-foreground">{application.position}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{application.score}</div>
                        <Badge variant={application.status === 'shortlisted' ? 'default' : 'secondary'}>
                          {application.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Skills: {application.skills.join(', ')}</div>
                      <div>{application.githubProjects} GitHub projects • {application.linkedinExperience} experience</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Trending Skills</h4>
                  <p className="text-sm text-blue-700">React and TypeScript are the most common skills among your top candidates.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Quality Increase</h4>
                  <p className="text-sm text-green-700">Average candidate score increased by 15% compared to last month.</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">Action Needed</h4>
                  <p className="text-sm text-orange-700">8 borderline candidates need human review for final decision.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </PageContainer>
    </div>
  )
}

export default function CompanyDashboardPage() {
  return (
    <AuthChecker>
      <CompanyDashboardContent />
    </AuthChecker>
  )
} 