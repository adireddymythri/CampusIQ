const { Router } = require('express')
const { authRequired } = require('../../../middleware/auth')
const { ApiError } = require('../../../utils/ApiError')
const Note = require('../../../models/Note')
const AIConversation = require('../../../models/AIConversation')
const { getNotePdfText } = require('../../../services/pdfExtract')
const { generateStudyAnswer, generateStudySummary, getActiveProviders } = require('../../../services/aiAssistant')

const aiRouter = Router()

async function loadNoteContext(noteId) {
  let title = 'General Study'
  let subject = 'General'
  let description = ''
  let pdfText = ''
  let note = null

  if (noteId) {
    note = await Note.findById(noteId).populate('subjectId')
    if (note) {
      title = note.title
      description = note.description || ''
      subject = note.subjectId?.name || 'General'
      try {
        pdfText = await getNotePdfText(note)
      } catch (err) {
        console.error('PDF extraction failed:', err.message)
      }
    }
  }

  return { title, subject, description, pdfText, note }
}

aiRouter.post('/summarize', authRequired, async (req, res, next) => {
  try {
    const { noteId } = req.body ?? {}
    if (!noteId) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing noteId')

    const note = await Note.findById(noteId).populate('subjectId')
    if (!note) throw new ApiError(404, 'NOT_FOUND', 'Note not found')

    const title = note.title
    const description = note.description || ''
    const subject = note.subjectId?.name || 'General'

    let pdfText = ''
    let pdfError = null
    try {
      pdfText = await getNotePdfText(note)
    } catch (err) {
      pdfError = err.message
      console.error('PDF extraction failed:', err.message)
    }

    const { summary, source, aiError } = await generateStudySummary({
      title,
      subject,
      description,
      pdfText,
    })

    if (source === 'openrouter') {
      note.ai = note.ai || {}
      note.ai.summary = summary
      note.ai.summaryUpdatedAt = new Date()
      await note.save()
    }

    const providers = getActiveProviders()
    res.json({
      ok: true,
      summary,
      meta: {
        source,
        hasPdfContent: Boolean(pdfText),
        pdfError,
        aiError,
        ...providers,
      },
    })
  } catch (e) {
    next(e)
  }
})

aiRouter.post('/query', authRequired, async (req, res, next) => {
  try {
    const { noteId, question, history, enableWebSearch } = req.body ?? {}
    if (!question?.trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing question')

    const { title, subject, description, pdfText } = await loadNoteContext(noteId)

    const { answer, usedWebSearch, usedPdf, source, aiError } = await generateStudyAnswer({
      question: question.trim(),
      title,
      subject,
      description,
      pdfText,
      history,
      enableWebSearch: enableWebSearch !== false,
    })

    const providers = getActiveProviders()
    res.json({
      ok: true,
      answer,
      meta: {
        source,
        usedWebSearch,
        usedPdf,
        aiError,
        ...providers,
      },
    })
  } catch (e) {
    next(e)
  }
})

aiRouter.post('/save', authRequired, async (req, res, next) => {
  try {
    const { noteId, messages } = req.body ?? {}
    if (!messages || !Array.isArray(messages)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Missing or invalid messages array')
    }

    let conversation = await AIConversation.findOne({ user: req.user.sub, note: noteId || null })
    if (conversation) {
      conversation.messages = messages
      await conversation.save()
    } else {
      conversation = await AIConversation.create({
        user: req.user.sub,
        note: noteId || null,
        messages
      })
    }

    res.json({ ok: true, conversation })
  } catch (e) {
    next(e)
  }
})

aiRouter.get('/history', authRequired, async (req, res, next) => {
  try {
    const { noteId } = req.query
    const query = { user: req.user.sub }
    if (noteId) {
      query.note = noteId
    } else {
      query.note = null
    }

    const conversation = await AIConversation.findOne(query)
    res.json({ ok: true, conversation })
  } catch (e) {
    next(e)
  }
})

module.exports = { aiRouter }
