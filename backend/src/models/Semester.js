const mongoose = require('mongoose')

const SemesterSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, min: 1, max: 12, unique: true },
    name: { type: String, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Semester', SemesterSchema)

