#!/usr/bin/env python3
"""
FastAPI Application for PDF Multi-Crew Resume Analyzer
=====================================================

This FastAPI application provides REST endpoints for the PDF resume analysis workflow:

ENDPOINTS:
- POST /analyze-resume: Main endpoint for complete resume analysis
- POST /analyze-resume-async: Async version with job tracking
- GET /analysis-status/{job_id}: Check status of async analysis
- GET /health: Health check endpoint

FEATURES:
- File upload handling for PDF resumes
- Structured request/response models
- Error handling and validation
- Async processing support
- CORS enabled for web frontends
"""

import os
import uuid
import json
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, validator
import tempfile
import shutil

# Import the existing analyzer
from pdf_multi_crew_resume_analyzer import (
    PDFResumeProcessor,
    FirecrawlGitHubExtractor,
    GitHubContentExtractor,
    create_resume_analysis_crew,
    create_github_verification_crew,
    Colors
)

# Initialize FastAPI app
app = FastAPI(
    title="PDF Multi-Crew Resume Analyzer API",
    description="AI-powered resume analysis with GitHub verification using CrewAI and Groq",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for async job tracking (use Redis/database in production)
job_storage: Dict[str, Dict] = {}

# Request/Response Models
class AnalysisRequest(BaseModel):
    """Request model for resume analysis."""
    github_profile_url: HttpUrl
    best_project_repos: List[HttpUrl]
    job_description: str
    company_name: str
    job_name: str
    
    @validator('best_project_repos')
    def validate_repo_count(cls, v):
        if len(v) < 1 or len(v) > 5:
            raise ValueError('Must provide 1-5 repository URLs')
        return v

class AnalysisResponse(BaseModel):
    """Response model for resume analysis results."""
    success: bool
    job_id: str
    matching_score: float
    github_verification_triggered: bool
    results: Dict[str, Any]
    analysis_summary: Dict[str, Any]
    processing_time_seconds: float
    timestamp: datetime

class AsyncAnalysisResponse(BaseModel):
    """Response model for async analysis initiation."""
    success: bool
    job_id: str
    message: str
    status: str
    timestamp: datetime

class JobStatusResponse(BaseModel):
    """Response model for job status check."""
    job_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: float  # 0.0 to 1.0
    message: str
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    timestamp: datetime
    version: str
    dependencies: Dict[str, str]

# Utility Functions
def create_job_id() -> str:
    """Generate a unique job ID."""
    return str(uuid.uuid4())

def update_job_status(job_id: str, status: str, progress: float = 0.0, 
                     message: str = "", results: Dict = None, error: str = None):
    """Update job status in storage."""
    if job_id in job_storage:
        job_storage[job_id].update({
            'status': status,
            'progress': progress,
            'message': message,
            'results': results,
            'error': error,
            'updated_at': datetime.now()
        })

async def save_uploaded_file(upload_file: UploadFile) -> str:
    """Save uploaded file to temporary location and return path."""
    try:
        # Create temporary file
        suffix = Path(upload_file.filename).suffix if upload_file.filename else '.pdf'
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        
        # Copy uploaded file content
        shutil.copyfileobj(upload_file.file, temp_file)
        temp_file.close()
        
        return temp_file.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

def cleanup_temp_file(file_path: str):
    """Clean up temporary file."""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
    except Exception as e:
        print(f"Warning: Failed to cleanup temp file {file_path}: {e}")

async def run_analysis_workflow(
    resume_pdf_path: str,
    github_profile_url: str,
    best_project_repos: List[str],
    job_description: str,
    job_id: str = None
) -> Dict[str, Any]:
    """Run the complete analysis workflow."""
    start_time = datetime.now()
    
    try:
        if job_id:
            update_job_status(job_id, "processing", 0.1, "Initializing processors...")
        
        # Initialize processors
        pdf_processor = PDFResumeProcessor()
        github_extractor = FirecrawlGitHubExtractor()
        github_content_extractor = GitHubContentExtractor()
        
        if job_id:
            update_job_status(job_id, "processing", 0.2, "Extracting text from PDF...")
        
        # Extract text from PDF
        resume_text = pdf_processor.extract_text_from_pdf(resume_pdf_path)
        if not resume_text:
            raise ValueError("Failed to extract text from PDF")
        
        if job_id:
            update_job_status(job_id, "processing", 0.3, "Verifying repository ownership...")
        
        # Verify repository ownership
        username = github_profile_url.split('/')[-1]
        verified_repos = []
        invalid_repos = []
        
        for repo_url in best_project_repos:
            repo_parts = repo_url.replace('https://github.com/', '').split('/')
            if len(repo_parts) >= 2:
                repo_owner = repo_parts[0]
                if repo_owner == username:
                    verified_repos.append(repo_url)
                else:
                    invalid_repos.append(repo_url)
            else:
                invalid_repos.append(repo_url)
        
        if job_id:
            update_job_status(job_id, "processing", 0.4, "Running resume analysis crew...")
        
        # Run resume analysis crew
        resume_crew, resume_tasks = create_resume_analysis_crew(
            resume_text, job_description, [github_profile_url]
        )
        pdf_parsing_task, resume_analysis_task, job_matching_task, github_extraction_task = resume_tasks
        
        resume_results = resume_crew.kickoff()
        
        # Extract matching score
        import re
        job_matching_result = job_matching_task.output.raw
        score_match = re.search(r'(\d+(?:\.\d+)?)%', job_matching_result)
        matching_score = float(score_match.group(1)) if score_match else 0
        
        github_verification_triggered = matching_score > 65
        
        if github_verification_triggered:
            if job_id:
                update_job_status(job_id, "processing", 0.6, "Running GitHub verification...")
            
            # Analyze GitHub profile and repositories
            if verified_repos:
                # Analyze profile
                profile_data = github_extractor.get_profile_activity_data(username)
                
                if job_id:
                    update_job_status(job_id, "processing", 0.7, "Analyzing repositories with Gitingest...")
                
                # Analyze repositories
                repo_content_data = []
                for repo_url in verified_repos:
                    content_data = github_content_extractor.extract_repository_content(repo_url)
                    repo_content_data.append(content_data)
                
                combined_data = {
                    "profile_activity": profile_data,
                    "content": repo_content_data,
                    "repository_count": len(verified_repos),
                    "specified_repos": len(best_project_repos),
                    "verified_repos": len(verified_repos),
                    "invalid_repos": len(invalid_repos)
                }
            else:
                # Only profile analysis
                profile_data = github_extractor.get_profile_activity_data(username)
                combined_data = {
                    "profile_activity": profile_data,
                    "content": [],
                    "repository_count": 0,
                    "specified_repos": len(best_project_repos),
                    "verified_repos": 0,
                    "invalid_repos": len(invalid_repos),
                    "reason": "No verified repositories provided"
                }
            
            if job_id:
                update_job_status(job_id, "processing", 0.8, "Running GitHub verification crew...")
            
            # Run GitHub verification crew
            if combined_data["repository_count"] > 0 or combined_data.get("profile_activity"):
                github_crew, github_tasks = create_github_verification_crew(
                    combined_data, matching_score, resume_text
                )
                project_matching_task, authenticity_analysis_task, credibility_scoring_task, verification_report_task = github_tasks
                
                github_results = github_crew.kickoff()
            else:
                # Create dummy outputs
                class DummyTask:
                    def __init__(self, message):
                        self.output = type('obj', (object,), {'raw': message})
                
                project_matching_task = DummyTask("No repositories or profile data to analyze")
                authenticity_analysis_task = DummyTask("No repositories or profile data to analyze")
                credibility_scoring_task = DummyTask("No repositories or profile data to analyze")
                verification_report_task = DummyTask("No repositories or profile data to analyze")
            
            final_results = {
                "resume_analysis": {
                    "matching_score": matching_score,
                    "pdf_parsing": pdf_parsing_task.output.raw,
                    "resume_analysis": resume_analysis_task.output.raw,
                    "job_matching": job_matching_task.output.raw,
                    "github_extraction": github_extraction_task.output.raw
                },
                "github_verification": {
                    "triggered": True,
                    "specified_repos": combined_data.get("specified_repos", 0),
                    "verified_repos": combined_data.get("verified_repos", 0),
                    "invalid_repos": combined_data.get("invalid_repos", 0),
                    "repositories_analyzed": combined_data["repository_count"],
                    "repository_content": combined_data["content"],
                    "profile_activity": combined_data.get("profile_activity", {}),
                    "project_matching": project_matching_task.output.raw,
                    "authenticity_analysis": authenticity_analysis_task.output.raw,
                    "credibility_scoring": credibility_scoring_task.output.raw,
                    "verification_report": verification_report_task.output.raw
                }
            }
        else:
            final_results = {
                "resume_analysis": {
                    "matching_score": matching_score,
                    "pdf_parsing": pdf_parsing_task.output.raw,
                    "resume_analysis": resume_analysis_task.output.raw,
                    "job_matching": job_matching_task.output.raw,
                    "github_extraction": github_extraction_task.output.raw
                },
                "github_verification": {
                    "triggered": False,
                    "reason": f"Matching score {matching_score}% below threshold of 65%"
                }
            }
        
        if job_id:
            update_job_status(job_id, "processing", 0.9, "Finalizing results...")
        
        # Create analysis summary
        analysis_summary = {
            "matching_score": matching_score,
            "github_profile": github_profile_url,
            "specified_repos": len(best_project_repos),
            "verified_repos": len(verified_repos),
            "invalid_repos": len(invalid_repos),
            "repositories_analyzed": len(verified_repos) if github_verification_triggered else 0,
            "github_verification_triggered": github_verification_triggered,
            "processing_time_seconds": (datetime.now() - start_time).total_seconds()
        }
        
        result = {
            "matching_score": matching_score,
            "github_verification_triggered": github_verification_triggered,
            "results": final_results,
            "analysis_summary": analysis_summary,
            "processing_time_seconds": (datetime.now() - start_time).total_seconds()
        }
        
        if job_id:
            update_job_status(job_id, "completed", 1.0, "Analysis completed successfully", result)
        
        return result
        
    except Exception as e:
        error_message = f"Analysis failed: {str(e)}"
        if job_id:
            update_job_status(job_id, "failed", 0.0, error_message, error=error_message)
        raise e

# API Endpoints
@app.post("/analyze-resume", response_model=AnalysisResponse)
async def analyze_resume(
    pdf_file: UploadFile = File(..., description="PDF resume file"),
    github_profile_url: str = Form(..., description="GitHub profile URL"),
    best_project_repos: str = Form(..., description="JSON array of best project repository URLs"),
    job_description: str = Form(..., description="Job description to match against"),
    company_name: str = Form(..., description="Company name for the job position"),
    job_name: str = Form(..., description="Job title/position name")
):
    """
    Analyze a PDF resume with GitHub verification.
    
    This endpoint performs complete resume analysis including:
    - PDF text extraction
    - Resume-job matching with scoring
    - GitHub profile analysis (if score > 65%)
    - Repository content analysis using Gitingest
    - Authenticity verification and credibility scoring
    """
    job_id = create_job_id()
    temp_file_path = None
    
    try:
        # Validate file type
        if not pdf_file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Parse repository URLs
        try:
            repos_list = json.loads(best_project_repos)
            if not isinstance(repos_list, list) or len(repos_list) < 1 or len(repos_list) > 5:
                raise ValueError("Must provide 1-5 repository URLs")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format for repository URLs")
        
        # Save uploaded file
        temp_file_path = await save_uploaded_file(pdf_file)
        
        # Run analysis
        start_time = datetime.now()
        result = await run_analysis_workflow(
            temp_file_path,
            github_profile_url,
            repos_list,
            job_description
        )
        
        return AnalysisResponse(
            success=True,
            job_id=job_id,
            matching_score=result["matching_score"],
            github_verification_triggered=result["github_verification_triggered"],
            results=result["results"],
            analysis_summary=result["analysis_summary"],
            processing_time_seconds=result["processing_time_seconds"],
            timestamp=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Cleanup temp file
        if temp_file_path:
            cleanup_temp_file(temp_file_path)

@app.post("/analyze-resume-async", response_model=AsyncAnalysisResponse)
async def analyze_resume_async(
    background_tasks: BackgroundTasks,
    pdf_file: UploadFile = File(..., description="PDF resume file"),
    github_profile_url: str = Form(..., description="GitHub profile URL"),
    best_project_repos: str = Form(..., description="JSON array of best project repository URLs"),
    job_description: str = Form(..., description="Job description to match against"),
    company_name: str = Form(..., description="Company name for the job position"),
    job_name: str = Form(..., description="Job title/position name")
):
    """
    Start an asynchronous resume analysis job.
    
    Returns immediately with a job ID that can be used to check status and retrieve results.
    """
    job_id = create_job_id()
    
    try:
        # Validate file type
        if not pdf_file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Parse repository URLs
        try:
            repos_list = json.loads(best_project_repos)
            if not isinstance(repos_list, list) or len(repos_list) < 1 or len(repos_list) > 5:
                raise ValueError("Must provide 1-5 repository URLs")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format for repository URLs")
        
        # Save uploaded file
        temp_file_path = await save_uploaded_file(pdf_file)
        
        # Initialize job in storage
        job_storage[job_id] = {
            'job_id': job_id,
            'status': 'pending',
            'progress': 0.0,
            'message': 'Job queued for processing',
            'results': None,
            'error': None,
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'temp_file_path': temp_file_path
        }
        
        # Start background task
        async def background_analysis():
            try:
                await run_analysis_workflow(
                    temp_file_path,
                    github_profile_url,
                    repos_list,
                    job_description,
                    job_id
                )
            except Exception as e:
                update_job_status(job_id, "failed", 0.0, f"Analysis failed: {str(e)}", error=str(e))
            finally:
                cleanup_temp_file(temp_file_path)
        
        background_tasks.add_task(background_analysis)
        
        return AsyncAnalysisResponse(
            success=True,
            job_id=job_id,
            message="Analysis job started successfully",
            status="pending",
            timestamp=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Cleanup on error
        if 'temp_file_path' in locals():
            cleanup_temp_file(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to start analysis: {str(e)}")

@app.get("/analysis-status/{job_id}", response_model=JobStatusResponse)
async def get_analysis_status(job_id: str):
    """
    Get the status of an asynchronous analysis job.
    
    Returns job status, progress, and results if completed.
    """
    if job_id not in job_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job_data = job_storage[job_id]
    
    return JobStatusResponse(
        job_id=job_id,
        status=job_data['status'],
        progress=job_data['progress'],
        message=job_data['message'],
        results=job_data['results'],
        error=job_data['error'],
        created_at=job_data['created_at'],
        updated_at=job_data['updated_at']
    )

@app.delete("/analysis-job/{job_id}")
async def delete_analysis_job(job_id: str):
    """
    Delete an analysis job from storage.
    
    Use this to cleanup completed jobs to free memory.
    """
    if job_id not in job_storage:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Cleanup temp file if exists
    job_data = job_storage[job_id]
    if 'temp_file_path' in job_data:
        cleanup_temp_file(job_data['temp_file_path'])
    
    del job_storage[job_id]
    
    return {"message": f"Job {job_id} deleted successfully"}

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint to verify API status and dependencies.
    """
    dependencies = {
        "groq": "Available" if os.getenv("GROQ_API_KEY") else "Missing API Key",
        "firecrawl": "Available" if os.getenv("FIRECRAWL_API_KEY") else "Missing API Key",
        "crewai": "Available",
        "gitingest": "Available"
    }
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        dependencies=dependencies
    )

@app.get("/")
async def root():
    """
    Root endpoint with API information.
    """
    return {
        "name": "PDF Multi-Crew Resume Analyzer API",
        "version": "1.0.0",
        "description": "AI-powered resume analysis with GitHub verification",
        "docs_url": "/docs",
        "health_url": "/health",
        "endpoints": {
            "analyze_resume": "/analyze-resume",
            "analyze_resume_async": "/analyze-resume-async",
            "analysis_status": "/analysis-status/{job_id}",
            "delete_job": "/analysis-job/{job_id}"
        }
    }

# Error Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler for unhandled errors.
    """
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 