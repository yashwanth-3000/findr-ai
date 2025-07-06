#!/usr/bin/env python3
"""
Test script for GitHub Profile Analyzer
Tests multiple GitHub usernames and saves results
"""

import subprocess
import time
import os
from datetime import datetime

# Test usernames to analyze
TEST_USERNAMES = [
    "octocat",      # GitHub's mascot account
    "torvalds",     # Linus Torvalds
    "gaearon",      # Dan Abramov (React)
    "sindresorhus", # Sindre Sorhus (popular JS developer)
    "addyosmani",   # Addy Osmani (Google Chrome team)
]

def run_analyzer(username):
    """Run the GitHub analyzer for a specific username."""
    print(f"\n🔍 Analyzing GitHub profile: {username}")
    print("=" * 50)
    
    try:
        # Run the analyzer script with the username as input
        result = subprocess.run(
            ["python", "github_analyzer.py"],
            input=username,
            text=True,
            capture_output=True,
            timeout=120  # 2 minute timeout
        )
        
        if result.returncode == 0:
            print(f"✅ Successfully analyzed {username}")
            print(result.stdout)
            
            # Save results to file
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"test_results_{username}_{timestamp}.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(f"GitHub Analysis Results for {username}\n")
                f.write(f"Generated at: {datetime.now()}\n")
                f.write("=" * 50 + "\n\n")
                f.write(result.stdout)
            
            print(f"📄 Results saved to: {filename}")
            return True
        else:
            print(f"❌ Failed to analyze {username}")
            print("Error:", result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ Timeout analyzing {username}")
        return False
    except Exception as e:
        print(f"💥 Error analyzing {username}: {e}")
        return False

def main():
    """Main test function."""
    print("🚀 GitHub Profile Analyzer - Batch Test")
    print(f"📅 Started at: {datetime.now()}")
    print(f"🎯 Testing {len(TEST_USERNAMES)} profiles")
    
    successful = 0
    failed = 0
    
    for i, username in enumerate(TEST_USERNAMES, 1):
        print(f"\n📊 Progress: {i}/{len(TEST_USERNAMES)}")
        
        if run_analyzer(username):
            successful += 1
        else:
            failed += 1
        
        # Add delay between requests to be respectful to APIs
        if i < len(TEST_USERNAMES):
            print("⏳ Waiting 10 seconds before next analysis...")
            time.sleep(10)
    
    # Summary
    print("\n" + "=" * 50)
    print("📈 BATCH TEST SUMMARY")
    print("=" * 50)
    print(f"✅ Successful analyses: {successful}")
    print(f"❌ Failed analyses: {failed}")
    print(f"📊 Success rate: {(successful/len(TEST_USERNAMES)*100):.1f}%")
    print(f"🏁 Completed at: {datetime.now()}")
    
    # List generated files
    test_files = [f for f in os.listdir('.') if f.startswith('test_results_')]
    if test_files:
        print(f"\n📁 Generated {len(test_files)} result files:")
        for file in sorted(test_files):
            print(f"   📄 {file}")

if __name__ == "__main__":
    main() 