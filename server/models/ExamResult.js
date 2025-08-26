import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    selectedAnswer: { type: String, required: true }, // optionId selected by student
    isCorrect: { type: Boolean, required: true },
    points: { type: Number, default: 0 }
}, { _id: false });

const examResultSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        ref: 'User', 
        required: true 
    },
    examId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Exam', 
        required: true 
    },
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    attemptNumber: { type: Number, required: true },
    answers: [answerSchema],
    score: { type: Number, required: true, min: 0, max: 100 }, // percentage score
    totalPoints: { type: Number, required: true },
    maxPoints: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    timeSpent: { type: Number, required: true }, // in seconds
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, required: true },
    certificateEligible: { type: Boolean, default: false }, // true if score is 100%
    certificateIssued: { type: Boolean, default: false },
    certificateIssuedAt: { type: Date }
}, { timestamps: true, minimize: false });

// Index for faster queries
examResultSchema.index({ userId: 1, examId: 1 });
examResultSchema.index({ userId: 1, courseId: 1 });

const ExamResult = mongoose.model('ExamResult', examResultSchema);

export default ExamResult;