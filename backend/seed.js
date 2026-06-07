require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('./src/models/User')
const Note = require('./src/models/Note')
const Branch = require('./src/models/Branch')
const Semester = require('./src/models/Semester')
const Subject = require('./src/models/Subject')

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Delete and recreate the default user with a valid password hash for easy developer login
    await User.deleteOne({ email: 'arjun@college.edu' })
    const hashedPassword = await bcrypt.hash('password123', 12)
    const user = await User.create({
      name: 'Arjun',
      email: 'arjun@college.edu',
      passwordHash: hashedPassword,
      isEmailVerified: true,
      authProvider: 'password'
    })
    console.log('Created user Arjun with password: password123')

    // Create some branches, semesters, subjects if they don't exist
    let branch = await Branch.findOne({ code: 'CSE' })
    if (!branch) {
      branch = await Branch.create({ name: 'Computer Science', code: 'CSE' })
    }

    let sem = await Semester.findOne({ number: 3 })
    if (!sem) {
      sem = await Semester.create({ number: 3, name: 'Semester 3' })
    }

    let subj1 = await Subject.findOne({ code: 'CS301' })
    if (!subj1) {
      subj1 = await Subject.create({ name: 'Data Structures', code: 'CS301', branchId: branch._id, semesterId: sem._id })
    }

    let subj2 = await Subject.findOne({ code: 'CS302' })
    if (!subj2) {
      subj2 = await Subject.create({ name: 'Operating Systems', code: 'CS302', branchId: branch._id, semesterId: sem._id })
    }
    
    let subj3 = await Subject.findOne({ code: 'CS303' })
    if (!subj3) {
      subj3 = await Subject.create({ name: 'Database Management', code: 'CS303', branchId: branch._id, semesterId: sem._id })
    }

    // Add some notes if none exist
    const noteCount = await Note.countDocuments()
    if (noteCount === 0) {
      const mockNotes = [
        {
          ownerId: user._id,
          title: 'Data Structures - Unit 2',
          description: 'Comprehensive notes on Trees and Graphs',
          branchId: branch._id,
          semesterId: sem._id,
          unit: 'Unit 2',
          file: { url: 'https://example.com/ds.pdf' },
          stats: { views: 1200 },
          rating: { avg: 4.8, count: 50 }
        },
        {
          ownerId: user._id,
          title: 'Operating Systems - Unit 1',
          description: 'Introduction to Process Management',
          branchId: branch._id,
          semesterId: sem._id,
          unit: 'Unit 1',
          file: { url: 'https://example.com/os.pdf' },
          stats: { views: 982 },
          rating: { avg: 4.7, count: 40 }
        },
        {
          ownerId: user._id,
          title: 'Database Management Systems',
          description: 'SQL and NoSQL deep dive',
          branchId: branch._id,
          semesterId: sem._id,
          unit: 'Full',
          file: { url: 'https://example.com/dbms.pdf' },
          stats: { views: 1500 },
          rating: { avg: 4.9, count: 80 }
        }
      ]
      await Note.insertMany(mockNotes)
      console.log('Inserted mock notes')
    }

    console.log('Seeding complete')
    process.exit(0)
  } catch (e) {
    console.error('Seeding failed:', e)
    process.exit(1)
  }
}

seed()
