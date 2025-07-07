#!/usr/bin/env python3
"""
Local FastAPI Test Script
Run this to test your FastAPI application locally before deploying to Vultr
"""

import requests
import json
import time
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint: str, method: str = "GET", data: Dict[Any, Any] = None) -> bool:
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, timeout=5)
        else:
            print(f"❌ Unsupported method: {method}")
            return False
            
        if response.status_code in [200, 201]:
            print(f"✅ {method} {endpoint} - Status: {response.status_code}")
            if response.headers.get('content-type', '').startswith('application/json'):
                response_data = response.json()
                print(f"   Response: {json.dumps(response_data, indent=2)[:100]}...")
            return True
        else:
            print(f"❌ {method} {endpoint} - Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {method} {endpoint} - Connection failed (is the server running?)")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {method} {endpoint} - Request timeout")
        return False
    except Exception as e:
        print(f"❌ {method} {endpoint} - Error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing FastAPI Application Locally")
    print("=====================================")
    print(f"Base URL: {BASE_URL}")
    print()
    
    # Wait for server to be ready
    print("⏳ Checking if server is running...")
    for i in range(10):
        try:
            response = requests.get(f"{BASE_URL}/", timeout=2)
            if response.status_code == 200:
                print("✅ Server is running!")
                break
        except:
            if i == 9:
                print("❌ Server is not running!")
                print("Please start the server with: python main.py")
                sys.exit(1)
            time.sleep(1)
    
    print()
    
    # Test all endpoints
    tests_passed = 0
    total_tests = 0
    
    # Basic endpoints
    total_tests += 1
    if test_endpoint("/"):
        tests_passed += 1
    
    total_tests += 1
    if test_endpoint("/health"):
        tests_passed += 1
        
    total_tests += 1
    if test_endpoint("/info"):
        tests_passed += 1
    
    # Test items API
    total_tests += 1
    if test_endpoint("/items"):
        tests_passed += 1
    
    # Create an item
    test_item = {
        "name": "Test Item",
        "description": "A test item for local testing",
        "price": 29.99
    }
    
    total_tests += 1
    if test_endpoint("/items", "POST", test_item):
        tests_passed += 1
        
        # Get all items again
        total_tests += 1
        if test_endpoint("/items"):
            tests_passed += 1
            
        # Get specific item
        total_tests += 1
        if test_endpoint("/items/1"):
            tests_passed += 1
            
        # Delete item
        total_tests += 1
        if test_endpoint("/items/1", "DELETE"):
            tests_passed += 1
    
    # Test documentation endpoints
    doc_endpoints = ["/docs", "/redoc", "/openapi.json"]
    for endpoint in doc_endpoints:
        total_tests += 1
        if test_endpoint(endpoint):
            tests_passed += 1
    
    print()
    print("📊 Test Results")
    print("================")
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Your FastAPI app is ready for deployment.")
        print()
        print("🚀 Next steps:")
        print("1. Set your Vultr API key: export VULTR_API_KEY=\"your-key\"")
        print("2. Install Vultr CLI: brew install vultr-cli")
        print("3. Run deployment: ./deploy.sh")
        sys.exit(0)
    else:
        print(f"❌ {total_tests - tests_passed} tests failed. Please fix the issues before deploying.")
        sys.exit(1)

if __name__ == "__main__":
    main() 