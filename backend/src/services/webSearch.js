const MAX_SNIPPET = 600

async function searchTavily(query, apiKey) {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 5,
      include_answer: true,
    }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Tavily search failed (${res.status})`)
  const data = await res.json()
  const parts = []
  if (data.answer) parts.push(`Summary: ${data.answer}`)
  for (const r of data.results || []) {
    parts.push(`- ${r.title}\n  ${(r.content || '').slice(0, MAX_SNIPPET)}\n  Source: ${r.url}`)
  }
  return parts.join('\n\n')
}

async function searchDuckDuckGo(query) {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`DuckDuckGo search failed (${res.status})`)
  const data = await res.json()
  const parts = []
  if (data.AbstractText) {
    parts.push(`${data.Heading || 'Overview'}: ${data.AbstractText}`)
    if (data.AbstractURL) parts.push(`Source: ${data.AbstractURL}`)
  }
  for (const topic of (data.RelatedTopics || []).slice(0, 5)) {
    if (topic.Text) parts.push(`- ${topic.Text}`)
    else if (Array.isArray(topic.Topics)) {
      for (const sub of topic.Topics.slice(0, 3)) {
        if (sub.Text) parts.push(`- ${sub.Text}`)
      }
    }
  }
  return parts.join('\n')
}

async function searchWikipedia(query) {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=2`
  const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) })
  if (!searchRes.ok) return ''
  const searchData = await searchRes.json()
  const hits = searchData.query?.search || []
  if (!hits.length) return ''

  const parts = []
  for (const hit of hits.slice(0, 2)) {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(8000) })
    if (!summaryRes.ok) continue
    const summary = await summaryRes.json()
    if (summary.extract) {
      parts.push(`${summary.title}: ${summary.extract.slice(0, MAX_SNIPPET)}`)
      if (summary.content_urls?.desktop?.page) {
        parts.push(`Source: ${summary.content_urls.desktop.page}`)
      }
    }
  }
  return parts.join('\n\n')
}

async function searchGoogle(query, apiKey, cx) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Google Search failed (${res.status})`)
  const data = await res.json()
  const parts = []
  for (const item of data.items || []) {
    parts.push(`- ${item.title}\n  ${item.snippet}\n  Source: ${item.link}`)
  }
  return parts.join('\n\n')
}

async function searchWeb(query) {
  const trimmed = (query || '').trim()
  if (!trimmed) return ''

  const results = []

  const googleKey = process.env.GOOGLE_SEARCH_API_KEY?.trim()
  const googleCx = process.env.GOOGLE_SEARCH_CX?.trim()
  if (googleKey && googleCx) {
    try {
      const googleRes = await searchGoogle(trimmed, googleKey, googleCx)
      if (googleRes) results.push(googleRes)
    } catch (err) {
      console.error('Google search error:', err.message)
    }
  }

  const tavilyKey = process.env.TAVILY_API_KEY?.trim()
  if (tavilyKey) {
    try {
      const tavilyRes = await searchTavily(trimmed, tavilyKey)
      if (tavilyRes) results.push(tavilyRes)
    } catch (err) {
      console.error('Tavily search error:', err.message)
    }
  }

  if (results.length === 0) {
    // Fallbacks if no premium search API keys are provided
    try {
      const ddg = await searchDuckDuckGo(trimmed)
      if (ddg) results.push(ddg)
    } catch (err) {
      console.error('DuckDuckGo search error:', err.message)
    }

    try {
      const wiki = await searchWikipedia(trimmed)
      if (wiki) results.push(wiki)
    } catch (err) {
      console.error('Wikipedia search error:', err.message)
    }
  }

  return results.join('\n\n---\n\n')
}

module.exports = { searchWeb }

