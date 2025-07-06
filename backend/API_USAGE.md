# PDF Multi-Crew Resume Analyzer API Usage Guide

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
pip install -r requirements_api.txt

# Set up environment variables in .env file
GROQ_API_KEY=your_groq_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### 2. Start the API Server

```bash
# Option 1: Using the startup script
python start_api.py

# Option 2: Direct uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Option 3: Using Python module
python -m uvicorn main:app --reload
```

### 3. Access API Documentation

- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📡 API Endpoints

### 1. Synchronous Analysis

**POST** `/analyze-resume`

Performs complete resume analysis synchronously.

**Request Parameters:**
- `pdf_file` (file): PDF resume file
- `github_profile_url` (string): GitHub profile URL
- `best_project_repos` (string): JSON array of repository URLs
- `job_description` (string): Job description text

**Example:**
```bash
curl -X POST "http://localhost:8000/analyze-resume" \
  -F "pdf_file=@resume.pdf" \
  -F "github_profile_url=https://github.com/username" \
  -F "best_project_repos=[\"https://github.com/username/project1\", \"https://github.com/username/project2\"]" \
  -F "job_description=Senior Software Engineer position requiring Python, React..."
```

### 2. Asynchronous Analysis

**POST** `/analyze-resume-async`

Starts asynchronous analysis and returns job ID.

**Response:**
```json
{
  "success": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Analysis job started successfully",
  "status": "pending",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Check Job Status

**GET** `/analysis-status/{job_id}`

Check the status of an asynchronous job.

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 1.0,
  "message": "Analysis completed successfully",
  "results": {...},
  "error": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:32:45Z"
}
```

**Job Status Values:**
- `pending`: Job queued for processing
- `processing`: Job currently running
- `completed`: Job finished successfully
- `failed`: Job encountered an error

### 4. Delete Job

**DELETE** `/analysis-job/{job_id}`

Delete a job from storage to free memory.

### 5. Health Check

**GET** `/health`

Check API health and dependency status.

## 🐍 Python Client Example

```python
import requests
import json
import time

class ResumeAnalyzerClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    def analyze_resume_sync(self, pdf_path, github_profile, project_repos, job_description):
        """Synchronous analysis."""
        url = f"{self.base_url}/analyze-resume"
        
        files = {"pdf_file": open(pdf_path, "rb")}
        data = {
            "github_profile_url": github_profile,
            "best_project_repos": json.dumps(project_repos),
            "job_description": job_description
        }
        
        response = requests.post(url, files=files, data=data)
        files["pdf_file"].close()
        
        return response.json()
    
    def analyze_resume_async(self, pdf_path, github_profile, project_repos, job_description):
        """Start asynchronous analysis."""
        url = f"{self.base_url}/analyze-resume-async"
        
        files = {"pdf_file": open(pdf_path, "rb")}
        data = {
            "github_profile_url": github_profile,
            "best_project_repos": json.dumps(project_repos),
            "job_description": job_description
        }
        
        response = requests.post(url, files=files, data=data)
        files["pdf_file"].close()
        
        return response.json()
    
    def get_job_status(self, job_id):
        """Check job status."""
        url = f"{self.base_url}/analysis-status/{job_id}"
        response = requests.get(url)
        return response.json()
    
    def wait_for_completion(self, job_id, max_wait=300, poll_interval=5):
        """Wait for job completion with polling."""
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            status_response = self.get_job_status(job_id)
            status = status_response["status"]
            
            print(f"Job {job_id}: {status} ({status_response['progress']*100:.1f}%)")
            
            if status == "completed":
                return status_response["results"]
            elif status == "failed":
                raise Exception(f"Job failed: {status_response['error']}")
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Job {job_id} did not complete within {max_wait} seconds")

# Usage Example
client = ResumeAnalyzerClient()

# Async analysis
result = client.analyze_resume_async(
    pdf_path="resume.pdf",
    github_profile="https://github.com/yashwanth-3000",
    project_repos=[
        "https://github.com/yashwanth-3000/content--hub",
        "https://github.com/yashwanth-3000/Dev-Docs-Local"
    ],
    job_description="Senior Software Engineer position..."
)

job_id = result["job_id"]
print(f"Job started: {job_id}")

# Wait for completion
try:
    final_results = client.wait_for_completion(job_id)
    print(f"Analysis completed! Score: {final_results['matching_score']}%")
except Exception as e:
    print(f"Analysis failed: {e}")
```

## 🌐 JavaScript/Node.js Client Example

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

class ResumeAnalyzerClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async analyzeResumeAsync(pdfPath, githubProfile, projectRepos, jobDescription) {
        const form = new FormData();
        form.append('pdf_file', fs.createReadStream(pdfPath));
        form.append('github_profile_url', githubProfile);
        form.append('best_project_repos', JSON.stringify(projectRepos));
        form.append('job_description', jobDescription);

        const response = await axios.post(
            `${this.baseUrl}/analyze-resume-async`,
            form,
            { headers: form.getHeaders() }
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
            const status = statusResponse.status;

            console.log(`Job ${jobId}: ${status} (${(statusResponse.progress * 100).toFixed(1)}%)`);

            if (status === 'completed') {
                return statusResponse.results;
            } else if (status === 'failed') {
                throw new Error(`Job failed: ${statusResponse.error}`);
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error(`Job ${jobId} did not complete within ${maxWait}ms`);
    }
}

// Usage
async function main() {
    const client = new ResumeAnalyzerClient();

    try {
        const result = await client.analyzeResumeAsync(
            'resume.pdf',
            'https://github.com/yashwanth-3000',
            [
                'https://github.com/yashwanth-3000/content--hub',
                'https://github.com/yashwanth-3000/Dev-Docs-Local'
            ],
            'Senior Software Engineer position...'
        );

        console.log(`Job started: ${result.job_id}`);

        const finalResults = await client.waitForCompletion(result.job_id);
        console.log(`Analysis completed! Score: ${finalResults.matching_score}%`);

    } catch (error) {
        console.error('Analysis failed:', error.message);
    }
}

main();
```

## 📝 Response Format

### Analysis Response Structure

```json
{
  "success": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "matching_score": 72.0,
  "github_verification_triggered": true,
  "results": {
    "resume_analysis": {
      "matching_score": 72.0,
      "pdf_parsing": "...",
      "resume_analysis": "...",
      "job_matching": "...",
      "github_extraction": "..."
    },
    "github_verification": {
      "triggered": true,
      "specified_repos": 3,
      "verified_repos": 3,
      "invalid_repos": 0,
      "repositories_analyzed": 3,
      "repository_content": [...],
      "profile_activity": {...},
      "project_matching": "...",
      "authenticity_analysis": "...",
      "credibility_scoring": "...",
      "verification_report": "..."
    }
  },
  "analysis_summary": {
    "matching_score": 72.0,
    "github_profile": "https://github.com/yashwanth-3000",
    "specified_repos": 3,
    "verified_repos": 3,
    "invalid_repos": 0,
    "repositories_analyzed": 3,
    "github_verification_triggered": true,
    "processing_time_seconds": 45.6
  },
  "processing_time_seconds": 45.6,
  "timestamp": "2024-01-15T10:32:45Z"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key (required) | - |
| `FIRECRAWL_API_KEY` | Firecrawl API key (required) | - |
| `API_HOST` | Server host | `0.0.0.0` |
| `API_PORT` | Server port | `8000` |
| `API_RELOAD` | Enable auto-reload | `true` |
| `API_LOG_LEVEL` | Log level | `info` |

### Production Deployment

For production deployment, consider:

1. **Use a production ASGI server** (Gunicorn with Uvicorn workers)
2. **Set up a reverse proxy** (Nginx)
3. **Use a proper database** for job storage (PostgreSQL)
4. **Set up Redis** for caching and job queues
5. **Configure proper CORS** origins
6. **Set up monitoring** and logging
7. **Use environment variables** for all configuration

Example production startup:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 🚨 Error Handling

The API returns standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found (job not found)
- `422`: Unprocessable Entity (data validation errors)
- `500`: Internal Server Error

Error response format:
```json
{
  "success": false,
  "error": "Error type",
  "detail": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 📊 Rate Limiting

Currently, no rate limiting is implemented. For production use, consider adding rate limiting middleware to prevent abuse.

## 🔒 Security Notes

1. **File uploads**: Only PDF files are accepted
2. **Temp files**: Automatically cleaned up after processing
3. **CORS**: Currently allows all origins (configure for production)
4. **API keys**: Validated before processing
5. **Input validation**: All inputs are validated using Pydantic models 