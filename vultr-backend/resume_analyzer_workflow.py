#!/usr/bin/env python3
"""
Resume Analyzer Agentic Workflow using CrewAI and Groq
======================================================

This script demonstrates a multi-agent workflow where specialized AI agents
collaborate to analyze resumes against job descriptions. The workflow includes:

1. Resume Parser Agent - Extracts and structures resume information
2. Job Description Analyzer Agent - Analyzes job requirements and skills
3. Skills Matcher Agent - Matches resume skills with job requirements
4. Scoring Agent - Provides numerical scores and detailed analysis
5. Feedback Agent - Gives actionable recommendations for improvement

The agents work together to provide comprehensive resume analysis and scoring.
"""

import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, LLM

# Load environment variables
load_dotenv()

def analyze_resume(resume_text, job_description):
    """Main function to run the resume analysis workflow."""
    
    print("🚀 Starting Resume Analyzer Agentic Workflow")
    print("=" * 60)
    
    # Initialize Groq LLM with working model format
    print("📡 Initializing Groq LLM...")
    llm = LLM(
        model="groq/llama-3.3-70b-versatile",
        temperature=0.7,
        max_completion_tokens=1024,
    )
    
    # Create specialized agents
    print("🤖 Creating Specialized AI Agents...")
    
    # Resume Parser Agent
    resume_parser = Agent(
        role='Senior Resume Parser & Analyst',
        goal='Extract and structure information from resumes systematically',
        backstory='''You are an expert HR technology specialist with extensive 
        experience in parsing and analyzing resumes. You excel at extracting 
        key information including skills, experience, education, achievements, 
        and identifying strengths and areas for improvement.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Job Description Analyzer Agent
    job_analyzer = Agent(
        role='Job Requirements Specialist',
        goal='Analyze job descriptions and identify key requirements and skills',
        backstory='''You are a seasoned recruitment specialist who excels at 
        analyzing job descriptions to identify core requirements, must-have skills, 
        nice-to-have qualifications, and understanding what employers are truly 
        looking for in candidates.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Skills Matcher Agent
    skills_matcher = Agent(
        role='Skills & Experience Matcher',
        goal='Match resume qualifications with job requirements systematically',
        backstory='''You are an expert in talent matching with deep understanding 
        of how different skills, experiences, and qualifications align with job 
        requirements. You can identify both direct matches and transferable skills.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Scoring Agent
    scoring_agent = Agent(
        role='Resume Scoring Specialist',
        goal='Provide detailed numerical scores and comprehensive analysis',
        backstory='''You are a data-driven HR analytics expert who specializes 
        in creating fair and comprehensive scoring systems for resume evaluation. 
        You provide detailed breakdowns of scores across multiple criteria.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Feedback Agent
    feedback_agent = Agent(
        role='Career Development Advisor',
        goal='Provide actionable feedback and recommendations for improvement',
        backstory='''You are an experienced career coach and advisor who helps 
        professionals improve their resumes and career prospects. You provide 
        specific, actionable recommendations for enhancement.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    print("📋 Creating analysis tasks...")
    
    # Define tasks for the workflow
    resume_parsing_task = Task(
        description=f'''Parse and analyze the following resume comprehensively:

        RESUME:
        {resume_text}
        
        Extract and structure the following information:
        1. Personal information and contact details
        2. Professional summary/objective
        3. Work experience (roles, companies, duration, achievements)
        4. Education (degrees, institutions, dates)
        5. Technical skills and competencies
        6. Certifications and additional qualifications
        7. Notable achievements and accomplishments
        8. Overall resume quality and presentation
        
        Provide a structured analysis of strengths and areas needing improvement.''',
        expected_output='''A comprehensive resume analysis with:
        - Structured extraction of all key information
        - Skills inventory categorized by type
        - Experience summary with key achievements
        - Education and certification details
        - Resume quality assessment
        - Initial strengths and improvement areas''',
        agent=resume_parser
    )
    
    job_analysis_task = Task(
        description=f'''Analyze the following job description thoroughly:

        JOB DESCRIPTION:
        {job_description}
        
        Identify and categorize:
        1. Job title and seniority level
        2. Must-have requirements (critical skills, experience, education)
        3. Nice-to-have qualifications (preferred but not essential)
        4. Technical skills required
        5. Soft skills and competencies needed
        6. Years of experience required
        7. Industry or domain knowledge needed
        8. Key responsibilities and expectations
        
        Prioritize requirements by importance (critical, important, nice-to-have).''',
        expected_output='''A detailed job requirements analysis with:
        - Job overview and seniority level
        - Categorized requirements (must-have vs nice-to-have)
        - Technical skills breakdown
        - Experience requirements
        - Soft skills and competencies
        - Prioritized requirement list''',
        agent=job_analyzer
    )
    
    skills_matching_task = Task(
        description='''Compare the parsed resume against the analyzed job requirements.
        
        Perform detailed matching analysis:
        1. Direct skill matches (exact or very similar skills)
        2. Transferable skills (related or applicable skills)
        3. Experience level alignment
        4. Education and certification matches
        5. Industry experience relevance
        6. Gap analysis (missing critical requirements)
        7. Strength analysis (areas where candidate exceeds requirements)
        8. Overall qualification level assessment
        
        Provide specific examples and evidence for each match or gap.''',
        expected_output='''A comprehensive matching analysis with:
        - Direct skill matches with evidence
        - Transferable skills identification
        - Experience alignment assessment
        - Education/certification matches
        - Detailed gap analysis
        - Candidate strengths vs job requirements
        - Overall qualification summary''',
        agent=skills_matcher,
        dependencies=[resume_parsing_task, job_analysis_task]
    )
    
    scoring_task = Task(
        description='''Based on the resume analysis and job matching, provide detailed numerical scores.
        
        Score the following categories (0-100 scale):
        1. Technical Skills Match (40% weight)
        2. Experience Relevance (25% weight)
        3. Education & Certifications (15% weight)
        4. Soft Skills & Competencies (10% weight)
        5. Resume Quality & Presentation (10% weight)
        
        Provide:
        - Individual category scores with justification
        - Weighted overall score
        - Percentile ranking (beginner/intermediate/advanced/expert)
        - Confidence level in the assessment
        - Key factors influencing the score''',
        expected_output='''A detailed scoring report with:
        - Individual category scores (0-100) with explanations
        - Weighted overall score calculation
        - Percentile ranking and confidence level
        - Score justification and key factors
        - Comparison to typical candidates for this role''',
        agent=scoring_agent,
        dependencies=[skills_matching_task]
    )
    
    feedback_task = Task(
        description='''Provide comprehensive, actionable feedback for resume improvement.
        
        Generate specific recommendations:
        1. Critical gaps to address (must-fix items)
        2. Skills to develop or highlight better
        3. Experience sections to strengthen
        4. Resume formatting and presentation improvements
        5. Keyword optimization suggestions
        6. Additional qualifications to pursue
        7. Interview preparation focus areas
        8. Career development roadmap
        
        Make recommendations specific and actionable with priority levels.''',
        expected_output='''A comprehensive feedback report with:
        - Priority-ranked improvement recommendations
        - Specific actions to address skill gaps
        - Resume formatting and content suggestions
        - Keyword optimization advice
        - Career development recommendations
        - Interview preparation guidance
        - Timeline for improvements''',
        agent=feedback_agent,
        dependencies=[scoring_task]
    )
    
    # Create the crew
    print("👥 Assembling the resume analysis crew...")
    crew = Crew(
        agents=[resume_parser, job_analyzer, skills_matcher, scoring_agent, feedback_agent],
        tasks=[resume_parsing_task, job_analysis_task, skills_matching_task, scoring_task, feedback_task],
        verbose=True,
        process='sequential'
    )
    
    # Execute the workflow
    print("\n🎬 Starting resume analysis execution...")
    print("=" * 60)
    
    try:
        result = crew.kickoff()
        
        print("\n✅ Resume analysis completed successfully!")
        print("=" * 60)
        print("\n📊 Analysis Results:")
        print(result)
        
        # Save results to files
        print("\n💾 Saving analysis results...")
        
        # Create output directory
        os.makedirs('resume_analysis_output', exist_ok=True)
        
        # Save the final result
        with open('resume_analysis_output/resume_analysis_results.txt', 'w') as f:
            f.write("Resume Analysis Results\n")
            f.write("=" * 40 + "\n\n")
            f.write("RESUME ANALYZED:\n")
            f.write("-" * 20 + "\n")
            f.write(resume_text[:500] + "...\n\n")
            f.write("JOB DESCRIPTION:\n")
            f.write("-" * 20 + "\n")
            f.write(job_description[:500] + "...\n\n")
            f.write("ANALYSIS RESULTS:\n")
            f.write("-" * 20 + "\n")
            f.write(str(result))
        
        print("✅ Results saved to 'resume_analysis_output/resume_analysis_results.txt'")
        
        return result
        
    except Exception as e:
        print(f"❌ Error during resume analysis: {str(e)}")
        return None

def run_sample_analysis():
    """Run a sample resume analysis with predefined resume and job description."""
    
    print("🔄 Running Sample Resume Analysis...")
    print("=" * 50)
    
    # Sample resume text
    sample_resume = """
    John Smith
    Software Engineer
    Email: john.smith@email.com | Phone: (555) 123-4567
    LinkedIn: linkedin.com/in/johnsmith | GitHub: github.com/johnsmith

    PROFESSIONAL SUMMARY
    Experienced Full-Stack Developer with 5+ years of experience in web application development. 
    Proficient in JavaScript, Python, React, and Node.js. Strong background in agile development 
    and cloud technologies.

    EXPERIENCE
    Senior Software Engineer | TechCorp Inc. | 2021 - Present
    • Developed and maintained 3 high-traffic web applications serving 100K+ users
    • Led a team of 4 junior developers on React-based frontend projects
    • Implemented CI/CD pipelines reducing deployment time by 60%
    • Collaborated with product managers to define technical requirements

    Software Developer | StartupXYZ | 2019 - 2021
    • Built RESTful APIs using Node.js and Express serving mobile applications
    • Optimized database queries resulting in 40% performance improvement
    • Participated in code reviews and mentored 2 junior developers

    EDUCATION
    Bachelor of Science in Computer Science | State University | 2019
    GPA: 3.7/4.0

    TECHNICAL SKILLS
    • Programming Languages: JavaScript, Python, Java, HTML/CSS
    • Frameworks: React, Node.js, Express, Django
    • Databases: PostgreSQL, MongoDB, Redis
    • Cloud: AWS (EC2, S3, RDS), Docker, Kubernetes
    • Tools: Git, Jenkins, Jira, Slack

    CERTIFICATIONS
    • AWS Certified Developer Associate (2022)
    • Scrum Master Certification (2021)
    """

    # Sample job description
    sample_job_description = """
    Senior Full-Stack Developer
    Company: InnovaTech Solutions
    Location: San Francisco, CA (Remote friendly)

    ABOUT THE ROLE
    We are seeking a Senior Full-Stack Developer to join our growing engineering team. 
    You will be responsible for building scalable web applications and leading technical initiatives.

    REQUIREMENTS
    • 4+ years of experience in full-stack web development
    • Strong proficiency in JavaScript, React, and Node.js
    • Experience with cloud platforms (AWS preferred)
    • Knowledge of database design and optimization
    • Experience with agile development methodologies
    • Strong communication and leadership skills

    PREFERRED QUALIFICATIONS
    • Experience with TypeScript
    • Knowledge of microservices architecture
    • Experience with Docker and container orchestration
    • Previous experience leading development teams
    • Bachelor's degree in Computer Science or related field
    • AWS certifications

    RESPONSIBILITIES
    • Design and develop scalable web applications
    • Lead technical discussions and architectural decisions
    • Mentor junior developers and conduct code reviews
    • Collaborate with cross-functional teams
    • Implement best practices for code quality and testing
    • Participate in technical planning and estimation

    WHAT WE OFFER
    • Competitive salary and equity package
    • Comprehensive health benefits
    • Flexible PTO and remote work options
    • Professional development budget
    • Modern tech stack and tools
    """

    return analyze_resume(sample_resume, sample_job_description)

if __name__ == "__main__":
    # Check if Groq API key is available
    if not os.getenv("GROQ_API_KEY"):
        print("❌ Error: GROQ_API_KEY not found in environment variables")
        print("Please make sure your .env file contains a valid GROQ_API_KEY")
        exit(1)
    
    print("🔑 Groq API Key found!")
    
    # Run the sample analysis
    sample_result = run_sample_analysis()
    
    if sample_result:
        print("\n🎉 Resume analysis workflow completed successfully!")
        print("\nTo analyze your own resume, call:")
        print("analyze_resume(your_resume_text, your_job_description)")
        print("\nCheck the 'resume_analysis_output' directory for saved results.")
    else:
        print("\n⚠️ Resume analysis encountered issues.")
        
    print("\n📋 Available Functions:")
    print("- run_sample_analysis(): Run with predefined sample data")
    print("- analyze_resume(resume_text, job_description): Analyze custom resume") 