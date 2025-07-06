# GitHub Profile Analyzer

A powerful tool that extracts and analyzes GitHub profiles using Firecrawl API for web scraping and Google's Gemini AI for intelligent analysis.

## Features

✨ **Comprehensive Profile Analysis**
- 📊 Professional background and contact info
- 🚀 Repository statistics and activity metrics  
- 💻 Technical skills and programming languages
- 👥 Community engagement and social stats
- 📈 Contribution patterns and streaks

🔍 **Intelligent Data Extraction**
- Uses Firecrawl API for reliable web scraping
- Extracts repository details, follower counts, and recent activity
- Handles rate limiting and timeout scenarios

🤖 **AI-Powered Insights**
- Leverages Google Gemini 2.0 Flash for analysis
- Generates structured, professional reports
- Filters out incomplete or speculative information

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Keys

Create a `.env` file with your API keys:

```env
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

## Usage

### Single Profile Analysis

```bash
python github_analyzer.py
```

When prompted, enter a GitHub username (e.g., `octocat`).

### Batch Testing

Run the test script to analyze multiple profiles:

```bash
python test_analyzer.py
```

This will analyze several well-known GitHub profiles and save results to files.

## Sample Output

```
GitHub Profile Analysis: octocat
────────────────────────────────────────

1. Professional Background
• Current company/organization: @github
• Location: San Francisco
• Bio: The Octocat

2. Activity Analysis
• Total repositories and forks: 159,181 total forks across repositories
• Most active repositories (top 3):
  1. Spoon-Knife (152,000 forks)
  2. Hello-World (3,200 forks)
  3. octocat.github.io (423 forks)

3. Technical Portfolio
• Primary programming languages: HTML, CSS, Ruby
• Notable project themes: Demo repositories, personal website, language analysis

4. Community Engagement
• Followers and following count: 18,500 followers, following 9
• Recent contributions to octocat repository
```

## API Requirements

- **Firecrawl API**: For web scraping GitHub profiles
- **Google Gemini API**: For AI-powered analysis and insights

## Test Results

The script automatically saves analysis results to timestamped files:
- `test_results_{username}_{timestamp}.txt`

## Error Handling

The analyzer includes robust error handling for:
- API timeouts and rate limits
- Invalid usernames
- Network connectivity issues
- Model availability problems

## Contributing

Feel free to submit issues or pull requests to improve the analyzer! 