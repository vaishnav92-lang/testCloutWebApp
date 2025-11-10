import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const CONVERSION_PROMPT = `You are an expert at converting traditional job descriptions into "water cooler" descriptions that help people recall specific candidates from their network.

Your task is to take a traditional job description and create a concise 3-4 line version that:
1. Gets straight to the point about what the role is
2. Highlights the most compelling archetype or background
3. Mentions key selling points (company, opportunity, compensation if notable)
4. Ends with a call to action about referrals

FORMAT:
"[Company] is looking for [Role] - [Key responsibilities/focus]

Ideal fit: [Most compelling archetype/background]

[Key selling point/opportunity]. [Compensation if mentioned].

Know someone great?"

EXAMPLE:
Input: "We are seeking a Senior Software Engineer with 5+ years experience in React, Node.js, and AWS. The ideal candidate will have experience building scalable web applications, working in agile environments, and mentoring junior developers. We offer competitive salary, equity, and comprehensive benefits..."

Output: "TechCorp is looking for a Senior Software Engineer - building scalable web apps with React/Node.js

Ideal fit: Former startup engineer who wants better work-life balance but still values technical challenges

Remote-first with equity upside and strong mentorship culture.

Know someone great?"

Keep it conversational, specific, and network-triggering. Focus on what makes someone think "oh, I know exactly who would be perfect for this!"`

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json()

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json({
        error: 'Job description is required'
      }, { status: 400 })
    }

    // If no API key, return mock conversion
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({
        waterCoolerDescription: `TechCorp is looking for a Software Engineer - building scalable web applications

Ideal fit: Former startup engineer who wants better work-life balance but still values impact

Remote role with equity upside and strong engineering culture.

Know someone great?`
      })
    }

    // Call Claude API for conversion
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: CONVERSION_PROMPT,
        messages: [{
          role: 'user',
          content: `Convert this job description to a water cooler version:\n\n${jobDescription}`
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const waterCoolerDescription = data.content[0].text

    return NextResponse.json({
      waterCoolerDescription
    })

  } catch (error) {
    console.error('Convert error:', error)
    return NextResponse.json({
      error: 'Failed to convert job description'
    }, { status: 500 })
  }
}