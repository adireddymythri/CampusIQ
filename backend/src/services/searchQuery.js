/** Expand common college abbreviations for clearer web search */
const ABBREVIATIONS = {
  cn: 'computer networks',
  os: 'operating systems',
  ds: 'data structures',
  dbms: 'database management systems',
  oop: 'object oriented programming',
  oops: 'object oriented programming',
  co: 'computer organization',
  toc: 'theory of computation',
  daa: 'design and analysis of algorithms',
  ml: 'machine learning',
  ai: 'artificial intelligence',
  se: 'software engineering',
  dms: 'discrete mathematics',
  dm: 'discrete mathematics',
  ca: 'computer architecture',
  cd: 'compiler design',
  ip: 'internet protocols',
  wt: 'web technologies',
  st: 'software testing',
}

function extractPdfKeywords(pdfText, maxWords = 12) {
  if (!pdfText) return []
  const sample = pdfText.slice(0, 2000)
  const words = sample
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4)
  const freq = new Map()
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1)
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([w]) => w)
}

function expandTitle(title, subject) {
  const t = (title || '').trim().toLowerCase()
  const s = (subject || '').trim().toLowerCase()
  const expanded = ABBREVIATIONS[t]
  if (expanded) return expanded
  if (t.length <= 4 && s && s !== 'general') return `${t} ${s}`
  return title || subject || 'study material'
}

function buildStudySearchQuery({ title, subject, description, pdfText, question, mode = 'answer' }) {
  const expanded = expandTitle(title, subject)
  const keywords = extractPdfKeywords(pdfText, 8)
  const desc = (description || '').trim()

  const parts = []
  if (mode === 'summary') {
    parts.push(expanded, subject, 'university lecture notes key concepts summary')
  } else {
    parts.push(question, expanded, subject !== expanded ? subject : '')
  }

  if (keywords.length) parts.push(...keywords.slice(0, 5))
  if (desc.length > 10) parts.push(desc.slice(0, 120))

  const query = [...new Set(parts.join(' ').toLowerCase().split(/\s+/).filter(Boolean))].join(' ')
  return query.slice(0, 200)
}

function isAmbiguousTitle(title) {
  const t = (title || '').trim().toLowerCase()
  return t.length <= 4 && !ABBREVIATIONS[t]
}

function scoreWebRelevance(text, { title, subject, pdfKeywords }) {
  const lower = (text || '').toLowerCase()
  let score = 0
  const expanded = expandTitle(title, subject).toLowerCase()
  for (const word of expanded.split(/\s+/)) {
    if (word.length > 3 && lower.includes(word)) score += 2
  }
  const subj = (subject || '').toLowerCase()
  for (const word of subj.split(/\s+/)) {
    if (word.length > 3 && lower.includes(word)) score += 1
  }
  for (const kw of pdfKeywords || []) {
    if (lower.includes(kw)) score += 1
  }
  // Penalize obviously unrelated topics
  const noise = ['aircraft', 'video game', 'airliner', 'turboprop', 'released in 20']
  for (const n of noise) {
    if (lower.includes(n)) score -= 5
  }
  return score
}

function filterWebResults(webResults, context) {
  if (!webResults) return ''
  const blocks = webResults.split(/\n\n---\n\n|\n\n(?=[A-Z][^\n]+:)/)
  const keywords = extractPdfKeywords(context.pdfText, 10)
  const scored = blocks
    .map((block) => ({ block, score: scoreWebRelevance(block, { ...context, pdfKeywords: keywords }) }))
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score)
  
  // Return the top 15 results to ensure we have a large corpus of web data to answer comprehensively like an advanced bot
  const topResults = scored.slice(0, 15)
  if (!topResults.length) return ''
  return topResults.map((s) => s.block).join('\n\n')
}

module.exports = {
  expandTitle,
  extractPdfKeywords,
  buildStudySearchQuery,
  isAmbiguousTitle,
  filterWebResults,
}
