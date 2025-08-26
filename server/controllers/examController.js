import Exam from "../models/Exam.js"
import ExamResult from "../models/ExamResult.js"
import Course from "../models/Course.js"

// Get Exam by Course ID
export const getExamByCourseId = async (req, res) => {
    const { courseId } = req.params

    try {
        const exam = await Exam.findOne({ courseId, isActive: true })
            .populate('courseId', 'title')

        if (!exam) {
            return res.json({ success: false, message: 'No active exam found for this course' })
        }

        res.json({ success: true, exam })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Exam Results by Course ID and User ID
export const getExamResults = async (req, res) => {
    const { courseId } = req.params
    const { userId } = req.query

    try {
        const results = await ExamResult.find({ courseId, userId })
            .populate('examId', 'title')
            .sort({ createdAt: -1 })

        res.json({ success: true, results })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Submit Exam
export const submitExam = async (req, res) => {
    const { courseId } = req.params
    const { userId, answers, timeSpent, startedAt } = req.body

    try {
        // Get the exam
        const exam = await Exam.findOne({ courseId, isActive: true })
        if (!exam) {
            return res.json({ success: false, message: 'Exam not found or inactive' })
        }

        // Check if user has exceeded max attempts
        const previousAttempts = await ExamResult.countDocuments({ 
            userId, 
            examId: exam._id 
        })

        if (previousAttempts >= exam.maxAttempts) {
            return res.json({ 
                success: false, 
                message: `Maximum attempts (${exam.maxAttempts}) exceeded` 
            })
        }

        // Calculate score
        let totalPoints = 0
        let maxPoints = 0
        const gradedAnswers = []

        exam.questions.forEach(question => {
            const userAnswer = answers.find(a => a.questionId === question.questionId)
            const isCorrect = userAnswer && userAnswer.selectedAnswer === question.correctAnswer
            
            gradedAnswers.push({
                questionId: question.questionId,
                selectedAnswer: userAnswer ? userAnswer.selectedAnswer : '',
                isCorrect,
                points: isCorrect ? question.points : 0
            })

            if (isCorrect) totalPoints += question.points
            maxPoints += question.points
        })

        const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0
        const passed = score >= exam.passingScore

        // Create exam result
        const examResult = new ExamResult({
            userId,
            examId: exam._id,
            courseId,
            attemptNumber: previousAttempts + 1,
            answers: gradedAnswers,
            score,
            totalPoints,
            maxPoints,
            passed,
            timeSpent,
            startedAt: new Date(startedAt),
            submittedAt: new Date(),
            certificateEligible: score === 100,
            certificateIssued: false
        })

        await examResult.save()

        res.json({ 
            success: true, 
            result: examResult,
            message: passed ? 'Exam passed successfully!' : 'Exam completed. Try again to improve your score.' 
        })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get User's Best Score for Course
export const getUserBestScore = async (req, res) => {
    const { courseId } = req.params
    const { userId } = req.query

    try {
        const bestResult = await ExamResult.findOne({ courseId, userId })
            .sort({ score: -1 })
            .populate('examId', 'title passingScore')

        if (!bestResult) {
            return res.json({ success: false, message: 'No exam attempts found' })
        }

        res.json({ success: true, bestResult })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}