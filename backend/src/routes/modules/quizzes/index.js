const { Router } = require('express')
const { authRequired } = require('../../../middleware/auth')
const { ApiError } = require('../../../utils/ApiError')
const Quiz = require('../../../models/Quiz')
const Question = require('../../../models/Question')
const Answer = require('../../../models/Answer')
const Note = require('../../../models/Note')
const Activity = require('../../../models/Activity')
const Profile = require('../../../models/Profile')
const { callStudyAIRaw } = require('../../../services/aiProvider')

const quizzesRouter = Router()

// Specialized Local Fallback Question Templates
const ML_QUESTIONS = [
  {
    prompt: "What is the primary splitting criterion used in the CART (Classification and Regression Trees) algorithm?",
    options: [
      { text: "Information Gain", isCorrect: false },
      { text: "Gini Impurity", isCorrect: true },
      { text: "Gain Ratio", isCorrect: false },
      { text: "Chi-Square", isCorrect: false }
    ],
    explanation: "CART uses Gini Impurity as its default split criterion, whereas C4.5 uses Information Gain or Gain Ratio.",
    difficulty: "medium",
    topic: "Decision Trees"
  },
  {
    prompt: "Which of the following describes the Gini Impurity range for a binary classification problem?",
    options: [
      { text: "0 to 1", isCorrect: false },
      { text: "-1 to 1", isCorrect: false },
      { text: "0 to 0.5", isCorrect: true },
      { text: "0 to 100", isCorrect: false }
    ],
    explanation: "For a binary classification task, Gini Impurity ranges from 0 (perfectly pure node) to 0.5 (equally distributed classes).",
    difficulty: "medium",
    topic: "Decision Trees"
  },
  {
    prompt: "What mathematical property is represented by Entropy in the context of decision trees?",
    options: [
      { text: "The impurity or randomness of a dataset", isCorrect: true },
      { text: "The classification accuracy", isCorrect: false },
      { text: "The linear correlation of features", isCorrect: false },
      { text: "The learning rate", isCorrect: false }
    ],
    explanation: "Entropy measures the impurity, disorder, or randomness in a group of samples. Lower entropy means higher purity.",
    difficulty: "easy",
    topic: "Decision Trees"
  },
  {
    prompt: "How does a Random Forest reduce the variance of individual decision trees?",
    options: [
      { text: "By pruning the decision trees post-construction", isCorrect: false },
      { text: "By using gradient descent to adjust feature weights", isCorrect: false },
      { text: "By averaging predictions (majority voting) across a diverse ensemble of trees trained on bootstrapped data", isCorrect: true },
      { text: "By making the trees deeper and more complex", isCorrect: false }
    ],
    explanation: "Random Forest builds many independent decision trees using bootstrap aggregating (bagging) and feature randomness. Averaging their predictions dramatically reduces variance without increasing bias.",
    difficulty: "hard",
    topic: "Random Forests"
  },
  {
    prompt: "What is the key difference between pre-pruning and post-pruning in decision trees?",
    options: [
      { text: "Pre-pruning is done before training, post-pruning is done during training", isCorrect: false },
      { text: "Pre-pruning stops tree growth early based on thresholds; post-pruning removes subtrees from a fully grown tree", isCorrect: true },
      { text: "Pre-pruning is only used for classification; post-pruning is only used for regression", isCorrect: false },
      { text: "There is no functional difference between the two", isCorrect: false }
    ],
    explanation: "Pre-pruning stops construction of the tree early (e.g., if max depth or minimum split samples are reached). Post-pruning lets the tree grow fully and then prunes back branches that don't improve validation accuracy.",
    difficulty: "medium",
    topic: "Decision Trees"
  }
]

const OS_QUESTIONS = [
  {
    prompt: "What is the primary difference between a process and a thread?",
    options: [
      { text: "A process is always preemptive, whereas a thread is non-preemptive", isCorrect: false },
      { text: "A process has its own isolated address space, while threads of a process share the same address space and resources", isCorrect: true },
      { text: "Processes are managed by the hardware, whereas threads are managed solely by user applications", isCorrect: false },
      { text: "Threads require more system overhead to create than processes", isCorrect: false }
    ],
    explanation: "A process is an execution of a program with isolated memory. A thread is a lightweight unit of execution within a process, sharing its memory and resources, making thread switches much faster.",
    difficulty: "medium",
    topic: "Processes and Threads"
  },
  {
    prompt: "Which CPU scheduling algorithm can suffer from the 'Convoy Effect'?",
    options: [
      { text: "Round Robin (RR)", isCorrect: false },
      { text: "Shortest Job First (SJF)", isCorrect: false },
      { text: "First-Come, First-Served (FCFS)", isCorrect: true },
      { text: "Priority Scheduling", isCorrect: false }
    ],
    explanation: "The Convoy Effect occurs in FCFS scheduling when a long, CPU-bound process blocks many short, I/O-bound processes, leading to low CPU and device utilization.",
    difficulty: "medium",
    topic: "CPU Scheduling"
  },
  {
    prompt: "Which of the following is NOT one of the four necessary Coffman conditions for a deadlock to occur?",
    options: [
      { text: "Mutual Exclusion", isCorrect: false },
      { text: "Hold and Wait", isCorrect: false },
      { text: "No Preemption", isCorrect: false },
      { text: "Preemptive Scheduling", isCorrect: true }
    ],
    explanation: "The four Coffman conditions for deadlocks are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Preemptive Scheduling is a CPU allocation strategy and not a deadlock condition.",
    difficulty: "easy",
    topic: "Deadlocks"
  },
  {
    prompt: "What is a semaphore in operating systems?",
    options: [
      { text: "An integer variable used to solve the critical section problem via signal and wait operations", isCorrect: true },
      { text: "A physical hardware switch that prevents concurrent memory access", isCorrect: false },
      { text: "A cache storage unit in the CPU core", isCorrect: false },
      { text: "A networking protocol for transferring system logs", isCorrect: false }
    ],
    explanation: "A semaphore is a protected integer variable that is accessed only through atomic operations: wait() (or P) and signal() (or V), designed to synchronize processes.",
    difficulty: "medium",
    topic: "Process Synchronization"
  },
  {
    prompt: "Which scheduling algorithm yields the optimal average waiting time for a given set of stationary processes?",
    options: [
      { text: "Round Robin", isCorrect: false },
      { text: "First-Come, First-Served", isCorrect: false },
      { text: "Shortest Job First (SJF)", isCorrect: true },
      { text: "Priority Scheduling", isCorrect: false }
    ],
    explanation: "Shortest Job First (SJF) is mathematically proven to be optimal, as it schedules the process with the shortest burst time first, thereby minimizing average waiting time.",
    difficulty: "hard",
    topic: "CPU Scheduling"
  }
]

const DSA_QUESTIONS = [
  {
    prompt: "What is the worst-case time complexity of searching for an element in a balanced Binary Search Tree (BST)?",
    options: [
      { text: "O(n)", isCorrect: false },
      { text: "O(log n)", isCorrect: true },
      { text: "O(n log n)", isCorrect: false },
      { text: "O(1)", isCorrect: false }
    ],
    explanation: "In a balanced BST (like AVL or Red-Black tree), the height is guaranteed to be logarithmic, so search, insertion, and deletion take O(log n) in the worst case.",
    difficulty: "easy",
    topic: "Binary Search Trees"
  },
  {
    prompt: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
    options: [
      { text: "Queue", isCorrect: false },
      { text: "Stack", isCorrect: true },
      { text: "Singly Linked List", isCorrect: false },
      { text: "Heap", isCorrect: false }
    ],
    explanation: "Stacks operate on LIFO, meaning the last element added (pushed) is the first one removed (popped). Queues operate on FIFO (First-In, First-Out).",
    difficulty: "easy",
    topic: "Stacks"
  },
  {
    prompt: "Which traversal algorithm uses a Queue as its primary auxiliary data structure?",
    options: [
      { text: "Depth-First Search (DFS)", isCorrect: false },
      { text: "Breadth-First Search (BFS)", isCorrect: true },
      { text: "In-order Traversal", isCorrect: false },
      { text: "Post-order Traversal", isCorrect: false }
    ],
    explanation: "BFS explores nodes level-by-level, utilizing a FIFO Queue to keep track of adjacent nodes. DFS uses a LIFO Stack or recursive call stack.",
    difficulty: "medium",
    topic: "Graphs"
  },
  {
    prompt: "What is the time complexity of inserting an element at the head of a standard singly linked list?",
    options: [
      { text: "O(1)", isCorrect: true },
      { text: "O(n)", isCorrect: false },
      { text: "O(log n)", isCorrect: false },
      { text: "O(n log n)", isCorrect: false }
    ],
    explanation: "Inserting at the head only requires updating the new node's next pointer to point to the current head and updating the head pointer, which takes constant time O(1).",
    difficulty: "medium",
    topic: "Linked Lists"
  },
  {
    prompt: "Which Big O notation represents quadratic time complexity?",
    options: [
      { text: "O(n log n)", isCorrect: false },
      { text: "O(n^2)", isCorrect: true },
      { text: "O(2^n)", isCorrect: false },
      { text: "O(n!)", isCorrect: false }
    ],
    explanation: "O(n^2) is quadratic complexity, commonly seen in nested loops like bubble sort or insertion sort. O(2^n) is exponential and O(n!) is factorial.",
    difficulty: "easy",
    topic: "Complexity Analysis"
  }
]

function getGenericQuestions(title, description) {
  const t = title || 'this study topic'
  return [
    {
      prompt: `Based on the material "${t}", what is the primary core objective of studying this subject?`,
      options: [
        { text: `To understand the fundamental definitions and structural implementation of ${t}`, isCorrect: true },
        { text: "To memorize historical timelines without practical application", isCorrect: false },
        { text: "To ignore the practical code implementations and diagrams", isCorrect: false },
        { text: "To replace all human-centered study techniques with external sources", isCorrect: false }
      ],
      explanation: `Studying "${t}" aims to establish core understandings of its parameters, theoretical formulations, and real-world architectures.`,
      difficulty: "easy",
      topic: "Introduction"
    },
    {
      prompt: `Which of the following best summarizes the key concepts discussed under "${t}"?`,
      options: [
        { text: "It covers obsolete data patterns that are no longer in practice", isCorrect: false },
        { text: `It offers detailed, structured methodologies to analyze and apply principles of ${t}`, isCorrect: true },
        { text: "It focuses solely on superficial definitions with no technical depth", isCorrect: false },
        { text: "It is an unorganized log of unrelated facts", isCorrect: false }
      ],
      explanation: `Structured academic content in "${t}" integrates solid concepts, comparative analyses, and application criteria for better evaluation.`,
      difficulty: "medium",
      topic: "Core Methodology"
    },
    {
      prompt: `Under what circumstances do the features or systems in "${t}" perform optimally?`,
      options: [
        { text: "Only when running under resource-constrained, random conditions", isCorrect: false },
        { text: "When structured according to recommended guidelines, design patterns, and constraints", isCorrect: true },
        { text: "When we bypass standard practices and verification layers", isCorrect: false },
        { text: "When used completely outside of its designed scope and framework", isCorrect: false }
      ],
      explanation: `Systematic design patterns and proper input validation are critical for the efficiency of systems relating to "${t}".`,
      difficulty: "medium",
      topic: "Optimization"
    },
    {
      prompt: `Why is the study of "${t}" highly significant in college and professional environments?`,
      options: [
        { text: "It helps in building foundations for advanced systems, solving problems, and passing certification tests", isCorrect: true },
        { text: "It is a decorative subject with no relevance to practical career paths", isCorrect: false },
        { text: "It serves only as a history lesson for software development", isCorrect: false },
        { text: "It has been completely superseded by basic models and requires no analytical thinking", isCorrect: false }
      ],
      explanation: `Expertise in "${t}" yields strong analytical and architectural capabilities, preparing students for high-scale challenges.`,
      difficulty: "medium",
      topic: "Significance"
    },
    {
      prompt: `Which of the following is a recommended best practice when learning or deploying solutions based on "${t}"?`,
      options: [
        { text: "Always skip testing and proceed straight to deploying fully deep systems", isCorrect: false },
        { text: "Conduct incremental testing, review edge cases, and utilize standard metrics for evaluation", isCorrect: true },
        { text: "Use arbitrary and unmeasured attributes throughout the system lifecycle", isCorrect: false },
        { text: "Never review error logs or diagnostic inputs", isCorrect: false }
      ],
      explanation: `Incremental testing, solid peer review, and logging are universal best practices that ensure robust implementations for "${t}".`,
      difficulty: "hard",
      topic: "Best Practices"
    }
  ]
}

// 1. Route to generate a new quiz from a PDF/Note
quizzesRouter.post('/generate', authRequired, async (req, res, next) => {
  try {
    const { noteId, mode, durationSec, questionCount = 5, syllabusText = '' } = req.body ?? {}
    if (!noteId) throw new ApiError(400, 'VALIDATION_ERROR', 'Missing noteId')

    const note = await Note.findById(noteId).populate('subjectId')
    if (!note) throw new ApiError(404, 'NOT_FOUND', 'Note not found')

    const title = note.title
    const description = note.description || ''
    const subject = note.subjectId?.name || 'General'

    let questionsToUse = null

    // Generate quiz via OpenRouter
    try {
        const prompt = `You are an expert college academic quiz generator. Generate a high-quality multiple choice quiz consisting of EXACTLY ${questionCount} questions based on the following study material.
Note Title: ${title}
Subject: ${subject}
Description: ${description}
${syllabusText ? `\nCRITICAL INSTRUCTION: The uploaded note may only cover a few topics. You MUST also ensure the quiz covers the following SYLLABUS TOPICS:\n${syllabusText}\n\nBlend the questions so they test both the specific note material and the broader syllabus provided above.\n` : ''}

Each question must have EXACTLY 4 options, with EXACTLY one correct option.
You MUST respond with a valid JSON array of question objects (and absolutely nothing else outside the array, no conversational text, no markdown wrapper unless standard json codeblock).
JSON schema to strictly follow:
[
  {
    "prompt": "Question text?",
    "options": [
      { "text": "Option A text", "isCorrect": false },
      { "text": "Option B text", "isCorrect": true },
      { "text": "Option C text", "isCorrect": false },
      { "text": "Option D text", "isCorrect": false }
    ],
    "explanation": "Detailed explanation of why the correct option is indeed correct.",
    "difficulty": "easy" | "medium" | "hard",
    "topic": "Specific sub-topic name"
  }
]
`

        const { text: contentStr } = await callStudyAIRaw({
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        })

        if (contentStr) {
          let jsonStr = contentStr.trim()
          if (jsonStr.includes('```')) {
            const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
            if (match) jsonStr = match[1]
          }
          questionsToUse = JSON.parse(jsonStr)
        }
    } catch (err) {
        console.error('OpenRouter quiz generation failed, falling back to local questions:', err)
    }

    // Fallback: Use smart templates based on topic or custom-structured generic questions
    if (!questionsToUse || !Array.isArray(questionsToUse) || questionsToUse.length === 0) {
      const lowerTitle = title.toLowerCase()
      const lowerDesc = description.toLowerCase()
      const lowerSubject = subject.toLowerCase()

      if (lowerTitle.includes('decision') || lowerTitle.includes('tree') || lowerTitle.includes('forest') || lowerDesc.includes('decision tree') || lowerTitle.includes('unit-3') || lowerTitle.includes('cn')) {
        questionsToUse = [...ML_QUESTIONS]
      } else if (lowerTitle.includes('operating') || lowerTitle.includes('os') || lowerTitle.includes('process') || lowerSubject.includes('operating') || lowerDesc.includes('process')) {
        questionsToUse = [...OS_QUESTIONS]
      } else if (lowerTitle.includes('data structure') || lowerTitle.includes('ds') || lowerTitle.includes('algorithm') || lowerSubject.includes('data') || lowerDesc.includes('structure')) {
        questionsToUse = [...DSA_QUESTIONS]
      } else {
        questionsToUse = getGenericQuestions(title, description)
      }

      // Ensure the generated questions match the requested count exactly
      if (questionsToUse.length < questionCount) {
        const extraNeeded = questionCount - questionsToUse.length
        for (let i = 0; i < extraNeeded; i++) {
          questionsToUse.push({
            prompt: `Application Analysis ${i + 1}: In the context of "${title || 'this academic topic'}", how is efficiency typically maintained?`,
            options: [
              { text: "Through systematic integration and adherence to best practices.", isCorrect: true },
              { text: "By bypassing standard validation constraints.", isCorrect: false },
              { text: "By utilizing deprecated and unsupported paradigms.", isCorrect: false },
              { text: "It is impossible to maintain efficiency in this context.", isCorrect: false }
            ],
            explanation: "Maintaining efficiency universally relies on systematic integration, proper architectural practices, and standard validations.",
            difficulty: "hard",
            topic: "Advanced Application"
          })
        }
      } else if (questionsToUse.length > questionCount) {
        questionsToUse = questionsToUse.slice(0, questionCount)
      }
    }

    // Create the Quiz record
    const quiz = await Quiz.create({
      ownerId: req.user.sub,
      noteId,
      subjectId: note.subjectId?._id || note.subjectId,
      title: `${title} Quiz`,
      mode: mode || 'practice',
      durationSec: mode === 'timed' ? (durationSec || 600) : 0,
      questionCount: questionsToUse.length,
      status: 'published'
    })

    // Create the Question records
    const questionsToSave = questionsToUse.map((q, idx) => ({
      quizId: quiz._id,
      prompt: q.prompt,
      options: q.options,
      explanation: q.explanation || 'No explanation provided.',
      difficulty: q.difficulty || 'medium',
      topic: q.topic || 'General',
      order: idx
    }))

    const savedQuestions = await Question.insertMany(questionsToSave)

    // Log Activity: Start Quiz
    await Activity.create({
      userId: req.user.sub,
      type: 'quiz_start',
      refId: quiz._id
    })

    res.json({
      ok: true,
      quiz,
      questions: savedQuestions
    })
  } catch (e) {
    next(e)
  }
})

// 2. Route to get all quizzes owned by the current user
quizzesRouter.get('/', authRequired, async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ ownerId: req.user.sub })
      .sort({ createdAt: -1 })
      .populate('subjectId')
      .populate('noteId', 'title')
      .lean()

    const finishes = await Activity.find({
      userId: req.user.sub,
      type: 'quiz_finish'
    })

    const scoresMap = {}
    for (const f of finishes) {
      if (f.refId) {
        const qid = f.refId.toString()
        if (!scoresMap[qid] || (f.meta && f.meta.score > scoresMap[qid].score)) {
          scoresMap[qid] = f.meta || { score: 0, total: 0 }
        }
      }
    }

    const quizzesWithScores = quizzes.map(q => ({
      ...q,
      bestScore: scoresMap[q._id.toString()] || null
    }))

    res.json({
      ok: true,
      quizzes: quizzesWithScores
    })
  } catch (e) {
    next(e)
  }
})

// 3. Route to get a specific quiz details and its questions
quizzesRouter.get('/:id', authRequired, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('subjectId')
      .populate('noteId', 'title')

    if (!quiz) throw new ApiError(404, 'NOT_FOUND', 'Quiz not found')

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1 })

    res.json({
      ok: true,
      quiz,
      questions
    })
  } catch (e) {
    next(e)
  }
})

// 4. Route to submit quiz answers and evaluate performance
quizzesRouter.post('/:id/submit', authRequired, async (req, res, next) => {
  try {
    const { answers = [] } = req.body ?? {}
    const quiz = await Quiz.findById(req.params.id)
    if (!quiz) throw new ApiError(404, 'NOT_FOUND', 'Quiz not found')

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1 })
    
    let score = 0
    const results = []
    const answersToCreate = []

    for (const question of questions) {
      const submittedAnswer = answers.find(a => a.questionId === question._id.toString())
      const selectedOptionIndex = submittedAnswer ? submittedAnswer.selectedOptionIndex : -1
      
      const correctOptionIndex = question.options.findIndex(opt => opt.isCorrect === true)
      const isCorrect = selectedOptionIndex === correctOptionIndex
      
      if (isCorrect) {
        score++
      }

      results.push({
        questionId: question._id,
        prompt: question.prompt,
        selectedOptionIndex,
        correctOptionIndex,
        isCorrect,
        explanation: question.explanation,
        options: question.options
      })

      // If they attempted, save to database
      if (selectedOptionIndex !== -1) {
        answersToCreate.push({
          userId: req.user.sub,
          quizId: quiz._id,
          questionId: question._id,
          selectedOptionIndex,
          isCorrect,
          timeTakenMs: submittedAnswer.timeTakenMs || 0
        })
      }
    }

    if (answersToCreate.length > 0) {
      await Answer.insertMany(answersToCreate)
    }

    // Award gamified XP: 15 XP base for quiz completion + 10 XP for each correct answer!
    const xpEarned = 15 + (score * 10)
    await Profile.findOneAndUpdate(
      { userId: req.user.sub },
      { $inc: { xp: xpEarned } },
      { upsert: true }
    )

    // Log Activity: Finish Quiz
    await Activity.create({
      userId: req.user.sub,
      type: 'quiz_finish',
      refId: quiz._id,
      meta: {
        score,
        total: questions.length,
        xpEarned
      }
    })

    res.json({
      ok: true,
      score,
      totalQuestions: questions.length,
      xpEarned,
      results
    })
  } catch (e) {
    next(e)
  }
})

module.exports = { quizzesRouter }
