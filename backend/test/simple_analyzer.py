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

    print(f"{Colors.YELLOW}Processing profile data for {TARGET_USERNAME}...{Colors.RESET}")

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

def extract_github_profile(username, api_key):
    """Extract GitHub profile data using Firecrawl."""
    if not api_key:
        print(f"{Colors.RED}Error: Firecrawl API key is missing{Colors.RESET}")
        return None

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }

    github_url = f"https://github.com/{username}"
    
    payload = {
        "urls": [github_url],
        "prompt": f"""Extract comprehensive GitHub profile data for {username}:
        
        REQUIRED DATA:
        1. Basic Profile Information:
           - Full name
           - Username  
           - Bio/description
           - Company/organization
           - Location
           - Website/blog URL
           - Email (if public)
           - Twitter handle (if linked)
           
        2. Statistics:
           - Followers count
           - Following count
           - Public repositories count
           - Total contributions
           
        3. ALL Repository Information:
           - Repository names
           - Repository URLs (full github.com links)
           - Repository descriptions
           - Programming languages used
           - Star counts
           - Fork counts
           - Last updated dates
           
        4. Recent Activity:
           - Recent commits
           - Recent repositories created/updated
           
        Extract ALL repositories - don't limit the list. Include complete URLs for each repository.""",
        "enableWebSearch": False
    }

    try:
        print(f"{Colors.YELLOW}Starting extraction for: {username}{Colors.RESET}")
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

def analyze_with_gemini(profile_data, username):
    """Use Gemini to analyze and structure the GitHub profile data."""
    prompt = f"""
    Analyze the GitHub profile data for {username} and extract the following information in a clear, structured format:

    BASIC PROFILE DETAILS:
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

    ALL REPOSITORY URLS:
    List every repository found with its full URL in this format:
    - Repository Name: https://github.com/{username}/repository-name
    
    REPOSITORY DETAILS:
    For each repository, provide:
    - Name
    - Description
    - Programming Language
    - Stars
    - Forks
    - Last Updated

    RECENT ACTIVITY:
    - Recent commits or contributions
    - Recently updated repositories
    
    Be thorough and include ALL repositories found. Don't summarize or limit the list.
    
    Profile Data: {json.dumps(profile_data, indent=2)}
    """

    try:
        model = genai.GenerativeModel('models/gemini-2.0-flash')
        response = model.generate_content(prompt)
        
        return response.text.strip()

    except Exception as e:
        print(f"{Colors.RED}Analysis failed: {e}{Colors.RESET}")
        return None

def save_results(analysis, username):
    """Save the analysis results to a file."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{username}_profile_analysis_{timestamp}.txt"
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"GitHub Profile Analysis: {username}\n")
            f.write(f"Generated at: {datetime.now()}\n")
            f.write("=" * 60 + "\n\n")
            f.write(analysis)
        
        return filename
    except Exception as e:
        print(f"{Colors.RED}Error saving results: {e}{Colors.RESET}")
        return None

def main():
    """Main function to analyze yashwanth-3000 profile."""
    print(f"{Colors.BOLD}{Colors.BLUE}GitHub Profile Analyzer{Colors.RESET}")
    print(f"{Colors.CYAN}Target User: {TARGET_USERNAME}{Colors.RESET}")
    print("=" * 50)
    
    # Extract profile data
    print(f"\n{Colors.YELLOW}Step 1: Extracting profile data...{Colors.RESET}")
    profile_data = extract_github_profile(TARGET_USERNAME, firecrawl_api_key)
    
    if not profile_data:
        print(f"{Colors.RED}Failed to extract profile data for {TARGET_USERNAME}{Colors.RESET}")
        return

    # Analyze with Gemini
    print(f"\n{Colors.YELLOW}Step 2: Analyzing profile with AI...{Colors.RESET}")
    analysis = analyze_with_gemini(profile_data, TARGET_USERNAME)

    if not analysis:
        print(f"{Colors.RED}Failed to analyze profile data{Colors.RESET}")
        return

    # Display results
    print(f"\n{Colors.GREEN}ANALYSIS RESULTS:{Colors.RESET}")
    print("=" * 60)
    print(analysis)

    # Save results
    print(f"\n{Colors.YELLOW}Step 3: Saving results...{Colors.RESET}")
    filename = save_results(analysis, TARGET_USERNAME)
    
    if filename:
        print(f"{Colors.GREEN}✅ Results saved to: {filename}{Colors.RESET}")
    
    print(f"\n{Colors.BLUE}Analysis complete for {TARGET_USERNAME}!{Colors.RESET}")

if __name__ == "__main__":
    main() 