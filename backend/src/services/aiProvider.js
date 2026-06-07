const { env } = require('../config/env')

const STUDY_SYSTEM_PROMPT = `You are CampusIQ AI Study Assistant — an advanced, ChatGPT-level expert tutor for college students.

Rules:
- Give clear, detailed, well-structured answers using markdown (### headings, bullets, **bold**, code blocks, LaTeX $math$).
- Prioritize the student's PDF/note content when provided — explain using their material.
- Use web search context when provided to enrich answers with accurate, up-to-date information.
- Explain step-by-step for problems; use examples and analogies.
- Be conversational, accurate, and exam-focused.`

function getOpenRouterKey() {
  return (process.env.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || '').trim()
}

function getOpenRouterModel() {
  return (
    process.env.OPENROUTER_MODEL ||
    env.OPENROUTER_MODEL ||
    'openrouter/owl-alpha'
  ).trim()
}

async function callOpenRouter({ messages, temperature = 0.65, maxTokens = 4096 }) {
  const apiKey = getOpenRouterKey()
  if (!apiKey) return null

  const model = getOpenRouterModel()
  const siteUrl = process.env.CLIENT_ORIGIN || env.CLIENT_ORIGIN || 'http://localhost:5173'

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'CampusIQ Study Assistant',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
    signal: AbortSignal.timeout(120000),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    let message = errBody.slice(0, 300)
    try {
      const parsed = JSON.parse(errBody)
      message = parsed.error?.message || message
    } catch {
      /* use raw body */
    }
    const err = new Error(`OpenRouter API error (${res.status}): ${message}`)
    if (res.status === 429 || message.includes('limit')) err.code = 'QUOTA_EXCEEDED'
    throw err
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || null
}

async function callStudyAI({ messages, temperature = 0.65, maxTokens = 4096 }) {
  const apiKey = getOpenRouterKey()
  if (!apiKey) {
    return {
      text: null,
      source: 'local',
      aiError: 'MISSING_API_KEY',
    }
  }

  try {
    const text = await callOpenRouter({ messages, temperature, maxTokens })
    if (text) return { text, source: 'openrouter', aiError: null }
  } catch (err) {
    console.error('OpenRouter API call failed:', err.message)
    return {
      text: null,
      source: 'local',
      aiError: err.code === 'QUOTA_EXCEEDED' ? 'QUOTA_EXCEEDED' : err.message,
    }
  }

  return { text: null, source: 'local', aiError: 'EMPTY_RESPONSE' }
}

/** For quiz generation — returns raw string (often JSON) */
async function callStudyAIRaw({ messages, temperature = 0.5, maxTokens = 4096 }) {
  return callStudyAI({ messages, temperature, maxTokens })
}

function getActiveProviders() {
  return {
    hasOpenRouterKey: Boolean(getOpenRouterKey()),
    model: getOpenRouterModel(),
  }
}

module.exports = {
  STUDY_SYSTEM_PROMPT,
  callStudyAI,
  callStudyAIRaw,
  getActiveProviders,
}
