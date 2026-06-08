const { Router } = require('express')
const multer = require('multer')
const crypto = require('crypto')
const pdfParse = require('pdf-parse')

const { authRequired } = require('../../../middleware/auth')
const { ApiError } = require('../../../utils/ApiError')
const { uploadToCloudinary } = require('../../../services/cloudinary')
const Note = require('../../../models/Note')
const Activity = require('../../../models/Activity')
const Profile = require('../../../models/Profile')
const Branch = require('../../../models/Branch')
const Semester = require('../../../models/Semester')
const Subject = require('../../../models/Subject')

const notesRouter = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
})

notesRouter.post('/upload', authRequired, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing file')
    const { title, description, subjectId, subjectName, semesterId, branchId, unit, difficulty, documentType } = req.body ?? {}
    
    if (!title) throw new ApiError(400, 'VALIDATION_ERROR', 'Document Title is required')
    if (!documentType) throw new ApiError(400, 'VALIDATION_ERROR', 'Document Type is required')
    if (!branchId) throw new ApiError(400, 'VALIDATION_ERROR', 'Branch is required')
    if (!semesterId) throw new ApiError(400, 'VALIDATION_ERROR', 'Semester is required')
    if (!subjectId && !subjectName) throw new ApiError(400, 'VALIDATION_ERROR', 'Subject is required')
    if (!unit) throw new ApiError(400, 'VALIDATION_ERROR', 'Unit is required')
    if (!difficulty) throw new ApiError(400, 'VALIDATION_ERROR', 'Difficulty is required')
    if (!description) throw new ApiError(400, 'VALIDATION_ERROR', 'Description is required')

    let finalSubjectId = subjectId;
    if (!finalSubjectId && subjectName) {
      let subject = await Subject.findOne({ name: { $regex: new RegExp(`^${subjectName}$`, 'i') } });
      if (!subject) {
        subject = await Subject.create({ name: subjectName, branchId, semesterId });
      }
      finalSubjectId = subject._id;
    }

    // Parse information: compute hash to detect exact duplicate papers/notes
    // We parse the PDF text so that identical matter is caught even if the file metadata changed.
    let contentToHash = req.file.buffer
    try {
      if (req.file.originalname.toLowerCase().endsWith('.pdf') || req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer)
        const text = (parsed.text || '').replace(/\s+/g, ' ').trim()
        if (text) contentToHash = text
      }
    } catch (e) {
      console.warn('PDF parse failed for hash, falling back to binary buffer hash')
    }

    const fileHash = crypto.createHash('md5').update(contentToHash).digest('hex')
    
    const isPaper = documentType === 'paper'
    const existingDoc = await Note.findOne({ 
      'file.fileHash': fileHash, 
      documentType: isPaper ? 'paper' : { $ne: 'paper' } 
    })

    if (existingDoc) {
      const typeStr = isPaper ? 'question paper' : 'study note'
      throw new ApiError(409, 'DUPLICATE_FILE', `This exact ${typeStr} has already been uploaded as "${existingDoc.title}".`)
    }

    const result = await uploadToCloudinary(req.file)
    
    const note = await Note.create({
      ownerId: req.user.sub,
      title,
      description,
      subjectId: finalSubjectId,
      semesterId,
      branchId,
      unit,
      difficulty,
      documentType: documentType === 'paper' ? 'paper' : 'note',
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
        originalName: req.file.originalname,
        fileHash
      }
    })

    // Record activity and reward XP
    await Activity.create({
      userId: req.user.sub,
      type: 'note_upload',
      refId: note._id
    })
    
    await Profile.findOneAndUpdate(
      { userId: req.user.sub },
      { $inc: { xp: 50 } },
      { upsert: true }
    )

    res.json({ ok: true, note })
  } catch (e) {
    next(e)
  }
})

notesRouter.get('/', authRequired, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, branch, semester, subject, unit, difficulty, rating, documentType = 'note' } = req.query
    const query = documentType === 'note' ? { documentType: { $ne: 'paper' } } : { documentType }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { unit: { $regex: search, $options: 'i' } }
      ]
    }

    if (branch && branch !== 'all') query.branchId = branch
    if (semester && semester !== 'all') query.semesterId = semester
    if (subject && subject !== 'all') query.subjectId = subject
    if (unit && unit !== 'all') query.unit = unit
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty.toLowerCase()
    if (rating && rating !== 'all') {
      query['rating.avg'] = { $gte: Number(rating) }
    }

    const [items, total] = await Promise.all([
      Note.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('subjectId')
        .populate('ownerId', 'name')
        .populate('branchId')
        .populate('semesterId'),
      Note.countDocuments(query)
    ])

    res.json({ 
      ok: true, 
      items, 
      pageInfo: { page: Number(page), limit: Number(limit), total } 
    })
  } catch (e) {
    next(e)
  }
})

notesRouter.get('/filters', authRequired, async (req, res, next) => {
  try {
    const [branches, semesters, subjects, units] = await Promise.all([
      Branch.find({}),
      Semester.find({}),
      Subject.find({}),
      Note.distinct('unit', { unit: { $ne: null } })
    ])
    res.json({
      ok: true,
      branches,
      semesters,
      subjects,
      units: units.filter(Boolean)
    })
  } catch (e) {
    next(e)
  }
})

notesRouter.get('/:id', authRequired, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('subjectId')
      .populate('ownerId', 'name')
    
    if (!note) throw new ApiError(404, 'NOT_FOUND', 'Note not found')

    // Record view activity (if not already viewed recently by this user to prevent spam)
    const existingView = await Activity.findOne({
      userId: req.user.sub,
      type: 'note_view',
      refId: note._id,
      createdAt: { $gt: new Date(Date.now() - 3600000) } // within last hour
    })

    if (!existingView) {
      await Activity.create({
        userId: req.user.sub,
        type: 'note_view',
        refId: note._id
      })
      
      note.stats.views += 1
      await note.save()

      // Small XP reward for learning
      await Profile.findOneAndUpdate(
        { userId: req.user.sub },
        { $inc: { xp: 2 } },
        { upsert: true }
      )
    }

    res.json({ ok: true, note })
  } catch (e) {
    next(e)
  }
})

notesRouter.post('/:id/rate', authRequired, async (req, res, next) => {
  try {
    const { rating } = req.body ?? {}
    const ratingNum = Number(rating)

    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Rating must be a number between 1 and 5')
    }

    const note = await Note.findById(req.params.id)
    if (!note) throw new ApiError(404, 'NOT_FOUND', 'Note not found')

    // Recalculate average rating
    const oldCount = note.rating.count || 0
    const oldAvg = note.rating.avg || 0
    const newCount = oldCount + 1
    const newAvg = ((oldAvg * oldCount) + ratingNum) / newCount

    note.rating.count = newCount
    note.rating.avg = Math.round(newAvg * 100) / 100 // Keep to 2 decimal places
    await note.save()

    // Create activity log
    await Activity.create({
      userId: req.user.sub,
      type: 'note_rate',
      refId: note._id
    })

    // Reward XP for reviewing/rating
    await Profile.findOneAndUpdate(
      { userId: req.user.sub },
      { $inc: { xp: 5 } },
      { upsert: true }
    )

    res.json({ 
      ok: true, 
      avg: note.rating.avg, 
      count: note.rating.count 
    })
  } catch (e) {
    next(e)
  }
})

notesRouter.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id)
    if (!note) throw new ApiError(404, 'NOT_FOUND', 'Note not found')

    if (note.ownerId.toString() !== req.user.sub) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only delete your own uploads')
    }

    await Note.findByIdAndDelete(req.params.id)
    
    // Optional: Also delete from cloudinary, subtract XP, etc.
    // We'll just do a DB delete for simplicity
    
    res.json({ ok: true, message: 'Deleted successfully' })
  } catch (e) {
    next(e)
  }
})

module.exports = { notesRouter }
