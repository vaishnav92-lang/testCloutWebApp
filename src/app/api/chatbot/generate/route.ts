import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

const EXTRACTION_PROMPT = `You are an expert at extracting job posting information from conversations and creating concise network referral messages.

Based on the conversation history provided, extract information and generate two outputs:

1. FORM DATA: Structure the conversation into form fields (return as JSON)
2. FORWARDING MESSAGE: Create a concise 3-5 line message perfect for forwarding to network contacts

FORM FIELDS TO EXTRACT:
- title: Job title
- locationType: "REMOTE" | "HYBRID" | "IN_PERSON"
- locationCity: City name (if applicable)
- salaryMin: Minimum salary (number)
- salaryMax: Maximum salary (number)
- currency: "USD" | "GBP" | "EUR"
- equityOffered: boolean
- equityRange: Equity range string
- organizationDescription: What the organization does
- dayToDayDescription: Day-to-day work description
- archetypes: 2-3 archetypes who would excel
- nonWorkSignals: Non-work experiences that signal fit
- flexibleRequirements: Array of things they're flexible on
- commonMismatches: Who looks good but would be poor fit
- roleChallenges: What people underestimate about the role
- workingStyle: Team's working style
- excitingWork: What kind of problems/projects excite them
- specialOpportunity: Special opportunity this role offers
- growthPath: Growth path for the role
- mustHaves: 3-5 non-negotiable requirements
- referralBudget: Total referral budget (number)
- referralPreference: "MANUAL_SCREEN" | "AUTO_EMAIL" | "CONFIDENCE_BASED"

FORWARDING MESSAGE FORMAT:
Should be 3-5 lines that get straight to the point. Format like:
"[Company] is looking for [Role] - [Key responsibilities/focus]

Ideal fit: [Most compelling archetype from conversation]

[Key selling point/opportunity]. [Compensation if mentioned].

Know someone? [Referral budget if mentioned]"

Return your response as JSON with two keys:
{
  "formData": { /* form fields object */ },
  "forwardingMessage": "/* concise message */"
}

Only include fields where you have actual information from the conversation. Use null for missing data.`

export async function POST(request: NextRequest) {
  try {
    const { conversationHistory } = await request.json()

    if (!conversationHistory || conversationHistory.length < 2) {
      return NextResponse.json({
        error: 'Conversation history required'
      }, { status: 400 })
    }

    // If no API key, return mock data
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({
        formData: {
          title: "Senior Software Engineer",
          locationType: "REMOTE",
          organizationDescription: "Fast-growing tech startup",
          dayToDayDescription: "Build scalable web applications using React and Node.js",
          archetypes: "Former startup engineer who wants better work-life balance but still values impact",
          referralBudget: 5000
        },
        forwardingMessage: "TechCorp is looking for a Senior Software Engineer - building scalable web apps in React/Node.\n\nIdeal fit: Former startup engineer who wants better work-life balance but still values impact.\n\nRemote role with equity upside. $5k referral bonus.\n\nKnow someone great?"
      })
    }

    // Build conversation context
    const conversationText = conversationHistory
      .map((msg: any) => `${msg.sender}: ${msg.text}`)
      .join('\n\n')

    // Call Claude API for extraction
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        system: EXTRACTION_PROMPT,
        messages: [{
          role: 'user',
          content: `Extract job posting data and create forwarding message from this conversation:\n\n${conversationText}`
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    let extractedData

    try {
      extractedData = JSON.parse(data.content[0].text)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', data.content[0].text)
      throw new Error('Failed to parse extracted data')
    }

    return NextResponse.json(extractedData)

  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({
      error: 'Failed to generate job description'
    }, { status: 500 })
  }
}