"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BriefcaseBusiness, BarChart3, Users, Brain } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Container } from "@/components/layout/container";

export function CustomHero() {
  const { user } = useAuth();

  // Generate CTA buttons based on auth status
  const renderCtaButtons = () => {
    if (!user) {
      return (
        <div className="flex gap-4">
          <Button size="lg" variant="default" asChild>
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/sign-in">Get Started</Link>
          </Button>
        </div>
      );
    }
    
      return (
        <div className="flex gap-4">
          <Button size="lg" variant="default" className="gap-2" asChild>
            <Link href="/company/jobs/new">
              <BriefcaseBusiness className="h-5 w-5" />
              Post a Job
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2" asChild>
          <Link href="/company/dashboard">
            <BarChart3 className="h-5 w-5" />
            View Dashboard
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full bg-background text-foreground">
      <Container>
        {/* Top Hero Section */}
        <div className="flex flex-col items-center justify-center gap-6 py-20 text-center lg:py-32">
          <h1 className="text-5xl font-bold tracking-tighter md:text-7xl">
            ai-powered hiring. <span className="text-destructive">zero spreadsheets.</span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            post jobs, get ai-scored candidates, and hire top talent. our ai reviews resumes, linkedin profiles, and github projects automatically.
          </p>
          {renderCtaButtons()}
        </div>

        {/* How it Works Section */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-12">how it works</h2>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-semibold">post your job</h3>
              <p className="text-muted-foreground">
                create a job posting with requirements. get a branded public link to share with candidates.
              </p>
                <Button variant="outline" size="sm" className="gap-2">
                <BriefcaseBusiness className="h-4 w-4" /> Create Job
                </Button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-semibold">ai scores candidates</h3>
              <p className="text-muted-foreground">
                candidates apply with resumes, linkedin, and github. our ai reviews everything and assigns fit scores.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4" />
                <span>powered by ai</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-semibold">hire the best</h3>
              <p className="text-muted-foreground">
                review ai-generated insights, shortlisted candidates, and hire with confidence.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>live metrics</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight">everything you need to hire better</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              replace your hiring spreadsheets with ai-powered insights and automation.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <Brain className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">ai resume analysis</h3>
              <p className="text-muted-foreground">
                automatically extract skills, experience, and match candidates to job requirements with ai-powered scoring.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <Users className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">linkedin integration</h3>
              <p className="text-muted-foreground">
                pull verified work history and connections from linkedin profiles to validate candidate experience.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <BriefcaseBusiness className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">github code review</h3>
              <p className="text-muted-foreground">
                assess coding quality, project complexity, and technical skills from github repositories automatically.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <BarChart3 className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">live dashboard</h3>
              <p className="text-muted-foreground">
                track applications, average scores, and hiring metrics in real-time with actionable insights.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <Users className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">smart shortlisting</h3>
              <p className="text-muted-foreground">
                automatically identify top performers and flag borderline candidates for human review.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-card-foreground">
              <BriefcaseBusiness className="h-8 w-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">batch processing</h3>
              <p className="text-muted-foreground">
                approve or reject candidates in batches, export to excel, or query results with our chatbot.
              </p>
            </div>
          </div>
        </div>
        
        {/* Benefits Section */}
        <div className="py-16 text-center">
            <h2 className="text-4xl font-bold tracking-tight">why companies choose our platform</h2>
            <p className="mt-4 mb-12 text-lg text-muted-foreground">
              hire faster, smarter, and with less bias
            </p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col items-center gap-2">
                    <h4 className="text-xl font-semibold">10x faster screening</h4>
                    <p className="text-sm text-muted-foreground">ai reviews hundreds of candidates instantly</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h4 className="text-xl font-semibold">reduced bias</h4>
                    <p className="text-sm text-muted-foreground">skill-based matching over resume formatting</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h4 className="text-xl font-semibold">better quality hires</h4>
                    <p className="text-sm text-muted-foreground">validated skills from real projects</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <h4 className="text-xl font-semibold">lower cost per hire</h4>
                    <p className="text-sm text-muted-foreground">eliminate manual screening overhead</p>
                </div>
            </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <div className="rounded-lg bg-primary text-primary-foreground p-8">
            <h2 className="text-3xl font-bold mb-4">ready to hire smarter?</h2>
            <p className="text-lg mb-6 opacity-90">
              join companies using ai to find the best talent faster
          </p>
          {renderCtaButtons()}
        </div>
            </div>
      </Container>
    </div>
  );
} 