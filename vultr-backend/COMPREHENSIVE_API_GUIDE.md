# 🚀 Resume Analyzer API - Complete Usage Guide

## 📋 **Table of Contents**
1. [Quick Start](#quick-start)
2. [API Overview](#api-overview)
3. [Endpoint Reference](#endpoint-reference)
4. [Request/Response Formats](#request-response-formats)
5. [Code Examples](#code-examples)
6. [Integration Guides](#integration-guides)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Production Considerations](#production-considerations)

---

## 🌐 **Live API URLs (HTTPS)**

### **Production API Base URL**
```
https://139.84.210.229.sslip.io
```

### **Interactive Documentation**
- **Swagger UI**: https://139.84.210.229.sslip.io/docs
- **ReDoc**: https://139.84.210.229.sslip.io/redoc
- **Health Check**: https://139.84.210.229.sslip.io/health

---

## 🚀 **Quick Start**

### **Test the API in 30 seconds**

```bash
# 1. Health Check
curl https://139.84.210.229.sslip.io/health

# 2. Start Analysis (replace with your data)
curl -X POST "https://139.84.210.229.sslip.io/analyze-resume-async" \
  -F "pdf_file=@your_resume.pdf" \
  -F "github_profile_url=https://github.com/yourusername" \
  -F "best_project_repos=[\"https://github.com/yourusername/project1\"]" \
  -F "job_description=Software Engineer position" \
  -F "company_name=Tech Corp" \
  -F "job_name=Software Engineer"
```

---

## 📊 **API Overview**

### **Core Features**
- 🤖 **AI-Powered Analysis**: Uses Groq LLM for intelligent resume evaluation
- 🐙 **GitHub Verification**: Validates projects using Firecrawl and GitIngest
- ⚡ **Dual Processing**: Sync and async analysis modes
- 📄 **PDF Processing**: Extracts and analyzes resume content
- 🎯 **Job Matching**: Calculates percentage match with job requirements
- 🔍 **Real-time Tracking**: Monitor analysis progress in real-time

### **Analysis Workflow**
```
PDF Upload → Text Extraction → AI Analysis → GitHub Verification → Matching Score
     ↓              ↓              ↓              ↓               ↓
   50MB Max    Structured     Groq LLM      Firecrawl API    0-100% Score
              Content        Processing    Project Check    + Report
```

---

## 🔗 **Endpoint Reference**

### **1. Health Check**
```http
GET /health
```

**Purpose**: Check API status and dependencies

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-07T17:48:04Z",
  "version": "1.0.0",
  "dependencies": {
    "groq": "Available",
    "firecrawl": "Available", 
    "crewai": "Available",
    "gitingest": "Available"
  }
}
```

---

### **2. Synchronous Analysis**
```http
POST /analyze-resume
```

**Purpose**: Complete resume analysis in one request (60-120 seconds)

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pdf_file` | File | ✅ | PDF resume file (max 50MB) |
| `github_profile_url` | String | ✅ | GitHub profile URL |
| `best_project_repos` | String | ✅ | JSON array of 1-5 repository URLs |
| `job_description` | String | ✅ | Job description text |
| `company_name` | String | ✅ | Company name |
| `job_name` | String | ✅ | Job title |

**Example Request**:
```bash
curl -X POST "https://139.84.210.229.sslip.io/analyze-resume" \
  -F "pdf_file=@resume.pdf" \
  -F "github_profile_url=https://github.com/yashwanth-3000" \
  -F "best_project_repos=[\"https://github.com/yashwanth-3000/project1\",\"https://github.com/yashwanth-3000/project2\"]" \
  -F "job_description=Senior Software Engineer with Python and AI/ML experience" \
  -F "company_name=TechCorp Inc" \
  -F "job_name=Senior Software Engineer"
```

---

### **3. Asynchronous Analysis**
```http
POST /analyze-resume-async
```

**Purpose**: Start analysis job and return immediately with job ID

**Parameters**: Same as synchronous analysis

**Response**:
```json
{
  "success": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Analysis job started successfully",
  "status": "pending",
  "timestamp": "2025-07-07T17:48:04Z"
}
```

---

### **4. Job Status Check**
```http
GET /analysis-status/{job_id}
```

**Purpose**: Check progress and results of async analysis

**Response**:
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 1.0,
  "message": "Analysis completed successfully",
  "results": {
    "matching_score": 82.0,
    "github_verification_triggered": true,
    "results": {
      "resume_analysis": {...},
      "github_verification": {...}
    },
    "analysis_summary": {...},
    "processing_time_seconds": 68.7
  },
  "error": null,
  "created_at": "2025-07-07T17:46:00Z",
  "updated_at": "2025-07-07T17:47:09Z"
}
```

**Status Values**:
- `pending`: Job queued for processing
- `processing`: Analysis in progress 
- `completed`: Analysis finished successfully
- `failed`: Analysis encountered an error

---

### **5. Delete Job**
```http
DELETE /analysis-job/{job_id}
```

**Purpose**: Remove completed job from memory

**Response**:
```json
{
  "success": true,
  "message": "Job deleted successfully"
}
```

---

## 📄 **Request/Response Formats**

### **Complete Analysis Response Structure**

```json
{
  "success": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "matching_score": 82.0,
  "github_verification_triggered": true,
  "results": {
    "resume_analysis": {
      "matching_score": 82.0,
      "pdf_parsing": "Structured resume content including contact info, education, experience...",
      "resume_analysis": "Comprehensive candidate evaluation with strengths and weaknesses...",
      "job_matching": "Detailed breakdown of how candidate skills match job requirements...",
      "github_extraction": "GitHub URLs and repositories found in resume..."
    },
    "github_verification": {
      "triggered": true,
      "specified_repos": 2,
      "verified_repos": 2,
      "invalid_repos": 0,
      "repositories_analyzed": 2,
      "repository_content": [
        {
          "url": "https://github.com/username/project1",
          "content": "Repository content analysis..."
        }
      ],
      "profile_activity": {
        "total_repos": 25,
        "followers": 50,
        "following": 30
      },
      "project_matching": "Analysis of how projects align with resume claims...",
      "authenticity_analysis": "Assessment of project authenticity and ownership...",
      "credibility_scoring": "Overall credibility score: 45/100 - QUESTIONABLE",
      "verification_report": "Comprehensive hiring report with recommendations..."
    }
  },
  "analysis_summary": {
    "matching_score": 82.0,
    "github_profile": "https://github.com/username",
    "specified_repos": 2,
    "verified_repos": 2,
    "invalid_repos": 0,
    "repositories_analyzed": 2,
    "github_verification_triggered": true,
    "processing_time_seconds": 68.7
  },
  "processing_time_seconds": 68.7,
  "timestamp": "2025-07-07T17:47:09Z"
}
```

### **Error Response Format**

```json
{
  "success": false,
  "error": "ValidationError",
  "detail": "Invalid GitHub URL format",
  "timestamp": "2025-07-07T17:48:04Z"
}
```

---

## 💻 **Code Examples**

### **Python Client Example**

```python
import requests
import json
import time

class ResumeAnalyzerClient:
    def __init__(self, base_url="https://139.84.210.229.sslip.io"):
        self.base_url = base_url
    
    def health_check(self):
        """Check API health."""
        response = requests.get(f"{self.base_url}/health")
        return response.json()
    
    def analyze_resume_sync(self, pdf_path, github_profile, project_repos, 
                           job_description, company_name, job_name):
        """Synchronous analysis - blocks until complete."""
        url = f"{self.base_url}/analyze-resume"
        
        files = {"pdf_file": open(pdf_path, "rb")}
        data = {
            "github_profile_url": github_profile,
            "best_project_repos": json.dumps(project_repos),
            "job_description": job_description,
            "company_name": company_name,
            "job_name": job_name
        }
        
        try:
            response = requests.post(url, files=files, data=data, timeout=300)
            response.raise_for_status()
            return response.json()
        finally:
            files["pdf_file"].close()
    
    def analyze_resume_async(self, pdf_path, github_profile, project_repos, 
                            job_description, company_name, job_name):
        """Start asynchronous analysis."""
        url = f"{self.base_url}/analyze-resume-async"
        
        files = {"pdf_file": open(pdf_path, "rb")}
        data = {
            "github_profile_url": github_profile,
            "best_project_repos": json.dumps(project_repos),
            "job_description": job_description,
            "company_name": company_name,
            "job_name": job_name
        }
        
        try:
            response = requests.post(url, files=files, data=data)
            response.raise_for_status()
            return response.json()
        finally:
            files["pdf_file"].close()
    
    def get_job_status(self, job_id):
        """Check job status."""
        url = f"{self.base_url}/analysis-status/{job_id}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    
    def wait_for_completion(self, job_id, max_wait=300, poll_interval=5):
        """Wait for job completion with polling."""
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            status_response = self.get_job_status(job_id)
            status = status_response["status"]
            progress = status_response["progress"]
            
            print(f"Job {job_id}: {status} ({progress*100:.1f}%)")
            
            if status == "completed":
                return status_response["results"]
            elif status == "failed":
                raise Exception(f"Job failed: {status_response['error']}")
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Job did not complete within {max_wait} seconds")
    
    def delete_job(self, job_id):
        """Delete a completed job."""
        url = f"{self.base_url}/analysis-job/{job_id}"
        response = requests.delete(url)
        response.raise_for_status()
        return response.json()

# Usage Example
if __name__ == "__main__":
    client = ResumeAnalyzerClient()
    
    # Check API health
    health = client.health_check()
    print(f"API Status: {health['status']}")
    
    # Start async analysis
    result = client.analyze_resume_async(
        pdf_path="resume.pdf",
        github_profile="https://github.com/yashwanth-3000",
        project_repos=[
            "https://github.com/yashwanth-3000/content--hub",
            "https://github.com/yashwanth-3000/Dev-Docs-Local"
        ],
        job_description="Senior Software Engineer with Python, AI/ML, and full-stack experience",
        company_name="TechCorp Inc",
        job_name="Senior Software Engineer"
    )
    
    job_id = result["job_id"]
    print(f"Analysis started: {job_id}")
    
    # Wait for completion
    try:
        final_results = client.wait_for_completion(job_id)
        print(f"✅ Analysis completed!")
        print(f"📊 Matching Score: {final_results['matching_score']}%")
        print(f"🐙 GitHub Verified: {final_results['github_verification_triggered']}")
        print(f"⏱️ Processing Time: {final_results['processing_time_seconds']:.1f}s")
        
        # Clean up
        client.delete_job(job_id)
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
```

### **JavaScript/Node.js Example**

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class ResumeAnalyzerClient {
    constructor(baseUrl = 'https://139.84.210.229.sslip.io') {
        this.baseUrl = baseUrl;
    }

    async healthCheck() {
        const response = await axios.get(`${this.baseUrl}/health`);
        return response.data;
    }

    async analyzeResumeAsync(pdfPath, githubProfile, projectRepos, 
                            jobDescription, companyName, jobName) {
        const form = new FormData();
        form.append('pdf_file', fs.createReadStream(pdfPath));
        form.append('github_profile_url', githubProfile);
        form.append('best_project_repos', JSON.stringify(projectRepos));
        form.append('job_description', jobDescription);
        form.append('company_name', companyName);
        form.append('job_name', jobName);

        const response = await axios.post(
            `${this.baseUrl}/analyze-resume-async`,
            form,
            { 
                headers: form.getHeaders(),
                timeout: 30000 // 30 second timeout for upload
            }
        );

        return response.data;
    }

    async getJobStatus(jobId) {
        const response = await axios.get(`${this.baseUrl}/analysis-status/${jobId}`);
        return response.data;
    }

    async waitForCompletion(jobId, maxWait = 300000, pollInterval = 5000) {
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            const statusResponse = await this.getJobStatus(jobId);
            const { status, progress } = statusResponse;

            console.log(`Job ${jobId}: ${status} (${(progress * 100).toFixed(1)}%)`);

            if (status === 'completed') {
                return statusResponse.results;
            } else if (status === 'failed') {
                throw new Error(`Job failed: ${statusResponse.error}`);
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error(`Job did not complete within ${maxWait}ms`);
    }

    async deleteJob(jobId) {
        const response = await axios.delete(`${this.baseUrl}/analysis-job/${jobId}`);
        return response.data;
    }
}

// Usage Example
async function analyzeResume() {
    const client = new ResumeAnalyzerClient();

    try {
        // Check API health
        const health = await client.healthCheck();
        console.log(`API Status: ${health.status}`);

        // Start analysis
        const result = await client.analyzeResumeAsync(
            'resume.pdf',
            'https://github.com/yashwanth-3000',
            [
                'https://github.com/yashwanth-3000/content--hub',
                'https://github.com/yashwanth-3000/Dev-Docs-Local'
            ],
            'Senior Software Engineer with Python, AI/ML, and full-stack experience',
            'TechCorp Inc',
            'Senior Software Engineer'
        );

        console.log(`Analysis started: ${result.job_id}`);

        // Wait for completion
        const finalResults = await client.waitForCompletion(result.job_id);
        
        console.log('✅ Analysis completed!');
        console.log(`📊 Matching Score: ${finalResults.matching_score}%`);
        console.log(`🐙 GitHub Verified: ${finalResults.github_verification_triggered}`);
        console.log(`⏱️ Processing Time: ${finalResults.processing_time_seconds.toFixed(1)}s`);

        // Clean up
        await client.deleteJob(result.job_id);

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    }
}

analyzeResume();
```

### **Frontend Integration (React/Next.js)**

```jsx
import { useState } from 'react';

const ResumeAnalyzer = () => {
    const [file, setFile] = useState(null);
    const [jobId, setJobId] = useState(null);
    const [status, setStatus] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://139.84.210.229.sslip.io';

    const analyzeResume = async (formData) => {
        setLoading(true);
        try {
            // Start analysis
            const response = await fetch(`${API_URL}/analyze-resume-async`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setJobId(result.job_id);
            setStatus(result.status);

            // Poll for results
            pollJobStatus(result.job_id);

        } catch (error) {
            console.error('Analysis failed:', error);
            setStatus('failed');
            setLoading(false);
        }
    };

    const pollJobStatus = async (jobId) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/analysis-status/${jobId}`);
                const statusData = await response.json();

                setStatus(statusData.status);

                if (statusData.status === 'completed') {
                    setResults(statusData.results);
                    setLoading(false);
                    clearInterval(pollInterval);
                } else if (statusData.status === 'failed') {
                    setLoading(false);
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Status check failed:', error);
                clearInterval(pollInterval);
                setLoading(false);
            }
        }, 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('pdf_file', file);
        formData.append('github_profile_url', 'https://github.com/yashwanth-3000');
        formData.append('best_project_repos', JSON.stringify([
            'https://github.com/yashwanth-3000/content--hub'
        ]));
        formData.append('job_description', 'Software Engineer position');
        formData.append('company_name', 'Tech Corp');
        formData.append('job_name', 'Software Engineer');

        await analyzeResume(formData);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Resume Analyzer</h1>
            
            <form onSubmit={handleSubmit} className="mb-6">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="mb-4"
                    required
                />
                <button
                    type="submit"
                    disabled={!file || loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    {loading ? 'Analyzing...' : 'Analyze Resume'}
                </button>
            </form>

            {jobId && (
                <div className="mb-4">
                    <p><strong>Job ID:</strong> {jobId}</p>
                    <p><strong>Status:</strong> {status}</p>
                </div>
            )}

            {results && (
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="text-xl font-semibold mb-2">Analysis Results</h2>
                    <p><strong>Matching Score:</strong> {results.matching_score}%</p>
                    <p><strong>GitHub Verified:</strong> {results.github_verification_triggered ? '✅' : '❌'}</p>
                    <p><strong>Processing Time:</strong> {results.processing_time_seconds?.toFixed(1)}s</p>
                </div>
            )}
        </div>
    );
};

export default ResumeAnalyzer;
```

---

## 🔌 **Integration Guides**

### **Vercel Deployment Integration**

1. **Environment Variables** (in Vercel dashboard):
```
NEXT_PUBLIC_API_URL=https://139.84.210.229.sslip.io
```

2. **API Route Example** (`pages/api/analyze.js`):
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const formData = new FormData();
    // Add form data from req.body
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analyze-resume-async`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
}
```

### **Webhook Integration**

For advanced use cases, you can implement webhook notifications:

```javascript
// Pseudo-code for webhook endpoint
app.post('/webhook/analysis-complete', (req, res) => {
  const { job_id, status, results } = req.body;
  
  if (status === 'completed') {
    // Handle completed analysis
    processResults(results);
    notifyUser(job_id, results);
  }
  
  res.status(200).json({ received: true });
});
```

---

## 🚨 **Error Handling**

### **HTTP Status Codes**

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Job ID not found |
| 422 | Validation Error | Data validation failed |
| 500 | Server Error | Internal processing error |

### **Common Errors and Solutions**

1. **PDF Upload Failed**
```json
{
  "success": false,
  "error": "ValidationError",
  "detail": "File must be a PDF"
}
```
**Solution**: Ensure file is a valid PDF under 50MB

2. **Invalid GitHub URL**
```json
{
  "success": false,
  "error": "ValidationError", 
  "detail": "Invalid GitHub URL format"
}
```
**Solution**: Use format `https://github.com/username`

3. **Repository Mismatch**
```json
{
  "success": false,
  "error": "ValidationError",
  "detail": "Repository owner must match GitHub profile username"
}
```
**Solution**: Ensure all repositories belong to the specified GitHub user

4. **Job Not Found**
```json
{
  "success": false,
  "error": "NotFound",
  "detail": "Job not found"
}
```
**Solution**: Job may have expired or been deleted

### **Error Handling Example**

```python
try:
    result = client.analyze_resume_async(...)
    job_id = result["job_id"]
    final_results = client.wait_for_completion(job_id)
    
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 422:
        print("Validation error:", e.response.json()["detail"])
    elif e.response.status_code == 500:
        print("Server error - try again later")
    else:
        print(f"HTTP error: {e.response.status_code}")
        
except TimeoutError:
    print("Analysis timed out - check job status manually")
    
except Exception as e:
    print(f"Unexpected error: {e}")
```

---

## 🎯 **Best Practices**

### **1. File Upload Optimization**
- **PDF Size**: Keep under 10MB for faster processing
- **Quality**: Ensure text is selectable (not scanned images)
- **Format**: Standard PDF format works best

### **2. GitHub Repository Selection**
- **Relevance**: Choose repositories most relevant to the job
- **Quality**: Include well-documented projects
- **Ownership**: Only include repositories you own
- **Limit**: Use 2-3 repositories for optimal analysis time

### **3. Job Description Guidelines**
- **Detail**: Provide comprehensive job requirements
- **Keywords**: Include relevant technical skills
- **Length**: 100-500 words for best results

### **4. Async vs Sync Usage**
- **Async**: Use for web applications and better UX
- **Sync**: Use for scripts and batch processing
- **Timeout**: Always implement timeout handling

### **5. Error Resilience**
```python
import time
import random

def analyze_with_retry(client, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.analyze_resume_async(...)
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            
            # Exponential backoff
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait_time)
```

### **6. Resource Management**
```python
# Always clean up jobs when done
try:
    results = client.wait_for_completion(job_id)
    # Process results
finally:
    client.delete_job(job_id)  # Free server memory
```

---

## 🏭 **Production Considerations**

### **Rate Limiting**
- Current limit: No enforced limits
- Recommended: Implement client-side throttling
- Analysis time: 60-120 seconds per request

### **Caching**
- Cache results by resume hash + job description hash
- Typical cache TTL: 24 hours
- Cache invalidation: When GitHub repositories change

### **Monitoring**
```javascript
// Monitor API health
async function healthCheck() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const health = await response.json();
        
        if (health.status !== 'healthy') {
            alerting.notify('API unhealthy', health);
        }
    } catch (error) {
        alerting.notify('API unreachable', error);
    }
}

setInterval(healthCheck, 60000); // Check every minute
```

### **Scaling Considerations**
- **Current capacity**: ~10 concurrent analyses
- **Bottlenecks**: AI API rate limits (Groq, Firecrawl)
- **Scaling options**: Multiple API instances, job queuing

### **Security**
- **HTTPS**: Always use HTTPS in production ✅
- **API Keys**: Secure your API keys
- **CORS**: Configure allowed origins for production
- **File validation**: PDF-only uploads enforced

---

## 📞 **Support & Resources**

### **API Information**
- **Base URL**: https://139.84.210.229.sslip.io
- **Documentation**: https://139.84.210.229.sslip.io/docs
- **Health Check**: https://139.84.210.229.sslip.io/health
- **Response Time**: ~200ms (status checks), 60-120s (analysis)

### **Infrastructure**
- **Provider**: Vultr Cloud (Bangalore)
- **Specs**: 2 vCPU, 4GB RAM, 80GB SSD
- **SSL**: Let's Encrypt (auto-renewal)
- **Uptime**: 99.9% target

### **Cost Information**
- **API Usage**: Free (for now)
- **Server Cost**: $12/month
- **Rate Limits**: None currently enforced

---

## 🎉 **You're Ready to Go!**

This API is production-ready and perfect for:
- ✅ **Recruitment platforms**
- ✅ **HR management systems** 
- ✅ **Job matching services**
- ✅ **Portfolio analysis tools**
- ✅ **Candidate screening automation**

Start building amazing recruitment tools with AI-powered resume analysis! 🚀 