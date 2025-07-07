#!/usr/bin/env python3
"""
Test script for PDF Multi-Crew Resume Analyzer API
================================================

This script tests the API endpoints to ensure they work correctly.
"""

import os
import sys
import time
import json
import requests
from pathlib import Path

class APITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        
    def test_health_check(self):
        """Test the health check endpoint."""
        print("🔍 Testing health check endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Health check passed")
                print(f"   • Status: {data['status']}")
                print(f"   • Version: {data['version']}")
                print(f"   • Dependencies: {data['dependencies']}")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection failed - is the API server running on {self.base_url}?")
            return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    def test_root_endpoint(self):
        """Test the root endpoint."""
        print("\n🔍 Testing root endpoint...")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Root endpoint working")
                print(f"   • API Name: {data['name']}")
                print(f"   • Version: {data['version']}")
                return True
            else:
                print(f"❌ Root endpoint failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Root endpoint error: {e}")
            return False
    
    def test_async_analysis_start(self, pdf_path=None):
        """Test starting an async analysis."""
        print("\n🔍 Testing async analysis endpoint...")
        
        # Use existing PDF if available, otherwise skip
        if pdf_path is None:
            pdf_path = "yash.pdf"
        
        if not Path(pdf_path).exists():
            print(f"⚠️ PDF file {pdf_path} not found, skipping analysis test")
            return None
        
        try:
            # Test data
            github_profile = "https://github.com/yashwanth-3000"
            project_repos = [
                "https://github.com/yashwanth-3000/content--hub",
                "https://github.com/yashwanth-3000/Dev-Docs-Local"
            ]
            job_description = "Senior Software Engineer position requiring Python, JavaScript, and AI/ML experience."
            
            # Prepare request
            files = {"pdf_file": open(pdf_path, "rb")}
            data = {
                "github_profile_url": github_profile,
                "best_project_repos": json.dumps(project_repos),
                "job_description": job_description,
                "company_name": "TechCorp Inc",
                "job_name": "Senior Software Engineer"
            }
            
            print(f"   • PDF: {pdf_path}")
            print(f"   • GitHub: {github_profile}")
            print(f"   • Repos: {len(project_repos)}")
            
            response = requests.post(
                f"{self.base_url}/analyze-resume-async",
                files=files,
                data=data,
                timeout=None  # No timeout for analysis
            )
            
            files["pdf_file"].close()
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Async analysis started successfully")
                print(f"   • Job ID: {data['job_id']}")
                print(f"   • Status: {data['status']}")
                return data['job_id']
            else:
                print(f"❌ Async analysis failed: {response.status_code}")
                print(f"   • Response: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Async analysis error: {e}")
            return None
    
    def test_job_status(self, job_id):
        """Test job status endpoint."""
        if not job_id:
            return False
            
        print(f"\n🔍 Testing job status for {job_id}...")
        
        try:
            response = requests.get(f"{self.base_url}/analysis-status/{job_id}", timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Job status retrieved")
                print(f"   • Status: {data['status']}")
                print(f"   • Progress: {data['progress']*100:.1f}%")
                print(f"   • Message: {data['message']}")
                return True
            else:
                print(f"❌ Job status failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Job status error: {e}")
            return False
    
    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors."""
        print("\n🔍 Testing error handling...")
        
        # Test invalid job ID
        try:
            response = requests.get(f"{self.base_url}/analysis-status/invalid-job-id", timeout=60)
            
            if response.status_code == 404:
                print(f"✅ 404 error handling works")
            else:
                print(f"⚠️ Expected 404, got {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error handling test failed: {e}")
    
    def run_all_tests(self):
        """Run all API tests."""
        print("🚀 Starting PDF Multi-Crew Resume Analyzer API Tests")
        print("=" * 60)
        
        tests_passed = 0
        total_tests = 4
        
        # Test 1: Health check
        if self.test_health_check():
            tests_passed += 1
        
        # Test 2: Root endpoint
        if self.test_root_endpoint():
            tests_passed += 1
        
        # Test 3: Async analysis (if PDF available)
        job_id = self.test_async_analysis_start()
        if job_id:
            tests_passed += 1
            
            # Test 4: Job status
            if self.test_job_status(job_id):
                tests_passed += 1
        else:
            print("\n⚠️ Skipping job status test (no job ID)")
        
        # Test 5: Error handling
        self.test_invalid_endpoints()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {tests_passed}/{total_tests}")
        
        if tests_passed == total_tests:
            print("🎉 All tests passed! API is working correctly.")
        elif tests_passed > 0:
            print("⚠️ Some tests passed. API is partially working.")
        else:
            print("❌ All tests failed. Check API server and configuration.")
        
        return tests_passed == total_tests

def main():
    """Main function to run API tests."""
    
    # Check if server is specified
    base_url = os.getenv("API_URL", "http://localhost:8000")
    
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    
    print(f"🔗 Testing API at: {base_url}")
    
    # Run tests
    tester = APITester(base_url)
    success = tester.run_all_tests()
    
    if success:
        print("\n💡 Next steps:")
        print("   • API is ready for use")
        print("   • Check the API documentation at /docs")
        print("   • Use the client examples in API_USAGE.md")
    else:
        print("\n💡 Troubleshooting:")
        print("   • Make sure the API server is running")
        print("   • Check environment variables (GROQ_API_KEY, FIRECRAWL_API_KEY)")
        print("   • Verify dependencies are installed")
        print("   • Check the server logs for errors")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 