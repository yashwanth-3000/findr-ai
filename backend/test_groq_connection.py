#!/usr/bin/env python3
"""
Test Groq API Connection
========================

Simple test script to verify that Groq API is working correctly
before running the full agentic workflow.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_groq_with_python_client():
    """Test Groq using the direct groq client."""
    try:
        from groq import Groq
        
        print("🧪 Testing Groq API with direct client...")
        
        # Check API key
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("❌ No GROQ_API_KEY found in environment")
            return False
        
        print(f"🔑 API Key found: {api_key[:10]}...{api_key[-4:]}")
        
        # Initialize client
        client = Groq(api_key=api_key)
        
        # Test simple completion with current model
        print("📡 Making test API call...")
        completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Say 'Hello, this is a test from Groq API!' in exactly those words."
                }
            ],
            model="llama-3.3-70b-versatile",  # Updated to current model
            max_tokens=50,
        )
        
        response = completion.choices[0].message.content
        print(f"✅ API Response: {response}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing Groq API: {str(e)}")
        return False

def test_crewai_llm():
    """Test Groq with CrewAI LLM wrapper by creating a simple agent."""
    try:
        from crewai import Agent, Task, Crew, LLM
        
        print("\n🧪 Testing Groq with CrewAI LLM wrapper...")
        
        # Try current available models
        model_variants = [
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant", 
            "deepseek-r1-distill-llama-70b",
            "groq/llama-3.3-70b-versatile",
            "groq/llama-3.1-8b-instant"
        ]
        
        for model_name in model_variants:
            try:
                print(f"🔄 Testing model: {model_name}")
                
                llm = LLM(
                    model=model_name,
                    temperature=0.7,
                    max_completion_tokens=100,
                )
                
                # Test by creating a simple agent and task
                test_agent = Agent(
                    role='Test Agent',
                    goal='Respond to simple requests',
                    backstory='A simple test agent',
                    llm=llm,
                    verbose=False
                )
                
                test_task = Task(
                    description='Say "Test successful!" and nothing else.',
                    expected_output='A simple success message',
                    agent=test_agent
                )
                
                crew = Crew(
                    agents=[test_agent],
                    tasks=[test_task],
                    verbose=False
                )
                
                result = crew.kickoff()
                print(f"✅ Model {model_name} works! Response: {result}")
                return True, model_name
                
            except Exception as e:
                print(f"❌ Model {model_name} failed: {str(e)}")
                continue
        
        return False, None
        
    except Exception as e:
        print(f"❌ Error testing CrewAI LLM: {str(e)}")
        return False, None

def test_simple_agent():
    """Test a simple CrewAI agent."""
    try:
        from crewai import Agent, Task, Crew, LLM
        
        print("\n🧪 Testing simple CrewAI agent...")
        
        # Use working model
        llm = LLM(
            model="llama-3.3-70b-versatile",  # Updated to current model
            temperature=0.7,
            max_completion_tokens=100,
        )
        
        # Create simple agent
        test_agent = Agent(
            role='Test Agent',
            goal='Respond to simple requests',
            backstory='A simple test agent',
            llm=llm,
            verbose=True
        )
        
        # Create simple task
        test_task = Task(
            description='Say "Hello from CrewAI agent!" and nothing else.',
            expected_output='A simple greeting message',
            agent=test_agent
        )
        
        # Create crew
        crew = Crew(
            agents=[test_agent],
            tasks=[test_task],
            verbose=True
        )
        
        # Execute
        print("🚀 Running simple agent test...")
        result = crew.kickoff()
        print(f"✅ Agent test successful! Result: {result}")
        
        return True
        
    except Exception as e:
        print(f"❌ Agent test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Groq API Connection Tests")
    print("=" * 50)
    
    # Test 1: Direct Groq client
    groq_works = test_groq_with_python_client()
    
    if not groq_works:
        print("\n❌ Direct Groq API test failed. Check your API key.")
        exit(1)
    
    # Test 2: CrewAI LLM wrapper
    crewai_works, working_model = test_crewai_llm()
    
    if not crewai_works:
        print("\n❌ CrewAI LLM test failed.")
        exit(1)
    
    print(f"\n✅ Found working model: {working_model}")
    
    # Test 3: Simple agent
    agent_works = test_simple_agent()
    
    if agent_works:
        print("\n🎉 All tests passed! Groq API is working correctly.")
        print("You can now run the full agentic workflow.")
    else:
        print("\n⚠️ Agent test failed, but API connection works.")
        print("There may be an issue with the CrewAI configuration.") 