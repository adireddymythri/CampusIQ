const mongoose = require('mongoose')

const NoteSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 2000 },

    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', index: true },
    unit: { type: String, trim: true, index: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    documentType: {
      type: String,
      enum: ['note', 'paper'],
      default: 'note',
      index: true,
    },

    file: {
      url: { type: String, required: true },
      publicId: { type: String },
      bytes: { type: Number },
      format: { type: String },
      originalName: { type: String },
      fileHash: { type: String, index: true },
    },

    stats: {
      views: { type: Number, default: 0, index: true },
      downloads: { type: Number, default: 0, index: true },
      bookmarks: { type: Number, default: 0, index: true },
    },

    rating: {
      avg: { type: Number, default: 0, min: 0, max: 5, index: true },
      count: { type: Number, default: 0 },
    },

    isFacultyVerified: { type: Boolean, default: false, index: true },
    facultyVerifiedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    ai: {
      summary: { type: String },
      keyPoints: [{ type: String }],
      summaryUpdatedAt: { type: Date },
      extractedText: { type: String },
      extractedAt: { type: Date },
    },
  },
  { timestamps: true },
)

NoteSchema.index({ title: 'text', description: 'text' })
NoteSchema.index({ subjectId: 1, semesterId: 1, branchId: 1 })

module.exports = mongoose.model('Note', NoteSchema)

