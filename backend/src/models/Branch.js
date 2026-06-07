const mongoose = require('mongoose')

const BranchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
  },
  { timestamps: true },
)

BranchSchema.index({ code: 1 }, { unique: true })
BranchSchema.index({ name: 1 })

module.exports = mongoose.model('Branch', BranchSchema)

