import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const Exam = () => {
    const { courseId } = useParams()
    const navigate = useNavigate()
    
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [answers, setAnswers] = useState({})
    const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds
    const [examStarted, setExamStarted] = useState(false)
    const [examSubmitted, setExamSubmitted] = useState(false)
    const [loading] = useState(false)
    const [startTime, setStartTime] = useState(null)
    const [showResults, setShowResults] = useState(false)
    const [examResult, setExamResult] = useState(null)

    // Hardcoded exam data - no database needed
    const examData = {
        _id: 'sample_exam_1',
        title: 'Programming Fundamentals Quiz',
        description: 'Test your knowledge of programming fundamentals',
        timeLimit: 30, // minutes
        passingScore: 70, // percentage
        maxAttempts: 3,
        questions: [
            {
                questionId: 'q1',
                questionText: 'What is the correct syntax for declaring a variable in JavaScript?',
                options: [
                    { optionId: 'a', optionText: 'var myVariable;' },
                    { optionId: 'b', optionText: 'variable myVariable;' },
                    { optionId: 'c', optionText: 'v myVariable;' },
                    { optionId: 'd', optionText: 'declare myVariable;' }
                ],
                correctAnswer: 'a',
                points: 1
            },
            {
                questionId: 'q2',
                questionText: 'Which of the following is NOT a primitive data type in JavaScript?',
                options: [
                    { optionId: 'a', optionText: 'string' },
                    { optionId: 'b', optionText: 'number' },
                    { optionId: 'c', optionText: 'array' },
                    { optionId: 'd', optionText: 'boolean' }
                ],
                correctAnswer: 'c',
                points: 1
            },
            {
                questionId: 'q3',
                questionText: 'What does CSS stand for?',
                options: [
                    { optionId: 'a', optionText: 'Computer Style Sheets' },
                    { optionId: 'b', optionText: 'Cascading Style Sheets' },
                    { optionId: 'c', optionText: 'Creative Style Sheets' },
                    { optionId: 'd', optionText: 'Colorful Style Sheets' }
                ],
                correctAnswer: 'b',
                points: 1
            },
            {
                questionId: 'q4',
                questionText: 'Which HTML tag is used to create a hyperlink?',
                options: [
                    { optionId: 'a', optionText: '<link>' },
                    { optionId: 'b', optionText: '<a>' },
                    { optionId: 'c', optionText: '<href>' },
                    { optionId: 'd', optionText: '<url>' }
                ],
                correctAnswer: 'b',
                points: 1
            },
            {
                questionId: 'q5',
                questionText: 'What is the purpose of the "useState" hook in React?',
                options: [
                    { optionId: 'a', optionText: 'To manage component state' },
                    { optionId: 'b', optionText: 'To fetch data from APIs' },
                    { optionId: 'c', optionText: 'To handle user events' },
                    { optionId: 'd', optionText: 'To style components' }
                ],
                correctAnswer: 'a',
                points: 1
            },
            {
                questionId: 'q6',
                questionText: 'Which method is used to add an element to the end of an array in JavaScript?',
                options: [
                    { optionId: 'a', optionText: 'append()' },
                    { optionId: 'b', optionText: 'add()' },
                    { optionId: 'c', optionText: 'push()' },
                    { optionId: 'd', optionText: 'insert()' }
                ],
                correctAnswer: 'c',
                points: 1
            },
            {
                questionId: 'q7',
                questionText: 'What is the correct way to comment in JavaScript?',
                options: [
                    { optionId: 'a', optionText: '<!-- This is a comment -->' },
                    { optionId: 'b', optionText: '// This is a comment' },
                    { optionId: 'c', optionText: '# This is a comment' },
                    { optionId: 'd', optionText: '/* This is a comment */' }
                ],
                correctAnswer: 'b',
                points: 1
            },
            {
                questionId: 'q8',
                questionText: 'Which of the following is the correct syntax for a for loop in JavaScript?',
                options: [
                    { optionId: 'a', optionText: 'for (i = 0; i < 5; i++)' },
                    { optionId: 'b', optionText: 'for i = 0 to 5' },
                    { optionId: 'c', optionText: 'for (i in 5)' },
                    { optionId: 'd', optionText: 'foreach (i < 5)' }
                ],
                correctAnswer: 'a',
                points: 1
            },
            {
                questionId: 'q9',
                questionText: 'What does JSON stand for?',
                options: [
                    { optionId: 'a', optionText: 'JavaScript Object Notation' },
                    { optionId: 'b', optionText: 'Java Standard Object Notation' },
                    { optionId: 'c', optionText: 'JavaScript Online Notation' },
                    { optionId: 'd', optionText: 'Java Source Object Notation' }
                ],
                correctAnswer: 'a',
                points: 1
            },
            {
                questionId: 'q10',
                questionText: 'Which of the following is NOT a JavaScript framework or library?',
                options: [
                    { optionId: 'a', optionText: 'React' },
                    { optionId: 'b', optionText: 'Vue.js' },
                    { optionId: 'c', optionText: 'Laravel' },
                    { optionId: 'd', optionText: 'Angular' }
                ],
                correctAnswer: 'c',
                points: 1
            }
        ]
    }

    const courseData = {
        _id: courseId || 'sample_course',
        courseTitle: 'Complete Web Development Course'
    }

    // localStorage helper functions
    const getStorageKey = (suffix) => `exam_${courseId}_${suffix}`
    
    const getStoredResults = () => {
        const stored = localStorage.getItem(getStorageKey('results'))
        return stored ? JSON.parse(stored) : []
    }
    
    const storeResult = (result) => {
        const results = getStoredResults()
        results.push(result)
        localStorage.setItem(getStorageKey('results'), JSON.stringify(results))
    }
    
    const getAttemptCount = () => {
        return getStoredResults().length
    }

    // Timer effect
    useEffect(() => {
        let interval = null
        if (examStarted && !examSubmitted && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        submitExam(true) // Auto-submit when time expires
                        return 0
                    }
                    return prevTime - 1
                })
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [examStarted, examSubmitted, timeLeft])

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Start exam
    const startExam = () => {
        // Check attempt limit
        if (getAttemptCount() >= examData.maxAttempts) {
            toast.error(`Maximum attempts (${examData.maxAttempts}) exceeded`)
            return
        }
        
        setExamStarted(true)
        setStartTime(new Date())
        setTimeLeft(examData.timeLimit * 60) // Reset timer
        toast.success('Exam started! Good luck!')
    }

    // Handle answer selection
    const handleAnswerSelect = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }))
    }

    // Submit exam
    const submitExam = useCallback((autoSubmit = false) => {
        if (examSubmitted) return

        const endTime = new Date()
        const timeSpent = Math.floor((endTime - startTime) / 1000)

        // Calculate score
        let totalPoints = 0
        let maxPoints = 0
        const gradedAnswers = []

        examData.questions.forEach(question => {
            const userAnswer = answers[question.questionId]
            const isCorrect = userAnswer === question.correctAnswer
            
            gradedAnswers.push({
                questionId: question.questionId,
                selectedAnswer: userAnswer || '',
                correctAnswer: question.correctAnswer,
                isCorrect,
                points: isCorrect ? question.points : 0
            })

            if (isCorrect) totalPoints += question.points
            maxPoints += question.points
        })

        const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0
        const passed = score >= examData.passingScore

        // Create exam result
        const result = {
            _id: `result_${Date.now()}`,
            examId: examData._id,
            courseId: courseId,
            attemptNumber: getAttemptCount() + 1,
            answers: gradedAnswers,
            score,
            totalPoints,
            maxPoints,
            passed,
            timeSpent,
            startedAt: startTime,
            submittedAt: endTime,
            certificateEligible: score === 100,
            certificateIssued: false
        }

        // Store result in localStorage
        storeResult(result)

        setExamSubmitted(true)
        setExamResult(result)
        setShowResults(true)
        
        if (autoSubmit) {
            toast.warning('Time expired! Exam submitted automatically.')
        } else {
            toast.success('Exam submitted successfully!')
        }
    }, [examSubmitted, startTime, answers, examData, courseId, getAttemptCount, storeResult])

    // Claim certificate
    const claimCertificate = () => {
        // Update certificate status immediately
        const updatedResult = { ...examResult, certificateIssued: true, certificateIssuedAt: new Date() }
        setExamResult(updatedResult)
        
        // Update stored results
        const results = getStoredResults()
        const resultIndex = results.findIndex(r => r._id === examResult._id)
        if (resultIndex !== -1) {
            results[resultIndex] = updatedResult
            localStorage.setItem(getStorageKey('results'), JSON.stringify(results))
        }
        
        // Redirect to Google Form for certificate details
        // Replace this URL with your actual Google Form URL
        const googleFormURL = 'https://docs.google.com/forms/d/e/1FAIpQLSc_PLACEHOLDER_URL_REPLACE_WITH_YOUR_ACTUAL_FORM/viewform'
        
        // Add pre-filled data to the form (optional)
        const formParams = new URLSearchParams({
            'entry.course_title': courseData.courseTitle,
            'entry.exam_title': examData.title,
            'entry.score': `${examResult.score}%`,
            'entry.completion_date': new Date().toLocaleDateString()
        })
        
        const formURLWithParams = `${googleFormURL}?${formParams.toString()}`
        
        // Open Google Form in new tab
        window.open(formURLWithParams, '_blank', 'noopener,noreferrer')
        
        toast.success('Opening certificate form. Please fill in your details to receive your certificate.')
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl">Loading exam...</div>
            </div>
        )
    }

    // Results view
    if (showResults && examResult) {
        return (
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Exam Results</h1>
                        <h2 className="text-lg sm:text-xl text-gray-600 mb-2 sm:mb-4">{examData.title}</h2>
                        <h3 className="text-base sm:text-lg text-gray-500">{courseData.courseTitle}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Your Score</h3>
                            <div className={`text-3xl sm:text-4xl font-bold mb-2 ${examResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {examResult.score}%
                            </div>
                            <div className="text-sm text-gray-600">
                                {examResult.totalPoints} / {examResult.maxPoints} points
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Status</h3>
                            <div className={`text-xl sm:text-2xl font-bold mb-2 ${examResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {examResult.passed ? 'PASSED' : 'FAILED'}
                            </div>
                            <div className="text-sm text-gray-600">
                                Passing Score: {examData.passingScore}%
                            </div>
                        </div>
                    </div>

                    {examResult.certificateEligible && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-6 mb-6 sm:mb-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">
                                        🎉 Perfect Score! Certificate Available
                                    </h3>
                                    <p className="text-sm sm:text-base text-yellow-700">
                                        Congratulations! You scored 100% and are eligible for a certificate.
                                        {!examResult.certificateIssued && " Click below to fill out the certificate form."}
                                    </p>
                                </div>
                                {!examResult.certificateIssued && (
                                    <button 
                                        onClick={claimCertificate}
                                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 sm:px-6 py-3 sm:py-2 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm sm:text-base min-h-[48px] sm:min-h-0"
                                    >
                                        📋 Fill Certificate Form
                                    </button>
                                )}
                                {examResult.certificateIssued && (
                                    <div className="text-green-600 font-semibold flex items-center gap-2 text-sm sm:text-base">
                                        ✅ Certificate Form Submitted
                                        <span className="text-xs sm:text-sm font-normal">(Processing)</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                        {getAttemptCount() < examData.maxAttempts && (
                            <button 
                                onClick={() => {
                                    setShowResults(false)
                                    setExamSubmitted(false)
                                    setExamStarted(false)
                                    setCurrentQuestion(0)
                                    setAnswers({})
                                    setExamResult(null)
                                    setTimeLeft(examData.timeLimit * 60)
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-sm sm:text-base min-h-[48px] flex items-center justify-center"
                            >
                                Take Again ({examData.maxAttempts - getAttemptCount()} left)
                            </button>
                        )}
                        <button 
                            onClick={() => navigate(-1)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold text-sm sm:text-base min-h-[48px] flex items-center justify-center"
                        >
                            Back to Course
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Exam start screen
    if (!examStarted) {
        return (
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">{examData.title}</h1>
                        <h2 className="text-lg sm:text-xl text-gray-600 mb-2 sm:mb-4">{courseData.courseTitle}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Exam Details</h3>
                            <ul className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                                <li>📝 Questions: {examData.questions.length}</li>
                                <li>⏱️ Time Limit: {examData.timeLimit} minutes</li>
                                <li>📊 Passing Score: {examData.passingScore}%</li>
                                <li>🎯 Certificate: 100% required</li>
                                <li>🔄 Attempts: {getAttemptCount()}/{examData.maxAttempts}</li>
                                {getStoredResults().length > 0 && (
                                    <li>🏆 Best Score: {Math.max(...getStoredResults().map(r => r.score))}%</li>
                                )}
                            </ul>
                        </div>

                        <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg border-l-4 border-yellow-400">
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-yellow-800">Instructions</h3>
                            <ul className="space-y-2 sm:space-y-3 text-yellow-700 text-sm">
                                <li>• Read each question carefully</li>
                                <li>• Select only one answer per question</li>
                                <li>• You can navigate between questions</li>
                                <li>• Exam will auto-submit when time expires</li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center">
                        <button 
                            onClick={startExam}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg min-h-[48px] sm:min-h-0 w-full sm:w-auto"
                        >
                            Start Exam
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Exam taking interface
    const question = examData.questions[currentQuestion]
    const totalQuestions = examData.questions.length
    const isLastQuestion = currentQuestion === totalQuestions - 1
    const allQuestionsAnswered = examData.questions.every(q => answers[q.questionId])

    return (
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
            {/* Timer and Progress */}
            <div className="bg-white rounded-lg shadow-lg mb-4 sm:mb-6 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                    <div className="text-sm sm:text-lg font-semibold text-center sm:text-left">
                        Question {currentQuestion + 1} of {totalQuestions}
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold text-center sm:text-right ${timeLeft <= 300 ? 'text-red-600' : 'text-blue-600'}`}>
                        ⏱️ {formatTime(timeLeft)}
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mt-3">
                    <div 
                        className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Question */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 leading-tight">{question.questionText}</h2>
                
                <div className="space-y-3 sm:space-y-4">
                    {question.options.map((option) => (
                        <label 
                            key={option.optionId} 
                            className="flex items-start p-4 sm:p-5 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[64px] sm:min-h-[72px] active:bg-gray-100"
                        >
                            <input
                                type="radio"
                                name={question.questionId}
                                value={option.optionId}
                                checked={answers[question.questionId] === option.optionId}
                                onChange={() => handleAnswerSelect(question.questionId, option.optionId)}
                                className="mr-3 sm:mr-4 w-5 h-5 sm:w-6 sm:h-6 mt-1 flex-shrink-0"
                            />
                            <span className="text-base sm:text-lg leading-relaxed flex-1">{option.optionText}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                {/* Question pagination - responsive */}
                <div className="flex justify-center mb-4">
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center max-w-full">
                        {examData.questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestion(index)}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full text-sm sm:text-base font-semibold min-h-[40px] sm:min-h-[48px] flex items-center justify-center ${
                                    index === currentQuestion 
                                        ? 'bg-blue-600 text-white' 
                                        : answers[examData.questions[index].questionId]
                                            ? 'bg-green-200 text-green-800'
                                            : 'bg-gray-200 text-gray-600'
                                } transition-colors`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Navigation buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
                    <button
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        className="px-4 sm:px-6 py-3 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px] flex items-center justify-center order-1 sm:order-none"
                    >
                        ← Previous
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={() => submitExam()}
                            disabled={!allQuestionsAnswered}
                            className="px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px] flex items-center justify-center font-semibold order-2 sm:order-none"
                        >
                            Submit Exam
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
                            className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base min-h-[48px] flex items-center justify-center order-2 sm:order-none"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Exam