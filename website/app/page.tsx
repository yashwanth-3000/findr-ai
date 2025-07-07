import Link from "next/link";
import { Metadata } from "next";

import { CustomHero } from "@/components/custom-hero";
import { Navbar } from "@/components/navbar";
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
      title: "findr-ai | Hire Better with AI-Powered Candidate Screening",
  description: "Replace hiring spreadsheets with AI. Post jobs, get AI-scored candidates from resumes, LinkedIn, and GitHub. Smart shortlisting, live metrics, and batch processing.",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="animate-fadeIn">
          <CustomHero />
        </section>
      </main>
    </div>
  );
} 