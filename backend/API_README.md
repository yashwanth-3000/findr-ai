# PDF Multi-Crew Resume Analyzer API 🚀

A FastAPI-powered web service that provides AI-driven resume analysis with GitHub project verification using CrewAI and Groq.

## ✨ Features

- **PDF Resume Processing**: Extracts and analyzes text from PDF resumes
- **AI-Powered Job Matching**: Scores resume against job descriptions using Groq LLM
- **GitHub Verification**: Validates GitHub projects using Firecrawl and Gitingest
- **Dual Processing Modes**: Synchronous and asynchronous analysis
- **Real-time Progress Tracking**: Monitor long-running analysis jobs
- **RESTful API**: Clean, documented endpoints with OpenAPI spec
- **Error Handling**: Comprehensive error handling and validation

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI App   │    │  CrewAI Agents   │    │  External APIs  │
│                 │    │                  │    │                 │
│ • File Upload   │───▶│ • PDF Parser     │───▶│ • Groq LLM      │
│ • Job Management│    │ • Resume Analyzer│    │ • Firecrawl     │
│ • Status Tracking│   │ • Job Matcher    │    │ • Gitingest     │
│ • Error Handling│    │ • GitHub Verifier│    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone the repository (if not already done)
# cd findr-ai-lablab

# Install API dependencies
pip install -r requirements_api.txt

# Set up environment variables
echo "GROQ_API_KEY=your_groq_api_key" >> .env
echo "FIRECRAWL_API_KEY=your_firecrawl_api_key" >> .env
```

### 2. Start the API Server

```bash
# Option 1: Using the startup script (recommended)
python start_api.py

# Option 2: Direct uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Option 3: Background mode
nohup python start_api.py > api.log 2>&1 &
```

### 3. Verify Installation

```bash
# Test the API
python test_api.py

# Or check health endpoint
curl http://localhost:8000/health
```

### 4. Access Documentation

- **Interactive API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **API Root**: http://localhost:8000/

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/analyze-resume` | Synchronous resume analysis |
| `POST` | `/analyze-resume-async` | Asynchronous analysis (with job tracking) |
| `GET` | `/analysis-status/{job_id}` | Check job status and results |
| `DELETE` | `/analysis-job/{job_id}` | Delete completed job |
| `GET` | `/health` | API health check |

### Request Format

**File Upload + Form Data:**
- `pdf_file`: PDF resume file
- `github_profile_url`: GitHub profile URL
- `best_project_repos`: JSON array of repository URLs (1-5 repos)
- `job_description`: Job description text

**Example with curl:**
```bash
curl -X POST "http://localhost:8000/analyze-resume-async" \
  -F "pdf_file=@resume.pdf" \
  -F "github_profile_url=https://github.com/username" \
  -F "best_project_repos=[\"https://github.com/username/project1\"]" \
  -F "job_description=Senior Software Engineer..."
```

## 🐍 Python Client Usage

```python
import requests
import json

# Start async analysis
files = {"pdf_file": open("resume.pdf", "rb")}
data = {
    "github_profile_url": "https://github.com/yashwanth-3000",
    "best_project_repos": json.dumps([
        "https://github.com/yashwanth-3000/content--hub",
        "https://github.com/yashwanth-3000/Dev-Docs-Local"
    ]),
    "job_description": "Senior Software Engineer position..."
}

response = requests.post("http://localhost:8000/analyze-resume-async", 
                        files=files, data=data)
job_id = response.json()["job_id"]

# Poll for results
import time
while True:
    status_response = requests.get(f"http://localhost:8000/analysis-status/{job_id}")
    status_data = status_response.json()
    
    print(f"Status: {status_data['status']} ({status_data['progress']*100:.1f}%)")
    
    if status_data["status"] == "completed":
        results = status_data["results"]
        print(f"Matching Score: {results['matching_score']}%")
        break
    elif status_data["status"] == "failed":
        print(f"Failed: {status_data['error']}")
        break
    
    time.sleep(5)
```

## 📊 Response Format

### Successful Analysis Response

```json
{
  "success": true,
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "matching_score": 72.0,
  "github_verification_triggered": true,
  "results": {
    "resume_analysis": {
      "matching_score": 72.0,
      "pdf_parsing": "Structured resume content...",
      "resume_analysis": "Candidate analysis...",
      "job_matching": "Detailed matching breakdown...",
      "github_extraction": "GitHub URLs found..."
    },
    "github_verification": {
      "triggered": true,
      "repositories_analyzed": 3,
      "credibility_scoring": "90/100 - HIGHLY CREDIBLE",
      "verification_report": "Comprehensive hiring report..."
    }
  },
  "analysis_summary": {
    "matching_score": 72.0,
    "github_profile": "https://github.com/yashwanth-3000",
    "verified_repos": 3,
    "processing_time_seconds": 45.6
  },
  "processing_time_seconds": 45.6,
  "timestamp": "2024-01-15T10:32:45Z"
}
```

## 🔧 Configuration Options

### Environment Variables

```bash
# Required
GROQ_API_KEY=your_groq_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Optional API Configuration
API_HOST=0.0.0.0          # Server host
API_PORT=8000             # Server port
API_RELOAD=true           # Auto-reload on changes
API_LOG_LEVEL=info        # Logging level
```

### Production Configuration

For production deployment:

```bash
# Use a production ASGI server
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Set production environment
export API_RELOAD=false
export API_LOG_LEVEL=warning

# Configure CORS for specific origins
# Edit main.py to set allow_origins to your frontend domains
```

## 🚨 Error Handling

The API returns standard HTTP status codes:

- **200**: Success
- **400**: Bad Request (validation errors)
- **404**: Not Found (job not found)
- **422**: Unprocessable Entity (data validation errors)
- **500**: Internal Server Error

Error response format:
```json
{
  "success": false,
  "error": "Error type",
  "detail": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔒 Security Considerations

### Current Implementation
- **File validation**: Only PDF files accepted
- **Input validation**: All parameters validated using Pydantic
- **Temporary files**: Automatically cleaned up after processing
- **CORS**: Currently allows all origins (configure for production)

### Production Recommendations
1. **Configure CORS** for specific allowed origins
2. **Add rate limiting** to prevent abuse
3. **Use HTTPS** with proper SSL certificates
4. **Implement authentication** if needed
5. **Set up monitoring** and logging
6. **Use a reverse proxy** (Nginx) for static files and load balancing

## 📈 Performance & Scaling

### Current Limitations
- **In-memory job storage**: Jobs stored in application memory
- **Single instance**: No horizontal scaling support
- **File processing**: Synchronous PDF processing

### Production Scaling Options
1. **Database job storage**: Use PostgreSQL/MongoDB for job persistence
2. **Redis job queue**: Use Celery + Redis for background processing
3. **Load balancing**: Deploy multiple instances behind a load balancer
4. **File storage**: Use cloud storage (S3, GCS) for PDF files
5. **Caching**: Add Redis caching for frequent requests

## 🧪 Testing

### Run API Tests
```bash
# Test all endpoints
python test_api.py

# Test specific URL
python test_api.py http://your-server:8000

# Test with custom PDF
python test_api.py http://localhost:8000 custom_resume.pdf
```

### Manual Testing
```bash
# Health check
curl http://localhost:8000/health

# API documentation
open http://localhost:8000/docs

# Test with sample data
curl -X POST "http://localhost:8000/analyze-resume-async" \
  -F "pdf_file=@yash.pdf" \
  -F "github_profile_url=https://github.com/yashwanth-3000" \
  -F "best_project_repos=[\"https://github.com/yashwanth-3000/content--hub\"]" \
  -F "job_description=Software Engineer position"
```

## 📚 Further Documentation

- **Detailed API Usage**: See `API_USAGE.md`
- **Original Script**: See `pdf_multi_crew_resume_analyzer.py`
- **Dependencies**: See `requirements_api.txt`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is part of the findr-ai-lablab project. See the main repository for license information.

## 🆘 Troubleshooting

### Common Issues

**API won't start:**
- Check environment variables are set
- Verify dependencies are installed
- Check port 8000 is available

**Analysis fails:**
- Verify API keys are valid
- Check PDF file is not corrupted
- Ensure GitHub URLs are accessible

**Slow performance:**
- Large PDF files take longer to process
- Multiple repository analysis increases processing time
- Consider using async endpoints for better UX

### Getting Help

1. Check the logs for error details
2. Run the test script to verify setup
3. Check the interactive docs at `/docs`
4. Review the original script for implementation details

---

🚀 **Ready to analyze resumes with AI!** Visit http://localhost:8000/docs to get started. 