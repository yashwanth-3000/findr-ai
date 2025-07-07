#!/usr/bin/env python3
"""
PDF Multi-Crew Resume Analyzer using CrewAI and Groq
====================================================

This script demonstrates an advanced multi-crew workflow for PDF resume analysis:

WORKFLOW:
1. First Crew: Resume Analysis Crew
   - PDF Parser Agent: Extracts text from PDF resumes
   - Resume Analyzer Agent: Analyzes resume content and skills
   - Job Matcher Agent: Matches resume against job description and provides score
   - GitHub Extractor Agent: Extracts GitHub URLs from resume

2. Conditional Logic: If score > 65%
   - Triggers Second Crew: GitHub Verification Crew

3. Second Crew: GitHub Verification Crew  
   - Firecrawl GitHub Agent: Extracts GitHub data using Firecrawl web scraping
   - Repository Analyzer Agent: Analyzes repo structure and README files
   - Project Validator Agent: Determines if projects are real or fake
   - Report Generator Agent: Creates comprehensive verification report

The crews work together to provide comprehensive resume analysis and GitHub project verification.
"""

import os
import re
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, List, Optional, Any
import pdfplumber
import requests
from crewai import Agent, Task, Crew, LLM
from gitingest import ingest
import concurrent.futures
import threading

# Load environment variables
load_dotenv()

# ANSI color codes for output
class Colors:
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    RESET = '\033[0m'

def poll_extraction_result(extraction_id, api_key, interval=2, max_attempts=15):
    """Poll Firecrawl API for extraction results."""
    url = f"https://api.firecrawl.dev/v1/extract/{extraction_id}"
    headers = {'Authorization': f'Bearer {api_key}'}

    print(f"{Colors.YELLOW}Processing data...{Colors.RESET}")

    for attempt in range(max_attempts):
        try:
            response = requests.get(url, headers=headers, timeout=300)
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
            timeout=300
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

class PDFResumeProcessor:
    """Handles PDF resume processing and text extraction."""
    
    def __init__(self):
        self.extracted_text = ""
        self.github_urls = []
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF resume using pdfplumber."""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                self.extracted_text = text.strip()
                return self.extracted_text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""
    
    def extract_github_urls(self, text: str) -> List[str]:
        """Extract GitHub URLs from resume text with improved accuracy."""
        urls = []
        
        # Pattern 1: Explicit GitHub URLs (most reliable)
        github_url_patterns = [
            r'https?://github\.com/[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_.-]+)?',
            r'(?<![\w.])github\.com/[a-zA-Z0-9_-]+(?:/[a-zA-Z0-9_.-]+)?',
        ]
        
        for pattern in github_url_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Normalize URL
                if not match.startswith('http'):
                    match = 'https://' + match
                if match not in urls:
                    urls.append(match)
        
        # Pattern 2: Extract specific GitHub usernames (avoid email addresses)
        # Look for patterns that are clearly social media handles, not emails
        username_patterns = [
            r'§@([a-zA-Z0-9_-]+)',  # Special character prefix (clearly not email)
            r'(?:^|\s)@([a-zA-Z0-9_-]+)(?=\s|$)',  # @ at start of line or after space
            r'(?:GitHub|github):\s*@?([a-zA-Z0-9_-]+)',  # Explicitly mentioned with GitHub
            r'(?:Profile|profile|Username|username):\s*@?([a-zA-Z0-9_-]+)',  # Profile context
        ]
        
        for pattern in username_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for username in matches:
                # Filter out common false positives
                if (username and len(username) > 2 and 
                    username.lower() not in ['gmail', 'email', 'com', 'www', 'http', 'https']):
                    github_url = f'https://github.com/{username}'
                    if github_url not in urls:
                        urls.append(github_url)
        
        # Pattern 3: Look for standalone usernames mentioned near project descriptions
        # Extract usernames that appear close to GitHub mentions
        github_context_pattern = r'(?i)(?:github|repository|repo)[\s\S]{0,50}@([a-zA-Z0-9_-]+)'
        matches = re.findall(github_context_pattern, text)
        for username in matches:
            if (username and len(username) > 2 and 
                username.lower() not in ['gmail', 'email', 'com', 'www']):
                github_url = f'https://github.com/{username}'
                if github_url not in urls:
                    urls.append(github_url)
        
        # Filter out any URLs that contain common email domains
        email_domains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'email']
        filtered_urls = []
        for url in urls:
            is_email_related = any(domain in url.lower() for domain in email_domains)
            if not is_email_related:
                filtered_urls.append(url)
        
        self.github_urls = filtered_urls
        return filtered_urls

class FirecrawlGitHubExtractor:
    """Uses Firecrawl API ONLY for GitHub profile information and repository discovery.
    
    This class specifically handles:
    - Extracting repository lists from GitHub profile pages
    - Parsing repository URLs from profile HTML  
    - Profile metadata extraction
    
    Note: Repository content extraction is handled separately by GitHubContentExtractor using Gitingest.
    """
    
    def __init__(self):
        self.firecrawl_api_key = os.getenv("FIRECRAWL_API_KEY")
        if not self.firecrawl_api_key:
            print(f"{Colors.RED}⚠️ Warning: FIRECRAWL_API_KEY not found in environment variables{Colors.RESET}")
    
    def get_profile_activity_data(self, username: str) -> Dict[str, Any]:
        """Extract GitHub profile activity data including commit history and contributions using Firecrawl."""
        print(f"{Colors.YELLOW}👤 Extracting profile activity for {username}...{Colors.RESET}")
        
        profile_urls = [
            f"https://github.com/{username}",
            f"https://github.com/{username}?tab=overview"
        ]
        
        prompt = f"""Analyze the GitHub profile activity for {username} and extract:
        
        1. CONTRIBUTION ACTIVITY:
        - Total contributions in the last year
        - Contribution streak information
        - Most active months/periods
        - Contribution calendar patterns
        
        2. COMMIT ACTIVITY:
        - Recent commit frequency
        - Commit patterns and consistency
        - Languages used in commits
        
        3. PROFILE INFORMATION:
        - Bio/description
        - Location
        - Company/organization
        - Website links
        - Follower/following counts
        - Account creation date
        
        4. ACTIVITY OVERVIEW:
        - Repository count (public)
        - Starred repositories count
        - Organization memberships (if visible)
        - Recent activity patterns
        
        Provide a comprehensive overview of the developer's GitHub activity and engagement patterns.
        """
        
        data = extract_data(profile_urls, prompt, self.firecrawl_api_key)
        
        if data:
            return {
                "type": "profile_activity",
                "username": username,
                "profile_url": f"https://github.com/{username}",
                "activity_data": data,
                "extraction_method": "firecrawl"
            }
        else:
            return {"error": f"Failed to extract profile activity for {username}"}

    def get_repositories_data(self, username: str) -> Dict[str, Any]:
        """Extract all repository information using Firecrawl."""
        print(f"{Colors.YELLOW}📁 Extracting repositories for {username}...{Colors.RESET}")
        
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
        
        data = extract_data(repos_urls, prompt, self.firecrawl_api_key)
        
        if data:
            # Parse repository URLs from the extracted data
            repository_urls = self._parse_repository_urls(data, username)
            return {
                "type": "user_profile",
                "url": f"https://github.com/{username}",
                "username": username,
                "repository_urls": repository_urls,
                "extraction_method": "firecrawl",
                "raw_data": data
            }
        else:
            return {"error": f"Failed to extract repositories for {username}"}
    
    def _parse_repository_urls(self, data: Any, username: str) -> List[str]:
        """Parse repository URLs from Firecrawl extracted data."""
        repository_urls = []
        
        try:
            # Convert data to string if it's not already
            data_str = str(data) if data else ""
            
            # Limit data size to prevent LLM overload (keep first 2KB for analysis)  
            MAX_DATA_SIZE = 2000
            if len(data_str) > MAX_DATA_SIZE:
                print(f"{Colors.YELLOW}   • Large data detected ({len(data_str)} chars), truncating to {MAX_DATA_SIZE} chars{Colors.RESET}")
                data_str = data_str[:MAX_DATA_SIZE]
            
            # Define false positives list once
            false_positives = ['name', 'type', 'url', 'description', 'language', 'clone', 'git', 'main', 'master', 'branch', 'commit', 'push', 'pull', 'origin', 'repository', 'github', 'repo', 'file', 'src', 'public', 'private', 'fork', 'original', 'homepage', 'website']
            
            # Multiple patterns to find GitHub repository URLs (optimized for Firecrawl output)
            repo_patterns = [
                # Direct GitHub URLs
                rf'https://github\.com/{username}/([a-zA-Z0-9_.-]+)',
                rf'github\.com/{username}/([a-zA-Z0-9_.-]+)',
                # Repository names from API responses
                rf'"name":\s*"([a-zA-Z0-9_.-]+)"',
                rf"'name':\s*'([a-zA-Z0-9_.-]+)'",
                # From repository listings
                rf'Repository:\s*([a-zA-Z0-9_.-]+)',
                rf'repo.*?:\s*([a-zA-Z0-9_.-]+)',
                # From file paths
                rf'{username}/([a-zA-Z0-9_.-]+)/',
                # From project descriptions
                rf'Project:\s*([a-zA-Z0-9_.-]+)',
            ]
            
            for pattern in repo_patterns:
                matches = re.findall(pattern, data_str, re.IGNORECASE | re.MULTILINE)
                print(f"   • Pattern '{pattern}' found {len(matches)} matches")
                
                for match in matches:
                    # Handle different match types
                    if isinstance(match, tuple):
                        repo_name = match[0] if match[0] else match[1] if len(match) > 1 else ""
                    else:
                        repo_name = match
                    
                    # Clean up the match and extract repo name
                    if isinstance(match, tuple):
                        repo_name = match[0] if match[0] else (match[1] if len(match) > 1 else "")
                    else:
                        repo_name = match
                    
                    # Skip if repo name is empty or too short
                    if not repo_name or len(repo_name.strip()) < 2:
                        continue
                    
                    # Filter out common false positives
                    if repo_name.lower() in false_positives:
                        continue
                    
                    # Clean repo name
                    repo_name = repo_name.strip()
                    
                    # Build URL
                    if repo_name.startswith('https://github.com/'):
                        url = repo_name
                    elif repo_name.startswith('github.com/'):
                        url = 'https://' + repo_name
                    elif '/' in repo_name and f'{username}/' in repo_name:
                        url = f'https://github.com/{repo_name}'
                    else:
                        url = f'https://github.com/{username}/{repo_name}'
                    
                    # Filter out non-repository URLs and duplicates
                    if (url not in repository_urls and 
                        not any(exclude in url.lower() for exclude in ['.git', '/issues', '/pulls', '/wiki', '/releases', '/tree', '/blob', '/settings', '/actions']) and
                        len(repo_name) > 1):
                        repository_urls.append(url)
                        print(f"   • Added repository: {url}")
            
            # Fallback: Parse repository names from text patterns
            if not repository_urls:
                print(f"   • No URLs found, trying text parsing...")
                # Look for common repository names in content (dynamic-ui, content-hub, etc.)
                repo_name_patterns = [
                    rf'([a-zA-Z0-9_-]+(?:-[a-zA-Z0-9_-]+)+)',  # Multi-word repo names with dashes
                    rf'([a-zA-Z][a-zA-Z0-9_-]{{3,20}})',  # Reasonable repo names
                ]
                
                for pattern in repo_name_patterns:
                    matches = re.findall(pattern, data_str, re.IGNORECASE)
                    for match in matches:
                        repo_name = match.strip()
                        
                        # Enhanced filtering for fallback
                        if (len(repo_name) > 2 and len(repo_name) < 50 and  # Reasonable length
                            repo_name.lower() not in false_positives and  # Use same false positives list
                            not repo_name.lower().startswith(('http', 'www', 'git', 'com')) and  # Not a URL fragment
                            '-' in repo_name or '_' in repo_name):  # Likely to be a repo name
                            
                            url = f'https://github.com/{username}/{repo_name}'
                            if url not in repository_urls:
                                repository_urls.append(url)
                                print(f"   • Added fallback repository: {url}")
            
            print(f"   • Found {len(repository_urls)} repositories for {username}")
            return repository_urls[:10]  # Limit to first 10 repositories
            
        except Exception as e:
            print(f"{Colors.RED}Error parsing repository URLs: {e}{Colors.RESET}")
            return []
    
    def verify_repository_url(self, repo_url: str) -> Dict[str, Any]:
        """Verify if a repository URL is valid by extracting basic info."""
        try:
            # Just return the URL as valid - we'll use Gitingest for detailed content
            url_parts = repo_url.replace('https://github.com/', '').split('/')
            if len(url_parts) >= 2:
                return {
                    "type": "repository",
                    "url": repo_url,
                    "owner": url_parts[0],
                    "name": url_parts[1],
                    "verification_method": "firecrawl_url_check"
                }
            else:
                return {"error": "Invalid repository URL format"}
        except Exception as e:
            return {"error": f"Repository verification failed: {str(e)}"}

def match_resume_projects_with_repos(resume_text: str, repository_urls: List[str]) -> List[str]:
    """Match resume projects with GitHub repository URLs and return only matching repositories."""
    print(f"\n🔍 Matching resume projects with {len(repository_urls)} repositories...")
    
    # Extract project names and keywords from resume
    resume_lower = resume_text.lower()
    
    # Common project keywords and technologies to look for
    project_keywords = []
    
    # Extract potential project names (look for patterns like "built", "developed", "created")
    import re
    project_patterns = [
        r'(?:built|developed|created|designed|implemented)\s+(?:a\s+)?([a-zA-Z0-9\s\-_]+?)(?:\s+(?:using|with|in|for|that|which))',
        r'project[:\s]+([a-zA-Z0-9\s\-_]+?)(?:\s+[-–—]|\.|,|;|\n)',
        r'([a-zA-Z0-9\-_]+)\s*[:]\s*(?:an?\s+)?(?:ai|platform|tool|application|system|website|app)',
    ]
    
    for pattern in project_patterns:
        matches = re.findall(pattern, resume_text, re.IGNORECASE)
        for match in matches:
            clean_match = re.sub(r'[^\w\s\-]', '', match.strip())
            if len(clean_match) > 2 and len(clean_match) < 50:
                project_keywords.append(clean_match.lower())
    
    # Add specific known project names from the resume
    known_projects = [
        'text2story', 'content-hub', 'contenthub', 'devdocs', 'dev-docs', 
        'space-exploration', 'nasa', 'mathemagica', 'dynamic-ui', 'superhero',
        'mcp', 'ai-agents', 'pulumi', 'insta', 'dm'
    ]
    project_keywords.extend(known_projects)
    
    # Remove duplicates and empty strings
    project_keywords = list(set([kw for kw in project_keywords if kw.strip()]))
    
    print(f"   • Extracted project keywords: {project_keywords[:10]}...")  # Show first 10
    
    # Match repositories with project keywords
    matched_repos = []
    
    for repo_url in repository_urls:
        repo_name = repo_url.split('/')[-1].lower()
        repo_matched = False
        
        # Check if repo name matches any project keyword
        for keyword in project_keywords:
            keyword_parts = keyword.split()
            
            # Direct name match
            if keyword in repo_name or repo_name in keyword:
                matched_repos.append(repo_url)
                print(f"   ✅ MATCHED: {repo_url} (keyword: '{keyword}')")
                repo_matched = True
                break
            
            # Partial word matches for multi-word keywords
            if len(keyword_parts) > 1:
                if all(part in repo_name for part in keyword_parts):
                    matched_repos.append(repo_url)
                    print(f"   ✅ MATCHED: {repo_url} (multi-word: '{keyword}')")
                    repo_matched = True
                    break
        
        if not repo_matched:
            print(f"   ❌ SKIPPED: {repo_url} (no match found)")
    
    print(f"\n📊 Matching Results:")
    print(f"   • Total repositories: {len(repository_urls)}")
    print(f"   • Matched repositories: {len(matched_repos)}")
    print(f"   • Repositories to analyze: {len(matched_repos)}")
    
    return matched_repos

class GitHubContentExtractor:
    """Uses Gitingest ONLY for detailed repository content extraction.
    
    This class specifically handles:
    - Extracting README.md files and documentation
    - Parsing file structures and code organization
    - Getting package.json, requirements.txt, and dependency files
    - Analyzing actual project code and implementation
    
    Note: Repository discovery is handled separately by FirecrawlGitHubExtractor using Firecrawl.
    """
    
    def __init__(self):
        self.max_content_size = 3000  # 3KB limit for content per repository
    
    def extract_repository_content(self, repo_url: str) -> Dict[str, Any]:
        """Extract detailed text content from a GitHub repository using gitingest."""
        try:
            print(f"🔍 Extracting content from: {repo_url}")
            
            # Use thread pool to run gitingest in a separate thread to avoid asyncio conflicts
            def run_ingest():
                return ingest(repo_url, max_file_size=5*1024*1024)  # 5MB limit
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(run_ingest)
                summary, tree, content = future.result(timeout=120)  # 2 minute timeout
            
            # Limit content size to avoid overwhelming the LLM
            if len(content) > self.max_content_size:
                content = content[:self.max_content_size] + f"\n\n[Content truncated - original size: {len(content)} characters]"
            
            result = {
                "type": "repository_content",
                "url": repo_url,
                "summary": summary,
                "file_tree": tree,
                "content": content,
                "content_size": len(content),
                "extraction_status": "success"
            }
            
            print(f"✅ Content extracted: {len(content)} characters from {repo_url}")
            return result
            
        except concurrent.futures.TimeoutError:
            print(f"❌ Timeout extracting content from {repo_url}")
            return {
                "type": "repository_content",
                "url": repo_url,
                "summary": None,
                "file_tree": None,
                "content": None,
                "content_size": 0,
                "extraction_status": "failed",
                "error": "Extraction timeout after 2 minutes"
            }
        except Exception as e:
            print(f"❌ Failed to extract content from {repo_url}: {str(e)}")
            return {
                "type": "repository_content",
                "url": repo_url,
                "summary": None,
                "file_tree": None,
                "content": None,
                "content_size": 0,
                "extraction_status": "failed",
                "error": str(e)
            }
    
    def extract_multiple_repositories(self, repo_urls: List[str]) -> List[Dict[str, Any]]:
        """Extract content from multiple repositories."""
        results = []
        for repo_url in repo_urls:
            result = self.extract_repository_content(repo_url)
            results.append(result)
        return results


def create_resume_analysis_crew(resume_text: str, job_description: str, github_urls: List[str]) -> tuple[Crew, List[Task]]:
    """Create the first crew for resume analysis and GitHub URL extraction."""
    
    # Initialize LLM
    llm = LLM(
        model="groq/llama-3.3-70b-versatile",
        temperature=0.1
    )
    
    # PDF Parser Agent
    pdf_parser_agent = Agent(
        role="Senior PDF Resume Parser",
        goal="Extract and structure text content from PDF resume files with high accuracy",
        backstory="""You are an expert document parser specialized in extracting text from PDF resumes. 
        You have extensive experience in handling various PDF formats and layouts, ensuring all relevant 
        information is captured including contact details, experience, skills, education, and projects.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Resume Analyzer Agent  
    resume_analyzer_agent = Agent(
        role="Expert Resume Content Analyst",
        goal="Analyze resume content to extract key skills, experience, education, and qualifications",
        backstory="""You are a senior HR professional and resume analysis expert with 15+ years of experience 
        in talent acquisition. You excel at identifying key skills, evaluating experience levels, and 
        understanding career progression patterns from resume content.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Job Matcher Agent
    job_matcher_agent = Agent(
        role="AI-Powered Job Matching Specialist", 
        goal="Match resume qualifications against job descriptions and provide detailed scoring",
        backstory="""You are an advanced AI recruitment specialist with expertise in semantic job matching. 
        You analyze job requirements against candidate qualifications, providing accurate percentage scores 
        and detailed explanations for hiring decisions.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # GitHub URL Extractor Agent
    github_extractor_agent = Agent(
        role="Technical Project URL Extractor",
        goal="Extract and validate GitHub repository URLs and project links from resume content",
        backstory="""You are a technical recruitment specialist focused on identifying and extracting 
        GitHub profiles, repository links, and project URLs from resumes. You understand various ways 
        developers mention their GitHub presence and can identify both direct and indirect references.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Define tasks for resume analysis crew
    pdf_parsing_task = Task(
        description=f"""
        Parse and extract structured information from the following resume text:
        
        RESUME TEXT:
        {resume_text}
        
        Extract the following information:
        1. Contact information (name, email, phone, etc.)
        2. Work experience with dates and responsibilities
        3. Education details
        4. Technical skills and competencies
        5. Projects and achievements
        6. Any GitHub or portfolio links mentioned
        
        Format the output as a structured summary with clear sections.
        """,
        expected_output="A structured summary of the resume with all key information organized into clear sections.",
        agent=pdf_parser_agent
    )
    
    resume_analysis_task = Task(
        description=f"""
        Analyze the parsed resume content and evaluate the candidate's qualifications:
        
        PARSED RESUME: [Will be provided by the PDF parsing task]
        
        Analyze:
        1. Years of experience and career progression
        2. Technical skill proficiency levels
        3. Leadership and project management experience
        4. Education background relevance
        5. Notable achievements and projects
        6. Areas of expertise and specialization
        
        Provide a comprehensive analysis of the candidate's strengths and areas for improvement.
        """,
        expected_output="A detailed analysis of the candidate's qualifications, experience level, and key strengths.",
        agent=resume_analyzer_agent,
        context=[pdf_parsing_task]
    )
    
    job_matching_task = Task(
        description=f"""
        Compare the analyzed resume against the following job description and provide a detailed matching score:
        
        JOB DESCRIPTION:
        {job_description}
        
        RESUME ANALYSIS: [Will be provided by the resume analysis task]
        
        Evaluate:
        1. Technical skills match (weight: 30%)
        2. Experience level match (weight: 25%)
        3. Industry/domain experience (weight: 20%)
        4. Education requirements (weight: 15%)
        5. Additional qualifications (weight: 10%)
        
        Provide:
        - Overall matching percentage score (0-100%)
        - Detailed breakdown by category
        - Specific strengths and gaps
        - Hiring recommendation
        
        IMPORTANT: The overall score must be a clear numerical percentage.
        """,
        expected_output="A detailed job matching report with a clear percentage score and breakdown of how well the candidate matches the job requirements.",
        agent=job_matcher_agent,
        context=[resume_analysis_task]
    )
    
    github_extraction_task = Task(
        description=f"""
        Extract and validate all GitHub repository URLs and project links from the resume:
        
        RESUME TEXT:
        {resume_text}
        
        FOUND GITHUB URLS:
        {github_urls}
        
        Tasks:
        1. Identify all GitHub repository URLs mentioned
        2. Extract project names and descriptions if available
        3. Categorize URLs (profile, specific repositories, etc.)
        4. Validate URL formats and accessibility
        5. List all projects that should be verified
        
        Provide a structured list of GitHub repositories that need verification.
        """,
        expected_output="A structured list of GitHub repositories with project details that need to be verified for authenticity.",
        agent=github_extractor_agent,
        context=[pdf_parsing_task]
    )
    
    tasks = [pdf_parsing_task, resume_analysis_task, job_matching_task, github_extraction_task]
    
    crew = Crew(
        agents=[pdf_parser_agent, resume_analyzer_agent, job_matcher_agent, github_extractor_agent],
        tasks=tasks,
        verbose=True
    )
    
    return crew, tasks

def create_github_verification_crew(combined_repo_data: Dict, matching_score: float, resume_text: str) -> tuple[Crew, List[Task]]:
    """Create the second crew for GitHub repository verification."""
    
    # Initialize LLM
    llm = LLM(
        model="groq/llama-3.3-70b-versatile", 
        temperature=0.1
    )
    
    # Firecrawl GitHub Agent
    github_api_agent = Agent(
        role="Firecrawl GitHub Research Specialist",
        goal="Provide detailed repository analysis using web-scraped data including README content, code structure, and project authenticity",
        backstory="""You are a senior developer relations engineer with 8+ years of experience analyzing GitHub profiles 
        using comprehensive web-scraped data from Firecrawl and detailed repository content from Gitingest. 
        You understand that legitimate developers often:
        - Work on personal projects with few stars (most repos have <10 stars)
        - Have private company repositories not visible on GitHub
        - Use different naming conventions for projects
        - Work solo on personal projects (which is completely normal)
        - Focus on a few quality projects rather than many mediocre ones
        
        You excel at analyzing detailed repository content including file structures, README quality, 
        dependency files, and actual code to determine project authenticity. You look for ACTUAL red flags like: 
        copied tutorials without attribution, inconsistent coding styles, bulk uploads without development history, 
        or claiming work on projects they only forked/starred.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Repository Analyzer Agent
    repo_analyzer_agent = Agent(
        role="Technical Project Code Reviewer",
        goal="Assess project authenticity by analyzing code quality, commit patterns, and documentation depth",
        backstory="""You are a senior software architect with 12+ years of experience in both startups and big tech. 
        You understand that authentic projects show:
        - Consistent coding style and patterns (even if not perfect)
        - Gradual feature development over time
        - Meaningful commit messages and logical progression
        - README files that explain the actual project purpose
        - Code that matches claimed skill level in resume
        
        You can spot FAKE projects by:
        - Tutorial code passed off as original work
        - Sudden large commits without development history  
        - Generic/template README files
        - Projects way beyond claimed skill level (copying advanced work)
        - Inconsistent coding styles suggesting copy-paste from multiple sources
        - Missing key files that real projects would have""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Project Validator Agent
    project_validator_agent = Agent(
        role="Project Authenticity Verification Expert",
        goal="Score candidate credibility based on realistic developer patterns and genuine red flags",
        backstory="""You are a technical hiring specialist who has reviewed 1000+ developer portfolios. 
        You know that REAL developers often have:
        - 1-5 quality personal projects (not dozens)
        - Mix of learning projects and serious work
        - Some incomplete or experimental repos (normal!)
        - Private work repositories not shown publicly
        - Projects that evolve in skill level over time
        
        You focus on GENUINE red flags for scoring:
        - Claiming credit for work they didn't do
        - Inconsistent technical progression
        - Projects that don't match their described experience
        - Evidence of bulk-copying code without understanding
        
        You DON'T penalize normal developer behavior like:
        - Low star counts (most repos have few stars)
        - Solo work (personal projects are often solo)
        - Some projects missing from GitHub (could be private/work related)
        - Recent account activity (everyone starts somewhere)""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Report Generator Agent
    report_generator_agent = Agent(
        role="Technical Verification Report Writer",
        goal="Create comprehensive verification reports with clear findings and recommendations",
        backstory="""You are a technical documentation specialist who creates detailed verification reports 
        for hiring managers. You excel at summarizing complex technical findings into clear, actionable 
        insights for recruitment decisions.""",
        verbose=True,
        allow_delegation=False,
        llm=llm
    )
    
    # Define tasks for GitHub verification crew with project matching
    project_matching_task = Task(
        description=f"""
        COMPREHENSIVE PROJECT MATCHING WITH DETAILED REPOSITORY CONTENT ANALYSIS
        
        RESUME TEXT:
        {resume_text}
        
        GITHUB METADATA:
        {json.dumps(combined_repo_data.get('metadata', []), indent=2)}
        
        DETAILED REPOSITORY CONTENT (from Gitingest):
        {json.dumps(combined_repo_data.get('content', []), indent=2)}
        
        COMPREHENSIVE ANALYSIS REQUIREMENTS:
        
        1. PROJECT EXTRACTION FROM RESUME:
           - List ALL projects mentioned in resume with descriptions
           - Note technologies/languages mentioned for each project
           - Identify any GitHub links or repository names mentioned
        
                 2. GITHUB REPOSITORY INVENTORY WITH DETAILED CONTENT:
            - List ALL repositories found in the GitHub profile with metadata
            - For repositories with extracted content, analyze:
              * README.md content and quality 
              * File structure and project organization
              * Technology stack used (package.json, requirements.txt, etc.)
              * Code quality and complexity indicators
              * Documentation completeness
        
         3. COMPREHENSIVE PROJECT MATCHING ANALYSIS:
            - Match resume projects with GitHub repos using:
              * Repository names and descriptions
              * README content analysis
              * Technology stack verification
              * Project features listed in documentation
            - For MATCHED projects: Provide detailed verification including:
              * Quote specific README content that demonstrates project authenticity
              * Verify claimed technologies against actual package.json/requirements files
              * Analyze code structure complexity vs claimed experience level
              * Evidence of real functionality (components, modules, features)
            - For UNMATCHED resume projects: Acknowledge realistic reasons:
              * Private repositories (common for work projects)
              * University/course projects not on personal GitHub
              * Team projects under different accounts
              * Projects on other platforms or removed repositories
        
         4. DETAILED AUTHENTICITY VERIFICATION:
            - Quote specific README sections that show project understanding
            - Analyze file structure for realistic development patterns
            - Verify technology claims against actual dependencies
            - Look for evidence of original work vs copied tutorials
            - Assess project complexity matching claimed skill level
        
        IMPORTANT: Be realistic about project portfolios. Not every project needs to be on GitHub!
        """,
        expected_output="A comprehensive project matching report with detailed repository content analysis, specific README quotes, technology verification, and realistic portfolio assessment.",
        agent=github_api_agent
    )
    
    authenticity_analysis_task = Task(
        description=f"""
        AUTHENTICITY ASSESSMENT BASED ON REALISTIC DEVELOPER PATTERNS
        
        PROJECT MATCHING RESULTS: [Will be provided by the project matching task]
        
        AUTHENTICITY ANALYSIS FRAMEWORK:
        
        1. GENUINE DEVELOPMENT INDICATORS:
           - Consistent coding style and logical project structure
           - Gradual development history (commits over time, not bulk uploads)
           - README files that show understanding of the project
           - Code complexity that matches claimed experience level
           - Evidence of problem-solving and iterative development
           - Meaningful commit messages showing thought process
        
        2. RED FLAGS FOR FAKE/COPIED WORK:
           - Sudden appearance of complex projects without development history
           - Code that's significantly beyond claimed skill level
           - Generic README files or copied tutorial documentation
           - Inconsistent coding styles within projects (suggesting copy-paste)
           - Projects identical to popular tutorials without attribution
           - Repository creation dates that don't align with claimed experience
           - Missing core files that real projects would have
        
        3. NORMAL DEVELOPER BEHAVIOR (NOT RED FLAGS):
           - Few stars/forks (most personal projects have minimal engagement)
           - Solo development (personal projects are typically solo)
           - Some incomplete or experimental repositories
           - Mix of project quality levels (learning progression is normal)
           - Gaps in GitHub activity (work projects often private)
           - Projects missing from GitHub (could be private, work-related, or on other platforms)
        
        4. DETAILED EVIDENCE ANALYSIS:
           - Quote specific README content that shows understanding
           - Identify commit patterns that indicate genuine development
           - Note any code quality indicators (good or concerning)
           - Highlight technology choices and their appropriateness
        
        CLASSIFICATION CRITERIA:
        - GENUINE: Clear evidence of authentic development work with logical progression
        - QUESTIONABLE: Some concerns but could be legitimate (needs interview verification)
        - FAKE: Strong evidence of copied/fabricated work or false claims
        
        PROVIDE DETAILED EVIDENCE with specific examples from repositories.
        """,
        expected_output="A thorough authenticity assessment with specific evidence, focusing on genuine red flags while acknowledging normal developer patterns.",
        agent=repo_analyzer_agent,
        context=[project_matching_task]
    )
    
    credibility_scoring_task = Task(
        description=f"""
        CRITICAL TASK: Score the candidate's overall GitHub credibility and genuineness.
        
        AUTHENTICITY ANALYSIS: [Will be provided by the authenticity analysis task]
        
        REALISTIC SCORING CRITERIA (0-100 scale):
        
        1. Project-Resume Alignment (30 points):
           - 50%+ of resume projects have GitHub evidence: 30 points
           - 25-49% of projects match with valid reasons for missing projects: 20 points
           - <25% match but has quality repositories: 10 points
           - No meaningful matches: 0 points
        
        2. Code Authenticity (30 points):
           - Clear evidence of original work with proper development history: 30 points
           - Mostly authentic with some tutorial/learning projects: 20 points
           - Mixed signals requiring further investigation: 10 points
           - Clear evidence of copied/fake work: 0 points
        
        3. Technical Competency Match (25 points):
           - Repository complexity and technologies align well with resume claims: 25 points
           - Generally consistent with claimed skills: 15 points
           - Some inconsistencies but explainable: 10 points
           - Major mismatch between claims and actual work: 0 points
        
        4. Development Professionalism (15 points):
           - Good documentation, logical structure, meaningful commits: 15 points
           - Decent organization with room for improvement: 10 points
           - Basic but functional projects: 5 points
           - Poor quality or concerning patterns: 0 points
        
        FINAL ASSESSMENT:
        - 80-100: HIGHLY CREDIBLE candidate
        - 60-79: MODERATELY CREDIBLE candidate  
        - 40-59: QUESTIONABLE candidate
        - 0-39: NOT CREDIBLE candidate
        
        Provide numerical score and clear hiring recommendation.
        """,
        expected_output="A numerical credibility score (0-100) with detailed breakdown and clear hiring recommendation.",
        agent=project_validator_agent,
        context=[authenticity_analysis_task]
    )
    
    verification_report_task = Task(
        description=f"""
        Create a comprehensive hiring verification report:
        
        CREDIBILITY SCORING: [Will be provided by the credibility scoring task]
        MATCHING SCORE: {matching_score}%
        
        REPORT STRUCTURE:
        1. EXECUTIVE SUMMARY:
           - Overall credibility score
           - Key findings summary
           - Final hiring recommendation
        
        2. PROJECT MATCHING ANALYSIS:
           - Which resume projects match GitHub repos
           - Which projects are missing from GitHub
           - Evidence of project authenticity
        
        3. REPOSITORY ANALYSIS:
           - Quality assessment of analyzed repos
           - Technical skill validation
           - Development pattern analysis
        
        4. RED FLAGS & CONCERNS:
           - Any evidence of fake/copied projects
           - Inconsistencies between resume and GitHub
           - Missing or suspicious repositories
        
        5. HIRING RECOMMENDATION:
           - HIRE: Strong evidence of genuine skills
           - INVESTIGATE: Mixed signals, requires interview focus
           - REJECT: Clear evidence of misrepresentation
        
        Make this report actionable for hiring managers.
        """,
        expected_output="A comprehensive hiring verification report with clear findings, analysis, and actionable hiring recommendation.",
        agent=report_generator_agent,
        context=[credibility_scoring_task]
    )
    
    tasks = [project_matching_task, authenticity_analysis_task, credibility_scoring_task, verification_report_task]
    
    crew = Crew(
        agents=[github_api_agent, repo_analyzer_agent, project_validator_agent, report_generator_agent],
        tasks=tasks,
        verbose=True
    )
    
    return crew, tasks

def main():
    """Main function to run the multi-crew PDF resume analyzer workflow.
    
    OPTIMIZED DUAL-TOOL APPROACH:
    - Phase 1: Resume Analysis Crew (PDF parsing, skill analysis, job matching)
    - Phase 2: GitHub Verification Crew (if score > 65%)
      * Firecrawl: GitHub profile discovery and repository list extraction
      * Project Matching: Smart filtering to analyze only resume-relevant repositories
      * Gitingest: Detailed content extraction from matched repositories only
      
    This approach maximizes efficiency by using each tool for its strengths while avoiding
    unnecessary analysis of unrelated repositories.
    """
    
    print("🚀 Starting Multi-Crew PDF Resume Analyzer Workflow")
    print("=" * 60)
    
    # Initialize processors
    pdf_processor = PDFResumeProcessor()
    github_extractor = FirecrawlGitHubExtractor()
    github_content_extractor = GitHubContentExtractor()
    
    # Using the actual PDF file provided by user
    resume_pdf_path = "yash.pdf"
    
    # GitHub profile URL provided by user
    github_profile_url = "https://github.com/yashwanth-3000"
    
    # User's top 1-3 best project repository URLs
    best_project_repos = [
        "https://github.com/yashwanth-3000/content--hub",
        "https://github.com/yashwanth-3000/Dev-Docs-Local", 
        "https://github.com/yashwanth-3000/dynamic-ui"
    ]
    
    # Sample job description
    job_description = """
    Senior Software Engineer Position
    
    Requirements:
    - 5+ years of software development experience
    - Proficiency in Python, JavaScript, React
    - Experience with cloud platforms (AWS, Azure, GCP)
    - Strong background in full-stack web development
    - Experience with databases (PostgreSQL, MongoDB)
    - Knowledge of containerization (Docker, Kubernetes)
    - Strong problem-solving and communication skills
    - Bachelor's degree in Computer Science or related field
    
    Preferred:
    - Experience with machine learning frameworks
    - Open source contributions
    - Leadership experience
    - DevOps and CI/CD experience
    """
    
    # Create output directory
    output_dir = Path("pdf_analysis_output")
    output_dir.mkdir(exist_ok=True)
    
    # Check if resume file exists and extract text
    if not Path(resume_pdf_path).exists():
        print(f"❌ PDF resume file not found at {resume_pdf_path}")
        print("💡 Please ensure the PDF file is in the correct location.")
        return
    else:
        # Extract text from actual PDF
        print(f"📄 Processing PDF resume: {resume_pdf_path}")
        resume_text = pdf_processor.extract_text_from_pdf(resume_pdf_path)
        
        if not resume_text:
            print("❌ Failed to extract text from PDF")
            return
    
    print(f"✅ Resume text extracted ({len(resume_text)} characters)")
    
    # Verify repository ownership
    username = github_profile_url.split('/')[-1]
    verified_repos = []
    invalid_repos = []
    
    print(f"🔗 GitHub Profile: {github_profile_url}")
    print(f"👤 Username: {username}")
    print(f"📦 Best Project Repositories to Analyze: {len(best_project_repos)}")
    
    # Verify that all repositories belong to the same user
    for repo_url in best_project_repos:
        repo_parts = repo_url.replace('https://github.com/', '').split('/')
        if len(repo_parts) >= 2:
            repo_owner = repo_parts[0]
            repo_name = repo_parts[1]
            if repo_owner == username:
                verified_repos.append(repo_url)
                print(f"   ✅ {repo_name} - Verified ownership")
            else:
                invalid_repos.append(repo_url)
                print(f"   ❌ {repo_name} - Owner mismatch ({repo_owner} != {username})")
        else:
            invalid_repos.append(repo_url)
            print(f"   ❌ Invalid repository URL: {repo_url}")
    
    if invalid_repos:
        print(f"\n⚠️ Warning: {len(invalid_repos)} repositories don't belong to {username}")
        print("Only analyzing verified repositories...")
    
    print(f"\n📊 Repository Verification Summary:")
    print(f"   • Valid repositories: {len(verified_repos)}")
    print(f"   • Invalid repositories: {len(invalid_repos)}")
    
    # =================================================================
    # CREW 1: RESUME ANALYSIS CREW
    # =================================================================
    print("\n" + "="*60)
    print("🔍 PHASE 1: RESUME ANALYSIS CREW")
    print("="*60)
    
    resume_crew, resume_tasks = create_resume_analysis_crew(resume_text, job_description, [github_profile_url])
    pdf_parsing_task, resume_analysis_task, job_matching_task, github_extraction_task = resume_tasks
    
    # Execute the resume analysis crew
    print("🔄 Executing Resume Analysis Tasks...")
    resume_results = resume_crew.kickoff()
    
    # Extract the matching score from job matching results
    job_matching_result = job_matching_task.output.raw
    score_match = re.search(r'(\d+(?:\.\d+)?)%', job_matching_result)
    matching_score = float(score_match.group(1)) if score_match else 0
    
    print(f"\n📊 RESUME ANALYSIS RESULTS:")
    print(f"   • Matching Score: {matching_score}%")
    print(f"   • GitHub Profile: {github_profile_url}")
    print(f"   • Verified Repositories: {len(verified_repos)}")
    
    # =================================================================
    # CONDITIONAL LOGIC: PROCEED TO CREW 2 IF SCORE > 65%
    # =================================================================
    print(f"\n🤔 Evaluating score threshold (65%)...")
    
    if matching_score > 65:
        print(f"✅ Score {matching_score}% > 65% - Proceeding to GitHub Verification")
        
        # =================================================================
        # CREW 2: GITHUB VERIFICATION CREW - FOCUSED DUAL-TOOL APPROACH
        # =================================================================
        print("\n" + "="*60)
        print("🔍 PHASE 2: GITHUB VERIFICATION CREW")
        print("🌐 Firecrawl: Profile analysis (commits, contributions)")
        print("📦 Gitingest: Specific repository analysis (user's best projects)")
        print("="*60)
        
        if verified_repos:
            # Step 1: Use Firecrawl to analyze GitHub profile for commit history and contributions
            print(f"🌐 Analyzing GitHub profile with Firecrawl: {github_profile_url}")
            profile_data = github_extractor.get_profile_activity_data(username)
            
            # Step 2: Use Gitingest to analyze only the user's specified best repositories
            print(f"\n📦 Analyzing {len(verified_repos)} user-specified repositories with Gitingest...")
            repo_content_data = []
            
            for repo_url in verified_repos:
                repo_name = repo_url.split('/')[-1]
                print(f"   🔧 Gitingest analyzing: {repo_name}")
                content_data = github_content_extractor.extract_repository_content(repo_url)
                repo_content_data.append(content_data)
            
            combined_data = {
                "profile_activity": profile_data,
                "content": repo_content_data,
                "repository_count": len(verified_repos),
                "specified_repos": len(best_project_repos),
                "verified_repos": len(verified_repos),
                "invalid_repos": len(invalid_repos)
            }

        else:
            print(f"⚠️ No verified repositories to analyze")
            # Still analyze the profile even without repositories
            print(f"🌐 Analyzing GitHub profile with Firecrawl: {github_profile_url}")
            profile_data = github_extractor.get_profile_activity_data(username)
            
            combined_data = {
                "profile_activity": profile_data,
                "content": [],
                "repository_count": 0,
                "specified_repos": len(best_project_repos),
                "verified_repos": 0,
                "invalid_repos": len(invalid_repos),
                "reason": "No verified repositories provided"
            }
            
        if combined_data["repository_count"] > 0 or combined_data.get("profile_activity"):
            # Run GitHub verification crew if we have repositories or profile data
            github_crew, github_tasks = create_github_verification_crew(combined_data, matching_score, resume_text)
            project_matching_task, authenticity_analysis_task, credibility_scoring_task, verification_report_task = github_tasks
            
            # Execute the GitHub verification crew
            print("🔄 Executing GitHub Verification Tasks...")
            github_results = github_crew.kickoff()
        else:
            print("⚠️ No repositories or profile data - skipping GitHub verification crew execution")
            # Create dummy task outputs for consistency
            class DummyTask:
                def __init__(self, message):
                    self.output = type('obj', (object,), {'raw': message})
            
            project_matching_task = DummyTask("No repositories or profile data to analyze")
            authenticity_analysis_task = DummyTask("No repositories or profile data to analyze") 
            credibility_scoring_task = DummyTask("No repositories or profile data to analyze")
            verification_report_task = DummyTask("No repositories or profile data to analyze")
        
        # Save comprehensive results
        final_results = {
            "resume_analysis": {
                "matching_score": matching_score,
                "pdf_parsing": pdf_parsing_task.output.raw,
                "resume_analysis": resume_analysis_task.output.raw,
                "job_matching": job_matching_task.output.raw,
                "github_extraction": github_extraction_task.output.raw
            },
            "github_verification": {
                "triggered": True,
                "specified_repos": combined_data.get("specified_repos", 0),
                "verified_repos": combined_data.get("verified_repos", 0),
                "invalid_repos": combined_data.get("invalid_repos", 0),
                "repositories_analyzed": combined_data["repository_count"],
                "repository_content": combined_data["content"],
                "profile_activity": combined_data.get("profile_activity", {}),
                "project_matching": project_matching_task.output.raw,
                "authenticity_analysis": authenticity_analysis_task.output.raw,
                "credibility_scoring": credibility_scoring_task.output.raw,
                "verification_report": verification_report_task.output.raw
            }
        }
        
        print("\n🎉 GITHUB VERIFICATION COMPLETED!")
    else:
        print(f"❌ Score {matching_score}% ≤ 65% - Skipping GitHub Verification")
        final_results = {
            "resume_analysis": {
                "matching_score": matching_score,
                "pdf_parsing": pdf_parsing_task.output.raw,
                "resume_analysis": resume_analysis_task.output.raw,
                "job_matching": job_matching_task.output.raw,
                "github_extraction": github_extraction_task.output.raw
            },
            "github_verification": {
                "triggered": False,
                "reason": f"Matching score {matching_score}% below threshold of 65%"
            }
        }
    
    # =================================================================
    # SAVE RESULTS
    # =================================================================
    print("\n" + "="*60)
    print("💾 SAVING RESULTS")
    print("="*60)
    
    # Save detailed results to file
    results_file = output_dir / "pdf_multi_crew_analysis_results.json"
    with open(results_file, 'w') as f:
        json.dump(final_results, f, indent=2, default=str)
    
    # Save human-readable summary
    summary_file = output_dir / "analysis_summary.txt"
    with open(summary_file, 'w') as f:
        f.write("PDF MULTI-CREW RESUME ANALYZER - ANALYSIS SUMMARY\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"📊 RESUME MATCHING SCORE: {matching_score}%\n")
        f.write(f"🔗 GitHub Profile: {github_profile_url}\n")
        if final_results['github_verification']['triggered']:
            f.write(f"📦 Specified Repositories: {final_results['github_verification'].get('specified_repos', 0)}\n")
            f.write(f"✅ Verified Repositories: {final_results['github_verification'].get('verified_repos', 0)}\n")
            f.write(f"❌ Invalid Repositories: {final_results['github_verification'].get('invalid_repos', 0)}\n")
            f.write(f"🔍 Repositories Analyzed: {final_results['github_verification']['repositories_analyzed']}\n")
        f.write(f"✅ GitHub Verification Triggered: {final_results['github_verification']['triggered']}\n\n")
        
        if final_results['github_verification']['triggered']:
            f.write("GITHUB VERIFICATION RESULTS:\n")
            f.write("-" * 30 + "\n")
            f.write(final_results['github_verification']['verification_report'])
        else:
            f.write("GITHUB VERIFICATION SKIPPED:\n")
            f.write("-" * 30 + "\n")
            f.write(f"Reason: {final_results['github_verification']['reason']}\n")
    
    print(f"✅ Results saved to: {results_file}")
    print(f"✅ Summary saved to: {summary_file}")
    
    # =================================================================
    # FINAL SUMMARY
    # =================================================================
    print("\n" + "="*60)
    print("🎯 WORKFLOW COMPLETION SUMMARY")
    print("="*60)
    print(f"📋 Resume Matching Score: {matching_score}%")
    print(f"🔗 GitHub Profile: {github_profile_url}")
    if final_results['github_verification']['triggered']:
        print(f"📦 Specified Repositories: {final_results['github_verification'].get('specified_repos', 0)}")
        print(f"✅ Verified Repositories: {final_results['github_verification'].get('verified_repos', 0)}")
        print(f"❌ Invalid Repositories: {final_results['github_verification'].get('invalid_repos', 0)}")
        print(f"🔍 Repositories Analyzed: {final_results['github_verification']['repositories_analyzed']}")
    print(f"✅ GitHub Verification: {'Completed' if final_results['github_verification']['triggered'] else 'Skipped'}")
    print(f"📁 Output Directory: {output_dir.absolute()}")
    print("\n🎉 Multi-Crew PDF Resume Analyzer Workflow Completed Successfully!")

if __name__ == "__main__":
    main() 