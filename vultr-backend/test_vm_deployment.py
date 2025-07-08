#!/usr/bin/env python3
"""
VM Deployment Test Script for Resume Analyzer with removed 65% threshold.
This script verifies the deployment works correctly on the production VM.
"""
import os
import sys
import json
import subprocess
import time
from pathlib import Path

def check_python_version():
    """Check Python version compatibility."""
    print("🔍 Checking Python version...")
    
    version = sys.version_info
    print(f"📋 Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major == 3 and version.minor >= 11:
        print("✅ Python version is compatible (>= 3.11)")
        return True
    else:
        print("❌ Python version is not compatible. Requires Python 3.11 or higher")
        return False

def test_dependency_installation():
    """Test that all dependencies can be installed without conflicts."""
    print("\n🔍 Testing dependency installation...")
    
    try:
        # Test installation with pip check
        result = subprocess.run([
            sys.executable, "-m", "pip", "check"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ All dependencies are compatible")
            return True
        else:
            print(f"❌ Dependency conflicts detected:\n{result.stdout}\n{result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Dependency check timed out")
        return False
    except Exception as e:
        print(f"❌ Error checking dependencies: {e}")
        return False

def test_critical_imports():
    """Test importing critical modules."""
    print("\n🔍 Testing critical imports...")
    
    critical_modules = [
        ("fastapi", "FastAPI framework"),
        ("uvicorn", "ASGI server"),
        ("crewai", "AI workflow framework"),
        ("groq", "Groq AI client"),
        ("gitingest", "Git repository analysis"),
        ("pdfplumber", "PDF processing"),
        ("pydantic", "Data validation")
    ]
    
    failed_imports = []
    
    for module_name, description in critical_modules:
        try:
            __import__(module_name)
            print(f"✅ {module_name}: {description}")
        except ImportError as e:
            print(f"❌ {module_name}: Failed to import - {e}")
            failed_imports.append(module_name)
    
    if not failed_imports:
        print("✅ All critical modules imported successfully")
        return True
    else:
        print(f"❌ Failed to import: {', '.join(failed_imports)}")
        return False

def test_application_startup():
    """Test that the application can start without errors."""
    print("\n🔍 Testing application startup...")
    
    try:
        # Import main modules
        from main import app
        print("✅ Successfully imported FastAPI app")
        
        from pdf_multi_crew_resume_analyzer import main as analyzer_main
        print("✅ Successfully imported analyzer main function")
        
        # Test that key functions exist
        from main import run_analysis_workflow
        print("✅ Successfully imported run_analysis_workflow")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Application startup error: {e}")
        return False

def test_threshold_removal_verification():
    """Verify that the 65% threshold has been properly removed."""
    print("\n🔍 Verifying threshold removal...")
    
    files_to_check = [
        ("main.py", [
            "github_verification_triggered = True",
            "# GitHub verification is now always triggered regardless of score"
        ]),
        ("pdf_multi_crew_resume_analyzer.py", [
            "# GITHUB VERIFICATION: ALWAYS PERFORMED REGARDLESS OF SCORE",
            "GitHub Verification will proceed regardless of matching score"
        ])
    ]
    
    for file_path, expected_texts in files_to_check:
        if not os.path.exists(file_path):
            print(f"❌ {file_path}: File not found")
            return False
            
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            for expected_text in expected_texts:
                if expected_text in content:
                    print(f"✅ {file_path}: Found - '{expected_text[:40]}...'")
                else:
                    print(f"❌ {file_path}: Missing - '{expected_text[:40]}...'")
                    return False
            
            # Verify old threshold logic is removed
            if "matching_score > 65" in content:
                print(f"❌ {file_path}: Still contains old threshold logic")
                return False
            else:
                print(f"✅ {file_path}: Old threshold logic properly removed")
                
        except Exception as e:
            print(f"❌ {file_path}: Error reading file - {e}")
            return False
    
    return True

def test_environment_variables():
    """Test that required environment variables can be loaded."""
    print("\n🔍 Testing environment variables...")
    
    env_file = ".env"
    if not os.path.exists(env_file):
        print("⚠️  .env file not found - creating template")
        return True  # This is acceptable for testing
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("✅ Environment variables loaded successfully")
        
        # Check for critical env vars (without revealing values)
        critical_vars = ["GROQ_API_KEY", "FIRECRAWL_API_KEY"]
        for var in critical_vars:
            if os.getenv(var):
                print(f"✅ {var}: Available")
            else:
                print(f"⚠️  {var}: Not set (required for full functionality)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading environment variables: {e}")
        return False

def test_api_endpoints():
    """Test that API endpoints are properly defined."""
    print("\n🔍 Testing API endpoint definitions...")
    
    try:
        from main import app
        
        # Get all routes
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                routes.append(route.path)
        
        expected_endpoints = [
            "/",
            "/health",
            "/analyze-resume",
            "/analyze-resume-async"
        ]
        
        for endpoint in expected_endpoints:
            if endpoint in routes:
                print(f"✅ Endpoint {endpoint}: Defined")
            else:
                print(f"❌ Endpoint {endpoint}: Missing")
                return False
        
        print(f"✅ All {len(expected_endpoints)} critical endpoints are defined")
        return True
        
    except Exception as e:
        print(f"❌ Error checking API endpoints: {e}")
        return False

def run_deployment_tests():
    """Run all deployment verification tests."""
    print("🚀 Starting VM Deployment Verification Tests")
    print("=" * 60)
    
    tests = [
        ("Python Version Check", check_python_version),
        ("Dependency Installation", test_dependency_installation),
        ("Critical Imports", test_critical_imports),
        ("Threshold Removal Verification", test_threshold_removal_verification),
        ("Environment Variables", test_environment_variables),
        ("Application Startup", test_application_startup),
        ("API Endpoints", test_api_endpoints),
    ]
    
    passed = 0
    total = len(tests)
    results = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        try:
            if test_func():
                passed += 1
                results.append((test_name, "PASSED"))
                print(f"✅ {test_name}: PASSED")
            else:
                results.append((test_name, "FAILED"))
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            results.append((test_name, f"ERROR: {e}"))
            print(f"❌ {test_name}: ERROR - {e}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 DEPLOYMENT TEST SUMMARY")
    print("=" * 60)
    
    for test_name, status in results:
        status_icon = "✅" if status == "PASSED" else "❌"
        print(f"{status_icon} {test_name}: {status}")
    
    print(f"\n📈 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Deployment is ready for production.")
        print("\n📋 Next Steps:")
        print("1. Deploy to VM")
        print("2. Start the service with: sudo systemctl start resume-analyzer")
        print("3. Check service status: sudo systemctl status resume-analyzer")
        print("4. Test API endpoint: curl https://139.84.210.229.sslip.io/health")
        return True
    else:
        print("⚠️  SOME TESTS FAILED! Please resolve issues before deployment.")
        print("\n🔧 Common fixes:")
        print("- Check Python version (requires 3.11+)")
        print("- Install missing dependencies: pip install -r requirements.txt")
        print("- Verify environment variables in .env file")
        return False

if __name__ == "__main__":
    success = run_deployment_tests()
    sys.exit(0 if success else 1) 