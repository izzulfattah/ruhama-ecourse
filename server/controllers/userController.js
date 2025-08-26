import Course from "../models/Course.js"
import { CourseProgress } from "../models/CourseProgress.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"
import Exam from "../models/Exam.js"
import ExamResult from "../models/ExamResult.js"
import stripe from "stripe"



// Get User Data
export const getUserData = async (req, res) => {
    try {

        const userId = req.auth.userId

        const user = await User.findById(userId)

        if (!user) {
            return res.json({ success: false, message: 'User Not Found' })
        }

        res.json({ success: true, user })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Purchase Course 
export const purchaseCourse = async (req, res) => {

    try {

        const { courseId } = req.body
        const { origin } = req.headers


        const userId = req.auth.userId

        const courseData = await Course.findById(courseId)
        const userData = await User.findById(userId)

        if (!userData || !courseData) {
            return res.json({ success: false, message: 'Data Not Found' })
        }

        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
        }

        const newPurchase = await Purchase.create(purchaseData)

        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        // Creating line items to for Stripe
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle
                },
                unit_amount: Math.floor(newPurchase.amount) * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        })

        res.json({ success: true, session_url: session.url });


    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Users Enrolled Courses With Lecture Links
export const userEnrolledCourses = async (req, res) => {

    try {

        const userId = req.auth.userId

        const userData = await User.findById(userId)
            .populate('enrolledCourses')

        res.json({ success: true, enrolledCourses: userData.enrolledCourses })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Update User Course Progress
export const updateUserCourseProgress = async (req, res) => {

    try {

        const userId = req.auth.userId

        const { courseId, lectureId } = req.body

        const progressData = await CourseProgress.findOne({ userId, courseId })

        if (progressData) {

            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed' })
            }

            progressData.lectureCompleted.push(lectureId)
            await progressData.save()

        } else {

            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            })

        }

        res.json({ success: true, message: 'Progress Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// get User Course Progress
export const getUserCourseProgress = async (req, res) => {

    try {

        const userId = req.auth.userId

        const { courseId } = req.body

        const progressData = await CourseProgress.findOne({ userId, courseId })

        res.json({ success: true, progressData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Add User Ratings to Course
export const addUserRating = async (req, res) => {

    const userId = req.auth.userId;
    const { courseId, rating } = req.body;

    // Validate inputs
    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
        return res.json({ success: false, message: 'InValid Details' });
    }

    try {
        // Find the course by ID
        const course = await Course.findById(courseId);

        if (!course) {
            return res.json({ success: false, message: 'Course not found.' });
        }

        const user = await User.findById(userId);

        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'User has not purchased this course.' });
        }

        // Check is user already rated
        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId);

        if (existingRatingIndex > -1) {
            // Update the existing rating
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            // Add a new rating
            course.courseRatings.push({ userId, rating });
        }

        await course.save();

        return res.json({ success: true, message: 'Rating added' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

// Manual Enrollment for Testing (No Payment Required)
export const manualEnrollment = async (req, res) => {
    console.log('🧪 ==========================================');
    console.log('🧪 MANUAL ENROLLMENT FOR TESTING CALLED!');
    console.log('🧪 ==========================================');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('📨 Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const userId = req.auth.userId;
        const { courseId } = req.body;
        
        console.log('🔍 Processing manual enrollment...');
        console.log('   User ID:', userId);
        console.log('   Course ID:', courseId);
        
        // Validate inputs
        if (!courseId || !userId) {
            console.log('❌ Missing required fields');
            return res.json({ success: false, message: 'User ID and Course ID are required' });
        }

        console.log('👤 Fetching user and course data...');
        const userData = await User.findById(userId);
        const courseData = await Course.findById(courseId);
        
        console.log('📊 User data:', userData ? `Found ${userData.name}` : 'NOT FOUND');
        console.log('📊 Course data:', courseData ? `Found ${courseData.courseTitle}` : 'NOT FOUND');

        if (!userData || !courseData) {
            console.error('❌ Missing user or course data');
            return res.json({ success: false, message: 'User or Course not found' });
        }

        // Convert IDs to strings for proper comparison
        const courseIdStr = courseData._id.toString();
        const userIdStr = userData._id.toString();
        
        console.log('🔍 Checking if user already enrolled...');
        // Check if user is already enrolled to avoid duplicates
        const isUserEnrolled = userData.enrolledCourses.some(id => id.toString() === courseIdStr);
        console.log('   User already enrolled:', isUserEnrolled);
        
        if (isUserEnrolled) {
            console.log('⚠️ User already enrolled in course');
            return res.json({ success: false, message: 'User is already enrolled in this course' });
        }

        // Add course to user's enrolled courses
        userData.enrolledCourses.push(courseData._id);
        await userData.save();

        // Check if student is already in course's enrolled students
        const isStudentInCourse = courseData.enrolledStudents.some(id => id.toString() === userIdStr);
        
        if (!isStudentInCourse) {
            courseData.enrolledStudents.push(userData._id);
            await courseData.save();
        }
        
        // Create a purchase record for testing (status: completed, amount: 0)
        const testPurchase = new Purchase({
            userId,
            courseId,
            amount: 0,
            orderId: 'MANUAL-TEST-' + Date.now(),
            status: 'completed'
        });
        await testPurchase.save();

        res.json({ 
            success: true, 
            message: 'Successfully enrolled in course (TEST MODE)',
            enrollment: {
                userId: userIdStr,
                courseId: courseIdStr,
                courseTitle: courseData.courseTitle,
                userName: userData.name
            }
        });
        
    } catch (error) {
        console.log('❌ ==========================================');
        console.log('❌ MANUAL ENROLLMENT ERROR');
        console.log('❌ ==========================================');
        console.error('🚫 Error object:', error);
        console.error('🚫 Error message:', error.message);
        console.error('🚫 Error stack:', error.stack);
        res.json({ success: false, message: error.message });
    }
};

// Log Video Activity for security monitoring
export const logVideoActivity = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { action, details } = req.body;

        if (!action || !details) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        console.log(`🎥 Video Activity Log - User: ${userId}, Action: ${action}`, details);

        // In a production system, you would save this to a dedicated logging service
        // For now, we'll just acknowledge the log
        res.json({ success: true, message: 'Activity logged successfully' });

    } catch (error) {
        console.error('❌ Error logging video activity:', error);
        res.json({ success: false, message: 'Failed to log activity' });
    }
};

// Generate secure video access token
export const generateVideoToken = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId, lectureId } = req.body;

        // Verify user is enrolled in the course
        const userData = await User.findById(userId);
        if (!userData || !userData.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'Access denied: Not enrolled in course' });
        }

        // Generate a secure token with expiration
        const token = `vt_${userId}_${courseId}_${lectureId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour expiration

        res.json({ 
            success: true, 
            videoToken: token,
            expiresAt,
            message: 'Video token generated successfully'
        });

    } catch (error) {
        console.error('❌ Error generating video token:', error);
        res.json({ success: false, message: 'Failed to generate video token' });
    }
};

// Get exam status for a course
export const getExamStatus = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.params;

        // Check if exam exists for this course
        const exam = await Exam.findOne({ courseId, isActive: true });
        
        if (!exam) {
            return res.json({ 
                success: true, 
                examExists: false,
                examPassed: false,
                message: 'No exam found for this course'
            });
        }

        // Check if user has passed the exam
        const examResult = await ExamResult.findOne({ 
            userId, 
            courseId,
            passed: true 
        }).sort({ submittedAt: -1 }); // Get the latest passed result

        res.json({ 
            success: true, 
            examExists: true,
            examPassed: examResult ? true : false,
            examResult: examResult || null
        });

    } catch (error) {
        console.error('❌ Error getting exam status:', error);
        res.json({ success: false, message: 'Failed to get exam status' });
    }
};