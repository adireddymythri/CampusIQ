const pdfParse = require('pdf-parse')

const MAX_CHARS = 48000

function isLikelyPdf(note) {
  if (!note?.file?.url) return false
  const format = (note.file.format || '').toLowerCase()
  const name = (note.file.originalName || '').toLowerCase()
  const url = note.file.url.toLowerCase()
  return (
    format === 'pdf' ||
    name.endsWith('.pdf') ||
    url.includes('.pdf') ||
    url.includes('/raw/') ||
    format === 'bin' && name.endsWith('.pdf')
  )
}

function cloudinaryPdfUrl(url) {
  if (!url.includes('cloudinary.com')) return url
  // Force raw PDF delivery from Cloudinary
  if (url.includes('/upload/') && !url.includes('/raw/upload/')) {
    return url.replace('/upload/', '/raw/upload/')
  }
  return url
}

async function fetchPdfBuffer(url) {
  const candidates = [url, cloudinaryPdfUrl(url)]
  let lastError = null

  for (const tryUrl of [...new Set(candidates)]) {
    try {
      const res = await fetch(tryUrl, {
        headers: { Accept: 'application/pdf,*/*' },
        signal: AbortSignal.timeout(45000),
        redirect: 'follow',
      })
      if (!res.ok) {
        lastError = new Error(`Failed to fetch PDF (${res.status})`)
        continue
      }
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
        return buf
      }
      lastError = new Error('Downloaded file is not a valid PDF')
    } catch (err) {
      lastError = err
    }
  }
  throw lastError || new Error('Failed to fetch PDF')
}

async function extractTextFromUrl(url) {
  const buffer = await fetchPdfBuffer(url)
  const parsed = await pdfParse(buffer)
  const text = (parsed.text || '').replace(/\s+/g, ' ').trim()
  if (!text) throw new Error('No readable text found in PDF')
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n\n[Content truncated due to length…]` : text
}

async function getNotePdfText(note) {
  if (!note?.file?.url) return ''

  if (note.ai?.extractedText) return note.ai.extractedText

  if (!isLikelyPdf(note)) {
    // Still attempt extraction — Cloudinary may not set format correctly
    try {
      const text = await extractTextFromUrl(note.file.url)
      note.ai = note.ai || {}
      note.ai.extractedText = text
      note.ai.extractedAt = new Date()
      await note.save()
      return text
    } catch {
      return ''
    }
  }

  const text = await extractTextFromUrl(note.file.url)
  note.ai = note.ai || {}
  note.ai.extractedText = text
  note.ai.extractedAt = new Date()
  await note.save()
  return text
}

module.exports = { extractTextFromUrl, getNotePdfText, MAX_CHARS, isLikelyPdf }
