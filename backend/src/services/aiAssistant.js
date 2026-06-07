const { searchWeb } = require('./webSearch')
const {
  expandTitle,
  extractPdfKeywords,
  buildStudySearchQuery,
  isAmbiguousTitle,
  filterWebResults,
} = require('./searchQuery')
const { getBuiltinTopicSummary, hasBuiltinTopic } = require('./topicKnowledge')
const { STUDY_SYSTEM_PROMPT, callStudyAI, getActiveProviders } = require('./aiProvider')

const STUDY_PROMPT = STUDY_SYSTEM_PROMPT

function buildContextBlock({ title, subject, description, pdfText, webResults }) {
  const sections = []
  sections.push(`**Active study material**
- Title: ${title || 'General'}
- Subject: ${subject || 'General'}
- Description: ${description || 'None'}`)

  if (pdfText) {
    sections.push(`**PDF / document content** (primary source — prioritize this when answering):
${pdfText}`)
  } else {
    sections.push('**PDF content:** Not available for this note. Use title, description, web results, and general knowledge.')
  }

  if (webResults) {
    sections.push(`**Web search results** (supplementary — use to enrich and verify answers):
${webResults}`)
  }

  return sections.join('\n\n')
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-16)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
}

function quotaNotice(aiError) {
  if (aiError === 'QUOTA_EXCEEDED') {
    return `> ⚠️ **OpenRouter limit reached.** Add credits at [openrouter.ai](https://openrouter.ai/settings/credits) or switch to a free model in \`OPENROUTER_MODEL\`.\n\n`
  }
  if (aiError === 'MISSING_API_KEY') {
    return `> ⚠️ **Add \`OPENROUTER_API_KEY\` to backend/.env** — get a key at [openrouter.ai/keys](https://openrouter.ai/keys).\n\n`
  }
  if (aiError) {
    return `> ⚠️ **AI temporarily unavailable.** Showing built-in study content instead.\n\n`
  }
  return ''
}

async function generateStudyAnswer({ question, title, subject, description, pdfText, history, enableWebSearch = true }) {
  let webResults = ''
  if (enableWebSearch) {
    const searchQuery = buildStudySearchQuery({
      title,
      subject,
      description,
      pdfText,
      question,
      mode: 'answer',
    })
    const raw = await searchWeb(searchQuery)
    webResults = filterWebResults(raw, { title, subject, pdfText })
  }

  const contextBlock = buildContextBlock({ title, subject, description, pdfText, webResults })
  const chatHistory = normalizeHistory(history)

  const messages = [
    { role: 'system', content: STUDY_PROMPT },
    { role: 'system', content: contextBlock },
    ...chatHistory,
    { role: 'user', content: question },
  ]

  const { text: answer, source, aiError } = await callStudyAI({ messages, temperature: 0.65 })
  if (answer) {
    return { answer, usedWebSearch: Boolean(webResults), usedPdf: Boolean(pdfText), source, aiError: null }
  }

  return {
    answer: buildLocalFallback({ question, title, subject, description, pdfText, webResults, aiError }),
    usedWebSearch: Boolean(webResults),
    usedPdf: Boolean(pdfText),
    source: 'local',
    aiError,
  }
}

async function generateStudySummary({ title, subject, description, pdfText }) {
  let webResults = ''
  const useBuiltin = hasBuiltinTopic(title)
  const skipWeb = Boolean(pdfText) || useBuiltin || isAmbiguousTitle(title)

  if (!skipWeb) {
    const searchQuery = buildStudySearchQuery({
      title,
      subject,
      description,
      pdfText,
      mode: 'summary',
    })
    const raw = await searchWeb(searchQuery)
    webResults = filterWebResults(raw, { title, subject, pdfText })
  } else if (pdfText) {
    // PDF is primary — only search if we can build a strong query from content
    const searchQuery = buildStudySearchQuery({
      title,
      subject,
      description,
      pdfText,
      mode: 'summary',
    })
    const raw = await searchWeb(searchQuery)
    webResults = filterWebResults(raw, { title, subject, pdfText })
  }
  const contextBlock = buildContextBlock({ title, subject, description, pdfText, webResults })

  const messages = [
    { role: 'system', content: STUDY_PROMPT },
    {
      role: 'user',
      content: `Create a comprehensive study summary of the material below. Include:
1. Overview of main topics
2. Key definitions and formulas (with LaTeX if needed)
3. Important bullet points for exam revision
4. 2-3 practice questions with brief answers

${contextBlock}`,
    },
  ]

  const { text: summary, source, aiError } = await callStudyAI({ messages, temperature: 0.5, maxTokens: 4096 })
  if (summary) {
    return { summary, source, aiError: null }
  }

  return {
    summary: buildLocalSummaryFallback({ title, subject, description, pdfText, webResults, aiError }),
    source: 'local',
    aiError,
  }
}

function extractRelevantExcerpt(pdfText, question, maxLen = 2500) {
  if (!pdfText) return ''
  const qWords = question.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  if (!qWords.length) return pdfText.slice(0, maxLen)

  const chunks = pdfText.split(/(?<=[.!?])\s+/)
  const scored = chunks.map((chunk, i) => {
    const lower = chunk.toLowerCase()
    const score = qWords.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0)
    return { i, score, chunk }
  })
  scored.sort((a, b) => b.score - a.score)
  const top = scored.filter((c) => c.score > 0).slice(0, 8)
  if (!top.length) return pdfText.slice(0, maxLen)
  top.sort((a, b) => a.i - b.i)
  return top.map((c) => c.chunk).join(' ').slice(0, maxLen)
}

function buildLocalFallback({ question, title, subject, description, pdfText, webResults, aiError }) {
  const excerpt = extractRelevantExcerpt(pdfText, question)
  const builtin = getBuiltinTopicSummary(title, subject)
  const parts = [quotaNotice(aiError), `### Answer: ${expandTitle(title, subject) || title || 'Study Question'}`, '', `**Your question:** ${question}`, '']

  if (excerpt) {
    parts.push('#### From your study material', excerpt, '')
  } else if (builtin) {
    parts.push(builtin, '')
  } else if (webResults) {
    parts.push('#### From web resources', webResults.slice(0, 2000), '')
  } else {
    parts.push(
      '#### Note',
      'For AI-powered answers, add `OPENROUTER_API_KEY` to backend `.env` (get one at openrouter.ai/keys).',
      description ? `\n**Note description:** ${description}` : '',
      `\n**Subject:** ${subject || 'General'}`,
    )
  }

  return parts.filter(Boolean).join('\n')
}

function summarizePdfLocally(pdfText, title, subject) {
  const topic = expandTitle(title, subject)
  const normalized = pdfText.replace(/\s+/g, ' ').trim()

  // Split into sentences and pick informative ones
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter((s) => s.length > 30)
  const keywords = extractPdfKeywords(pdfText, 15)

  const scored = sentences.map((s) => {
    const lower = s.toLowerCase()
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 2
    }
    if (/\b(is|are|defined|means|refers|algorithm|process|protocol|layer|function|theorem|formula)\b/i.test(s)) {
      score += 2
    }
    if (/^\d+[\.)]\s/.test(s) || /^unit\s/i.test(s)) score += 1
    return { s, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const keyPoints = [...new Set(scored.filter((x) => x.score > 0).slice(0, 12).map((x) => x.s))]

  // Detect section-like chunks from original text
  const sections = pdfText
    .split(/\n{2,}|(?=\b(?:Unit|Chapter|Module|Topic)\s+\d)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 80)
    .slice(0, 6)

  const parts = [
    `### Study Summary: ${title}`,
    '',
    `**Subject:** ${subject || 'General'}`,
    `**Topic:** ${topic}`,
    '',
    '#### Overview',
    sentences.slice(0, 3).join(' ') || normalized.slice(0, 500),
    '',
  ]

  if (keyPoints.length) {
    parts.push('#### Key Points')
    for (const point of keyPoints) {
      parts.push(`* ${point.trim()}`)
    }
    parts.push('')
  }

  if (sections.length > 1) {
    parts.push('#### Main Sections')
    for (const sec of sections) {
      const heading = sec.split('\n')[0].slice(0, 80)
      const body = sec.replace(/\s+/g, ' ').slice(0, 400)
      parts.push(`**${heading}**`, body, '')
    }
  } else {
    parts.push('#### Content from your PDF', normalized.slice(0, 3500), '')
  }

  parts.push(
    '---',
    '*Powered by OpenRouter — set `OPENROUTER_API_KEY` in backend/.env.*',
  )
  return parts.join('\n')
}

function buildLocalSummaryFallback({ title, subject, description, pdfText, webResults, aiError }) {
  const notice = quotaNotice(aiError)
  const builtin = getBuiltinTopicSummary(title, subject)

  if (pdfText) {
    const summary = summarizePdfLocally(pdfText, title, subject)
    return notice + summary
  }

  if (builtin) {
    return notice + builtin
  }

  const topic = expandTitle(title, subject)
  const parts = [
    notice,
    `### Study Summary: ${title}`,
    '',
    `**Subject:** ${subject || 'General'}`,
    `**Topic:** ${topic}`,
    description ? `**Description:** ${description}` : '',
    '',
  ]

  if (webResults) {
    parts.push('#### Supplementary information', webResults.slice(0, 1500), '')
  } else {
    parts.push(
      '#### Unable to generate summary',
      'No PDF text could be extracted from this note. Please ensure the file is a readable text-based PDF.',
    )
  }

  return parts.filter(Boolean).join('\n')
}

module.exports = {
  generateStudyAnswer,
  generateStudySummary,
  getActiveProviders,
  STUDY_SYSTEM_PROMPT: STUDY_PROMPT,
}
