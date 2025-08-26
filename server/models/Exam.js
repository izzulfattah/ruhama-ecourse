import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    options: [
        {
            optionId: { type: String, required: true },
            optionText: { type: String, required: true }
        }
    ],
    correctAnswer: { type: String, required: true }, // optionId of correct answer
    points: { type: Number, default: 1 }
}, { _id: false });

const examSchema = new mongoose.Schema({
    courseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    questions: [questionSchema],
    timeLimit: { type: Number, required: true }, // in minutes
    passingScore: { type: Number, required: true, min: 0, max: 100 }, // percentage
    maxAttempts: { type: Number, default: 3 },
    isActive: { type: Boolean, default: true },
    createdBy: {
        type: String,
        ref: 'User',
        required: true
    }
}, { timestamps: true, minimize: false });

const Exam = mongoose.model('Exam', examSchema);

export default Exam;