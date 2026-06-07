const mongoose = require('mongoose')

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', index: true },
  },
  { timestamps: true },
)

SubjectSchema.index({ name: 1 })

module.exports = mongoose.model('Subject', SubjectSchema)

