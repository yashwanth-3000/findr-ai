import os
import json
import time
import requests
from dotenv import load_dotenv
import google.generativeai as genai
from datetime import datetime

# ANSI color codes
class Colors:
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

# Load environment variables
load_dotenv()

# Initialize clients
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")

TARGET_USERNAME = "yashwanth-3000"

def poll_extraction_result(extraction_id, api_key, interval=2, max_attempts=15):
    """Poll Firecrawl API for extraction results."""
    url = f"https://api.firecrawl.dev/v1/extract/{extraction_id}"
    headers = {'Authorization': f'Bearer {api_key}'}

    print(f"{Colors.YELLOW}Processing data...{Colors.RESET}")

    for attempt in range(max_attempts):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            data = response.json()

            if data.get('success') and data.get('data'):
                print(f"{Colors.GREEN}Data extracted successfully!{Colors.RESET}")
                return data['data']
            elif data.get('success'):
                if attempt % 3 == 0:
                    print(".", end="", flush=True)
                time.sleep(interval)
            else:
                print(f"\n{Colors.RED}API Error: {data.get('error', 'Unknown error')}{Colors.RESET}")
                return None

        except requests.exceptions.Timeout:
            print(f"\n{Colors.RED}Request timed out. Retrying...{Colors.RESET}")
            continue
        except Exception as e:
            print(f"\n{Colors.RED}Error polling results: {e}{Colors.RESET}")
            return None

    print(f"\n{Colors.RED}Extraction timed out after {max_attempts} attempts.{Colors.RESET}")
    return None

def extract_data(urls, prompt_text, api_key):
    """Extract data using Firecrawl API."""
    if not api_key:
        print(f"{Colors.RED}Error: Firecrawl API key is missing{Colors.RESET}")
        return None

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }
    
    payload = {
        "urls": urls,
        "prompt": prompt_text,
        "enableWebSearch": False
    }

    try:
        response = requests.post(
            "https://api.firecrawl.dev/v1/extract",
            headers=headers,
            json=payload,
            timeout=15
        )

        if response.status_code != 200:
            print(f"{Colors.RED}API Error ({response.status_code}): {response.text}{Colors.RESET}")
            return None

        data = response.json()
        if not data.get('success'):
            print(f"{Colors.RED}API Error: {data.get('error', 'Unknown error')}{Colors.RESET}")
            return None

        extraction_id = data.get('id')
        if not extraction_id:
            print(f"{Colors.RED}No extraction ID received{Colors.RESET}")
            return None

        return poll_extraction_result(extraction_id, api_key)

    except requests.exceptions.Timeout:
        print(f"{Colors.RED}Initial request timed out{Colors.RESET}")
        return None
    except Exception as e:
        print(f"{Colors.RED}Extraction failed: {e}{Colors.RESET}")
        return None

def get_profile_data(username):
    """Extract basic profile information."""
    print(f"{Colors.YELLOW}📋 Extracting profile information...{Colors.RESET}")
    
    github_url = f"https://github.com/{username}"
    
    prompt = f"""Extract basic GitHub profile information for {username}:
    
    PROFILE DETAILS:
    - Full name
    - Username
    - Bio/description  
    - Company/organization
    - Location
    - Website/blog URL
    - Email (if public)
    - Twitter handle (if linked)
    - Followers count
    - Following count
    - Public repositories count
    - Total contributions (if visible)
    
    Return the information in a clear, structured format."""
    
    return extract_data([github_url], prompt, firecrawl_api_key)

def get_repositories_data(username):
    """Extract all repository information."""
    print(f"{Colors.YELLOW}📁 Extracting repositories information...{Colors.RESET}")
    
    repos_urls = [
        f"https://github.com/{username}?tab=repositories",
        f"https://github.com/{username}"
    ]
    
    prompt = f"""Extract ALL repository information for {username}:
    
    For EVERY repository listed, extract:
    - Repository name
    - Full GitHub URL (https://github.com/{username}/repo-name)
    - Description
    - Programming language(s)
    - Star count
    - Fork count
    - Last updated date
    - Is it forked from another repo?
    
    IMPORTANT: List ALL repositories found, not just the first few. 
    Include both original repositories and forks.
    
    Format each repository as:
    Repository: [name]
    URL: https://github.com/{username}/[repo-name]
    Description: [description]
    Language: [primary language]
    Stars: [count]
    Forks: [count]
    Updated: [date]
    Type: [Original/Forked]
    """
    
    return extract_data(repos_urls, prompt, firecrawl_api_key)

def get_commit_history_data(username):
    """Extract commit history and contribution verification."""
    print(f"{Colors.YELLOW}📈 Extracting commit history and contributions...{Colors.RESET}")
    
    contribution_urls = [
        f"https://github.com/{username}",
        f"https://github.com/{username}?tab=overview",
        f"https://github.com/{username}?tab=repositories"
    ]
    
    prompt = f"""Extract comprehensive commit history and contribution data for {username}:
    
    COMMIT HISTORY & CONTRIBUTIONS:
    - Total contributions in the last year
    - Contribution streak information (current streak, longest streak)
    - Contribution calendar/heatmap data (weekly/monthly patterns)
    - Recent commit activity (last 30 days)
    - Most active periods/months
    - Commit frequency patterns
    
    RECENT ACTIVITY VERIFICATION:
    - Recent commits with dates and repositories
    - Recent pull requests created/merged
    - Recent issues opened/closed
    - Recent repository updates
    - Activity timeline (last 7 days, 30 days)
    
    CONTRIBUTION PATTERNS:
    - Most active days of the week
    - Most active times/months of the year
    - Consistency of contributions
    - Peak activity periods
    
    VERIFICATION DATA:
    - First contribution date
    - Most recent contribution date
    - Total public contributions
    - Private contribution activity (if visible)
    - Contribution graph visualization data
    
    Extract all visible contribution metrics, commit history, and activity patterns.
    Include specific dates, numbers, and patterns where available.
    """
    
    return extract_data(contribution_urls, prompt, firecrawl_api_key)

def analyze_with_gemini(profile_data, repos_data, commit_data, username):
    """Use Gemini to consolidate and format all the extracted data."""
    prompt = f"""
    Consolidate and format the comprehensive GitHub profile analysis for {username}.
    
    Use the following data sources:
    
    PROFILE DATA:
    {json.dumps(profile_data, indent=2) if profile_data else "No profile data available"}
    
    REPOSITORIES DATA:  
    {json.dumps(repos_data, indent=2) if repos_data else "No repositories data available"}
    
    COMMIT HISTORY DATA:
    {json.dumps(commit_data, indent=2) if commit_data else "No commit history data available"}
    
    Please organize the information into these sections:
    
    ## BASIC PROFILE DETAILS
    - Full Name:
    - Username: 
    - Bio:
    - Company:
    - Location:
    - Website:
    - Email:
    - Twitter:
    - Followers:
    - Following:
    - Public Repos:
    
    ## ALL REPOSITORY URLS
    List every repository with its complete URL:
    1. Repository Name: https://github.com/{username}/repo-name
    2. Repository Name: https://github.com/{username}/repo-name
    [continue for all repositories found]
    
    ## REPOSITORY DETAILS
    For each repository:
    
    ### Repository Name
    - URL: https://github.com/{username}/repo-name
    - Description: 
    - Language:
    - Stars:
    - Forks:
    - Last Updated:
    - Type: Original/Forked
    
    ## COMMIT HISTORY & CONTRIBUTION VERIFICATION
    ### Overall Activity
    - Total contributions in the last year:
    - Current contribution streak:
    - Longest contribution streak:
    - First contribution date:
    - Most recent contribution date:
    
    ### Recent Activity (Last 30 Days)
    - Recent commits with dates and repositories
    - Recent repository updates
    - Activity patterns and frequency
    
    ### Contribution Patterns
    - Most active days of the week:
    - Most active months/periods:
    - Contribution consistency:
    - Peak activity periods:
    
    ### Activity Verification
    - Contribution calendar patterns
    - Commit frequency analysis
    - Activity timeline verification
    - Public vs private contribution activity
    
    ## SUMMARY
    - Total repositories analyzed:
    - Most popular repository (by stars):
    - Primary programming languages:
    - Overall activity level:
    - Development consistency:
    
    Be comprehensive and include ALL repositories and contribution data found. Don't omit any information.
    """

    try:
        model = genai.GenerativeModel('models/gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        return response.text.strip()

    except Exception as e:
        print(f"{Colors.RED}Analysis failed: {e}{Colors.RESET}")
        return None

def save_results(analysis, raw_data, username):
    """Save the analysis results and raw data to files."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Save formatted analysis
    analysis_filename = f"{username}_complete_analysis_{timestamp}.txt"
    try:
        with open(analysis_filename, 'w', encoding='utf-8') as f:
            f.write(f"COMPLETE GITHUB PROFILE ANALYSIS: {username}\n")
            f.write(f"Generated at: {datetime.now()}\n")
            f.write("=" * 70 + "\n\n")
            f.write(analysis)
        print(f"{Colors.GREEN}📄 Analysis saved to: {analysis_filename}{Colors.RESET}")
    except Exception as e:
        print(f"{Colors.RED}Error saving analysis: {e}{Colors.RESET}")
    
    # Save raw data for reference
    raw_filename = f"{username}_raw_data_{timestamp}.json"
    try:
        with open(raw_filename, 'w', encoding='utf-8') as f:
            json.dump(raw_data, f, indent=2, ensure_ascii=False)
        print(f"{Colors.GREEN}📊 Raw data saved to: {raw_filename}{Colors.RESET}")
    except Exception as e:
        print(f"{Colors.RED}Error saving raw data: {e}{Colors.RESET}")
    
    return analysis_filename, raw_filename

def main():
    """Main function to comprehensively analyze yashwanth-3000 profile."""
    print(f"{Colors.BOLD}{Colors.BLUE}🔍 COMPREHENSIVE GITHUB PROFILE ANALYZER{Colors.RESET}")
    print(f"{Colors.CYAN}Target User: {TARGET_USERNAME}{Colors.RESET}")
    print("=" * 60)
    
    all_data = {}
    
    # Step 1: Extract basic profile information
    print(f"\n{Colors.YELLOW}Step 1: Extracting basic profile information...{Colors.RESET}")
    profile_data = get_profile_data(TARGET_USERNAME)
    all_data['profile'] = profile_data
    
    # Step 2: Extract repositories information
    print(f"\n{Colors.YELLOW}Step 2: Extracting repositories information...{Colors.RESET}")
    repos_data = get_repositories_data(TARGET_USERNAME)
    all_data['repositories'] = repos_data
    
    # Step 3: Extract commit history and contribution data
    print(f"\n{Colors.YELLOW}Step 3: Extracting commit history and contributions...{Colors.RESET}")
    commit_data = get_commit_history_data(TARGET_USERNAME)
    all_data['commit_history'] = commit_data
    
    # Step 4: Analyze and consolidate with Gemini
    print(f"\n{Colors.YELLOW}Step 4: Analyzing and consolidating all data...{Colors.RESET}")
    analysis = analyze_with_gemini(profile_data, repos_data, commit_data, TARGET_USERNAME)

    if not analysis:
        print(f"{Colors.RED}Failed to generate analysis{Colors.RESET}")
        return

    # Step 5: Display results
    print(f"\n{Colors.GREEN}🎯 COMPREHENSIVE ANALYSIS RESULTS:{Colors.RESET}")
    print("=" * 70)
    print(analysis)

    # Step 6: Save results
    print(f"\n{Colors.YELLOW}Step 5: Saving results...{Colors.RESET}")
    analysis_file, raw_file = save_results(analysis, all_data, TARGET_USERNAME)
    
    print(f"\n{Colors.BLUE}✅ Complete analysis finished for {TARGET_USERNAME}!{Colors.RESET}")
    print(f"{Colors.CYAN}📁 Check the generated files for detailed results{Colors.RESET}")

if __name__ == "__main__":
    main() 