import express from 'express'
import { 
    getExamByCourseId, 
    getExamResults, 
    submitExam, 
    getUserBestScore 
} from '../controllers/examController.js'

const examRouter = express.Router()

// Get Exam by Course ID
examRouter.get('/:courseId', getExamByCourseId)

// Get Exam Results by Course ID and User ID
examRouter.get('/:courseId/results', getExamResults)

// Submit Exam
examRouter.post('/:courseId/submit', submitExam)

// Get User's Best Score for Course
examRouter.get('/:courseId/best-score', getUserBestScore)

export default examRouter