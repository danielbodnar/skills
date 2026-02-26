# Claude Code SDK - Python Basic Usage

from claude_code_sdk import query
import asyncio
import json

async def basic_query():
    """Basic query example"""
    try:
        async for message in query(
            prompt="Write a Python function to parse CSV files efficiently",
            options={"max_turns": 3}
        ):
            if message.type == "text":
                print(f"Claude: {message.content}")
            elif message.type == "tool_use":
                print(f"Tool used: {message.name} with {message.input}")
    except Exception as error:
        print(f"Error: {error}")

async def multi_turn_conversation():
    """Multi-turn conversation with context"""
    conversation = query(
        prompt="Help me build a web scraper",
        options={
            "max_turns": 10,
            "system_prompt": "You are an expert Python developer specializing in web scraping and data extraction"
        }
    )

    async for message in conversation:
        if message.type == "text":
            print(f"Response: {message.content}")
            
            # Continue conversation based on response
            if "requests" in message.content.lower():
                # Add follow-up question
                await conversation.add_message("Should I use requests or httpx for this project?")

async def json_output():
    """JSON output for programmatic processing"""
    result = await query(
        prompt="Analyze this Python code and return a JSON report of potential improvements",
        options={
            "format": "json",
            "max_turns": 1
        }
    )

    # Process structured output
    analysis = json.loads(result.content)
    print(f"Improvements suggested: {len(analysis.get('improvements', []))}")

async def robust_query():
    """Error handling and retries"""
    max_retries = 3
    attempt = 0

    while attempt < max_retries:
        try:
            result = await query(
                prompt="Generate a comprehensive test suite using pytest",
                options={
                    "timeout": 30000,  # 30 seconds
                    "max_turns": 5
                }
            )
            return result
        except Exception as error:
            attempt += 1
            print(f"Attempt {attempt} failed: {error}")
            
            if attempt >= max_retries:
                raise Exception(f"Failed after {max_retries} attempts: {error}")
            
            # Exponential backoff
            await asyncio.sleep(1 * (2 ** attempt))

async def main():
    """Run example functions"""
    print("=== Basic Query ===")
    await basic_query()
    
    print("\n=== Multi-turn Conversation ===")
    await multi_turn_conversation()
    
    print("\n=== JSON Output ===")
    await json_output()
    
    print("\n=== Robust Query ===")
    try:
        result = await robust_query()
        print(f"Success: {result}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())