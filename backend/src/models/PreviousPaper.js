const mongoose = require('mongoose')

const PreviousPaperSchema = new mongoose.Schema(
  {
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', index: true },
    year: { type: Number, required: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    file: {
      url: { type: String, required: true },
      publicId: { type: String },
      bytes: { type: Number },
      format: { type: String },
    },
    isFacultyVerified: { type: Boolean, default: false, index: true },
    facultyVerifiedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    downloads: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
)

PreviousPaperSchema.index({ year: -1, subjectId: 1 })

module.exports = mongoose.model('PreviousPaper', PreviousPaperSchema)

