#!/usr/bin/env python3
"""
Local test script to verify the 65% threshold removal changes work correctly.
"""
import os
import sys
import json
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all required imports work."""
    print("🔍 Testing imports...")
    
    try:
        import fastapi
        print(f"✅ FastAPI: {fastapi.__version__}")
        
        import groq
        print(f"✅ Groq: {groq.__version__}")
        
        import crewai
        print(f"✅ CrewAI: {crewai.__version__}")
        
        import gitingest
        # GitIngest may not have __version__ attribute in some versions
        try:
            version = gitingest.__version__
            print(f"✅ GitIngest: {version}")
        except AttributeError:
            print(f"✅ GitIngest: Imported successfully (version info not available)")
        
        import pdfplumber
        print(f"✅ PDFPlumber: {pdfplumber.__version__}")
        
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def test_github_verification_logic():
    """Test the GitHub verification logic changes."""
    print("\n🔍 Testing GitHub verification logic...")
    
    try:
        # Import the main analysis function
        from main import run_analysis_workflow
        print("✅ Successfully imported run_analysis_workflow")
        
        # Test the logic in pdf_multi_crew_resume_analyzer
        from pdf_multi_crew_resume_analyzer import main as analyzer_main
        print("✅ Successfully imported analyzer main function")
        
        return True
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_code_syntax():
    """Test that the modified code compiles without syntax errors."""
    print("\n🔍 Testing code syntax...")
    
    files_to_test = [
        "main.py",
        "pdf_multi_crew_resume_analyzer.py"
    ]
    
    for file_path in files_to_test:
        try:
            with open(file_path, 'r') as f:
                code = f.read()
            
            # Compile the code to check for syntax errors
            compile(code, file_path, 'exec')
            print(f"✅ {file_path}: Syntax OK")
            
        except SyntaxError as e:
            print(f"❌ {file_path}: Syntax Error - {e}")
            return False
        except Exception as e:
            print(f"❌ {file_path}: Error - {e}")
            return False
    
    return True

def test_threshold_removal():
    """Test that the 65% threshold has been removed from the code."""
    print("\n🔍 Testing threshold removal...")
    
    files_to_check = [
        ("main.py", "github_verification_triggered = True"),
        ("pdf_multi_crew_resume_analyzer.py", "GitHub verification is always triggered")
    ]
    
    for file_path, expected_text in files_to_check:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            if expected_text in content:
                print(f"✅ {file_path}: Found expected change - '{expected_text[:50]}...'")
            else:
                print(f"❌ {file_path}: Expected text not found - '{expected_text[:50]}...'")
                return False
                
            # Check that old threshold logic is removed
            if "matching_score > 65" in content:
                print(f"❌ {file_path}: Still contains old threshold logic")
                return False
            else:
                print(f"✅ {file_path}: Old threshold logic removed")
                
        except Exception as e:
            print(f"❌ {file_path}: Error reading file - {e}")
            return False
    
    return True

def test_environment_setup():
    """Test environment setup for deployment."""
    print("\n🔍 Testing environment setup...")
    
    # Check if .env file exists
    if os.path.exists('.env'):
        print("✅ .env file exists")
    else:
        print("⚠️  .env file not found (this is expected for local testing)")
    
    # Check requirements files
    if os.path.exists('requirements.txt'):
        print("✅ requirements.txt exists")
    else:
        print("❌ requirements.txt missing")
        return False
    
    if os.path.exists('requirements_updated.txt'):
        print("✅ requirements_updated.txt exists")
    else:
        print("❌ requirements_updated.txt missing")
        return False
    
    return True

def main():
    """Run all local tests."""
    print("🚀 Starting Local Testing for Resume Analyzer Changes")
    print("="*60)
    
    tests = [
        test_code_syntax,
        test_threshold_removal,
        test_environment_setup,
        test_imports,
        test_github_verification_logic,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
                print("✅ Test passed\n")
            else:
                print("❌ Test failed\n")
        except Exception as e:
            print(f"❌ Test error: {e}\n")
    
    print("="*60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Ready for deployment.")
        return True
    else:
        print("⚠️  Some tests failed. Please review before deployment.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 