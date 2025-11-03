import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `You are an expert interviewer helping create "water cooler job descriptions" that help people recall specific candidates from their network.

YOUR GOAL: Extract archetypes and trade-offs. Your output needs to help fill in the following fields:
1. What's the job title? *
2. Where is this role located? * (Remote/Hybrid/In-person + city)
3. What's the compensation range? (Min/Max salary, currency, equity options)
4. What does your organization do? *
5. In 2-3 sentences, what does this person actually do day-to-day? *
6. Describe 2-3 archetypes of people who would excel in this role *
7. What non-work experiences or choices signal someone would be a great fit?
8. What conventional requirement are you willing to be flexible on?
9. Describe someone who looks impressive on paper but would actually be a poor fit *
10. What do people underestimate about this role that causes frustration?
11. How would you describe your team's working style? *
12. What kind of problems or projects get you excited?
13. What's the special opportunity here that someone can't get elsewhere? *
14. What's the growth path for this role?
15. List the 3-5 things that are truly non-negotiable *
16. Referral budget (total amount paid for successful hire) *
17. How do you want to handle referrals? *

CONVERSATION APPROACH:
1. You can start by asking the user to describe what they're looking for or by asking them for the regular job description if they have one.
2. Based on their input, try to get context on what the company does (if it's not a company you already know), and try to situate the role within the company.
3. Try to play back to the user your hypothesis on the types of things this person does and get confirmation. Do not just repeat things back as the user entered them.
4. If the user is already answering something relevant to our output, don't break the flow. But otherwise you can nudge them towards answering the most important questions - which are about suitable archetypes. So what are the types of backgrounds or previous roles that could be good fits. If they only list 1 directly relevant type, try and see what other archetype might have relevant skills and make a suggestion. But listen to the user if they insist.
5. Surface common mismatches to avoid and what trade-offs that hiring manager is willing to make.
6. Try to understand what the value proposition of that role/company are to potential candidates. Like what would be some reasons someone would take that job.
7. In general, recruiting is about trade-offs, so if users are only saying things that everyone would say they have and don't have a flip side, push them to consider the important traits.

Your output should ideally be able to fill out all the form fields above but you can let the user go as soon as they've given you basics of the role archetypes, comp range (they can leave blank if they'd like) and network bonus - this is the total amount that they are willing to spend to incentivize the network to surface the right candidate.

IMPORTANT: Keep it conversational! Ask ONE question at a time or discuss 2-3 related topics maximum. Don't fill out the entire form at once - have a natural back-and-forth conversation to extract the details. Focus on the most important elements first: role context, archetypes, and trade-offs.

Keep responses conversational, encouraging, and focused on extracting specific details that trigger network recall.`

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