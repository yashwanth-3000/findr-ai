#!/usr/bin/env python3
"""
Agentic Workflow using CrewAI and Groq
=====================================

This script demonstrates a multi-agent workflow where specialized AI agents
collaborate to complete complex tasks. The workflow includes:

1. Research Agent - Gathers and analyzes information
2. Content Creator Agent - Creates content based on research
3. Reviewer Agent - Reviews and provides feedback
4. Technical Writer Agent - Creates technical documentation

The agents work together in a coordinated workflow to complete tasks efficiently.
"""

import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, LLM

# Load environment variables
load_dotenv()

def main():
    """Main function to run the agentic workflow."""
    
    print("🚀 Starting Agentic Workflow with CrewAI and Groq")
    print("=" * 50)
    
    # Initialize Groq LLM with working model format
    print("📡 Initializing Groq LLM...")
    llm = LLM(
        model="groq/llama-3.3-70b-versatile",  # Updated to working model format
        temperature=0.7,
        max_completion_tokens=1024,
    )
    
    # Create specialized agents
    print("🤖 Creating AI Agents...")
    
    # Research Agent
    research_agent = Agent(
        role='Senior Research Analyst',
        goal='Conduct thorough research and analysis on given topics',
        backstory='''You are a seasoned research analyst with expertise in 
        gathering comprehensive information, analyzing trends, and providing 
        detailed insights. You excel at breaking down complex topics and 
        presenting findings in a structured manner.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Content Creator Agent
    content_creator = Agent(
        role='Creative Content Strategist',
        goal='Create engaging and informative content based on research findings',
        backstory='''You are a creative content strategist who transforms 
        research data into compelling narratives. You have a talent for 
        making complex information accessible and engaging for various audiences.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Reviewer Agent
    reviewer_agent = Agent(
        role='Quality Assurance Specialist',
        goal='Review content for accuracy, clarity, and completeness',
        backstory='''You are a meticulous quality assurance specialist with 
        a keen eye for detail. You ensure that all content meets high standards 
        for accuracy, clarity, and professional presentation.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Technical Writer Agent
    tech_writer = Agent(
        role='Senior Technical Writer',
        goal='Create clear and comprehensive technical documentation',
        backstory='''You are an experienced technical writer who specializes 
        in creating documentation that helps users understand and implement 
        complex technical concepts. You excel at creating step-by-step guides 
        and clear explanations.''',
        llm=llm,
        verbose=True,
        allow_delegation=False
    )
    
    # Define the workflow topic
    topic = "Artificial Intelligence in Healthcare: Applications and Future Trends"
    
    print(f"📋 Topic: {topic}")
    print("\n🔄 Creating workflow tasks...")
    
    # Define tasks for the workflow
    research_task = Task(
        description=f'''Research the topic: "{topic}"
        
        Provide a comprehensive analysis including:
        1. Current applications of AI in healthcare
        2. Key benefits and challenges
        3. Emerging trends and technologies
        4. Future outlook and predictions
        5. Key players and companies in the space
        
        Focus on factual information and recent developments.''',
        expected_output='''A detailed research report with:
        - Executive summary
        - Current applications (3-5 key areas)
        - Benefits and challenges analysis
        - Emerging trends (3-5 trends)
        - Future predictions and timeline
        - Key industry players''',
        agent=research_agent
    )
    
    content_creation_task = Task(
        description='''Based on the research findings, create an engaging article about AI in healthcare.
        
        The article should:
        1. Have a compelling introduction that hooks the reader
        2. Present the information in an accessible way
        3. Include real-world examples and case studies
        4. Highlight the impact on patients and healthcare providers
        5. Conclude with future implications
        
        Make it suitable for a general audience while maintaining technical accuracy.''',
        expected_output='''An engaging 800-1000 word article with:
        - Compelling headline and introduction
        - 3-4 main sections with subheadings
        - Real-world examples and case studies
        - Clear explanations of technical concepts
        - Strong conclusion about future implications''',
        agent=content_creator,
        dependencies=[research_task]
    )
    
    review_task = Task(
        description='''Review the article for quality, accuracy, and clarity.
        
        Check for:
        1. Factual accuracy based on the research
        2. Clarity and readability
        3. Logical flow and structure
        4. Grammar and style
        5. Completeness of coverage
        
        Provide specific feedback and suggestions for improvement.''',
        expected_output='''A comprehensive review report with:
        - Overall assessment score (1-10)
        - Specific feedback on accuracy, clarity, and structure
        - List of any factual errors or inconsistencies
        - Suggestions for improvement
        - Recommendation for publication readiness''',
        agent=reviewer_agent,
        dependencies=[content_creation_task]
    )
    
    documentation_task = Task(
        description='''Create a technical implementation guide for healthcare organizations 
        looking to adopt AI solutions.
        
        Include:
        1. Step-by-step implementation framework
        2. Technical requirements and considerations
        3. Compliance and regulatory considerations
        4. Best practices and recommendations
        5. Common pitfalls to avoid
        
        Make it practical and actionable for healthcare IT teams.''',
        expected_output='''A technical implementation guide with:
        - Implementation roadmap with phases
        - Technical requirements checklist
        - Regulatory compliance considerations
        - Best practices and recommendations
        - Risk mitigation strategies
        - Success metrics and KPIs''',
        agent=tech_writer,
        dependencies=[research_task]
    )
    
    # Create the crew
    print("👥 Assembling the crew...")
    crew = Crew(
        agents=[research_agent, content_creator, reviewer_agent, tech_writer],
        tasks=[research_task, content_creation_task, review_task, documentation_task],
        verbose=True,
        process='sequential'  # Tasks will be executed in order based on dependencies
    )
    
    # Execute the workflow
    print("\n🎬 Starting the workflow execution...")
    print("=" * 50)
    
    try:
        result = crew.kickoff()
        
        print("\n✅ Workflow completed successfully!")
        print("=" * 50)
        print("\n📊 Final Results:")
        print(result)
        
        # Save results to files
        print("\n💾 Saving results to files...")
        
        # Create output directory
        os.makedirs('output', exist_ok=True)
        
        # Save the final result
        with open('output/workflow_results.txt', 'w') as f:
            f.write("Agentic Workflow Results\n")
            f.write("=" * 30 + "\n\n")
            f.write(f"Topic: {topic}\n\n")
            f.write(str(result))
        
        print("✅ Results saved to 'output/workflow_results.txt'")
        
        return result
        
    except Exception as e:
        print(f"❌ Error during workflow execution: {str(e)}")
        return None

def demonstrate_simple_workflow():
    """Demonstrate a simpler workflow based on the documentation example."""
    
    print("\n🔄 Running Simple Workflow Demo...")
    print("=" * 40)
    
    # Initialize LLM with working model format
    llm = LLM(model="groq/llama-3.3-70b-versatile")  # Updated to working model format
    
    # Create agents from the documentation example
    summarizer = Agent(
        role='Documentation Summarizer',
        goal='Create concise summaries of technical documentation',
        backstory='Technical writer who excels at simplifying complex concepts',
        llm=llm,
        verbose=True
    )
    
    translator = Agent(
        role='Technical Translator',
        goal='Translate technical documentation to other languages',
        backstory='Technical translator specializing in software documentation',
        llm=llm,
        verbose=True
    )
    
    # Create a documentation writer agent (the challenge from the docs)
    doc_writer = Agent(
        role='Documentation Writer',
        goal='Write comprehensive documentation for functions and APIs',
        backstory='Senior technical writer with expertise in API documentation and developer guides',
        llm=llm,
        verbose=True
    )
    
    # Define tasks
    summary_task = Task(
        description='''Summarize this React hook documentation:
        
        useFetch(url) is a custom hook for making HTTP requests. It returns { data, loading, error } 
        and automatically handles loading states. The hook accepts a URL string and optional options 
        object. It uses fetch() internally and manages the async state transitions.''',
        expected_output="A clear, concise summary of the hook's functionality",
        agent=summarizer
    )
    
    translation_task = Task(
        description='Translate the summary to Spanish',
        expected_output="Spanish translation of the hook documentation summary",
        agent=translator,
        dependencies=[summary_task]
    )
    
    documentation_task = Task(
        description='''Write comprehensive documentation for a function called 'calculateTotal' 
        that takes an array of items with price and quantity properties and returns the total cost.
        
        Include:
        - Function signature
        - Parameters description
        - Return value
        - Usage examples
        - Error handling''',
        expected_output="Complete function documentation with examples and error handling",
        agent=doc_writer
    )
    
    # Create crew
    crew = Crew(
        agents=[summarizer, translator, doc_writer],
        tasks=[summary_task, translation_task, documentation_task],
        verbose=True
    )
    
    # Execute
    try:
        result = crew.kickoff()
        print("\n✅ Simple workflow completed!")
        print("Results:", result)
        return result
    except Exception as e:
        print(f"❌ Error in simple workflow: {str(e)}")
        return None

if __name__ == "__main__":
    # Check if Groq API key is available
    if not os.getenv("GROQ_API_KEY"):
        print("❌ Error: GROQ_API_KEY not found in environment variables")
        print("Please make sure your .env file contains a valid GROQ_API_KEY")
        exit(1)
    
    print("🔑 Groq API Key found!")
    
    # Run the simple workflow first
    simple_result = demonstrate_simple_workflow()
    
    # Run the main comprehensive workflow
    if simple_result:
        main_result = main()
        
        if main_result:
            print("\n🎉 All workflows completed successfully!")
            print("\nCheck the 'output' directory for saved results.")
        else:
            print("\n⚠️ Main workflow encountered issues.")
    else:
        print("\n⚠️ Simple workflow failed. Skipping main workflow.") 