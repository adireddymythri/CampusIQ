const { Router } = require('express')
const { authRouter } = require('./modules/auth')
const { notesRouter } = require('./modules/notes')
const { aiRouter } = require('./modules/ai')
const { dashboardRouter } = require('./modules/dashboard')
const { quizzesRouter } = require('./modules/quizzes')
const { profileRouter } = require('./modules/profile')

const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/notes', notesRouter)
apiRouter.use('/ai', aiRouter)
apiRouter.use('/dashboard', dashboardRouter)
apiRouter.use('/quizzes', quizzesRouter)
apiRouter.use('/profile', profileRouter)

module.exports = { apiRouter }


