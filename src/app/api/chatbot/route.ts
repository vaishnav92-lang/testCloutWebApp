import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `You are an expert interviewer helping create "water cooler job descriptions" that help people recall specific candidates from their network.

YOUR GOAL: Extract concrete archetypes and specific examples, not generic requirements. These job descriptions should trigger network recall by being memorable and specific.

CONVERSATION APPROACH:
1. Start by understanding the role basics (title, company, day-to-day work)
2. Dig into successful person archetypes - push for specific examples
3. Uncover lifestyle/background patterns that correlate with success
4. Identify flexibility areas and trade-offs
5. Surface common mismatches to avoid
6. Extract the unique value proposition

QUALITY REQUIREMENTS:
- When they give generic responses ("team player", "self-motivated"), ask for specific examples
- When they say abstractions, ask them to think of real people they've worked with
- Push for memorable, network-triggering descriptions
- Flag corporate speak and dig deeper

EXAMPLE TRANSFORMATION:
Bad: "Looking for a experienced developer with good communication skills"
Good: "Former technical founder who built something to $2M ARR, learned from scaling challenges, now wants senior IC role with equity upside"

Keep responses conversational, encouraging, and focused on drawing out specific details that will help people think of actual candidates in their network.`

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // If no API key, fall back to mock responses
    if (!ANTHROPIC_API_KEY) {
      const mockResponses = [
        "That's interesting! Can you tell me more about the specific type of person who would thrive in this role? Think about actual people you've worked with before.",
        "Great! Now, thinking about your best hire in a similar position - what did they have in common that wasn't obvious from their resume?",
        "Perfect. What about outside of work - are there any hobbies, experiences, or lifestyle choices that tend to correlate with success in your company?",
        "Excellent insights. What conventional requirements would you be willing to be flexible on for the right cultural fit?",
        "One more question - what's a common type of candidate that looks perfect on paper but ends up being a poor match?"
      ]

      const responseIndex = conversationHistory.length % mockResponses.length
      await new Promise(resolve => setTimeout(resolve, 1000))

      return NextResponse.json({
        message: mockResponses[responseIndex],
        conversationId: 'mock-conversation',
        timestamp: new Date().toISOString()
      })
    }

    // Build conversation context for Claude
    const messages = [
      ...conversationHistory.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const botResponse = data.content[0].text

    return NextResponse.json({
      message: botResponse,
      conversationId: 'claude-conversation',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chatbot error:', error)

    // Fallback to helpful mock response on error
    return NextResponse.json({
      message: "I'm having trouble connecting right now, but let's continue! Can you tell me more about what makes someone successful in this role?",
      conversationId: 'fallback-conversation',
      timestamp: new Date().toISOString()
    })
  }
}