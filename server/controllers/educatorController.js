import { v2 as cloudinary } from 'cloudinary'
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import { clerkClient } from '@clerk/express'

// update role to educator
export const updateRoleToEducator = async (req, res) => {

    try {

        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            },
        })

        res.json({ success: true, message: 'You can publish a course now' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Add New Course
export const addCourse = async (req, res) => {

    try {

        const { courseData } = req.body

        const imageFile = req.file

        const educatorId = req.auth.userId

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail Not Attached' })
        }

        const parsedCourseData = await JSON.parse(courseData)

        parsedCourseData.educator = educatorId

        const newCourse = await Course.create(parsedCourseData)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        newCourse.courseThumbnail = imageUpload.secure_url

        await newCourse.save()

        res.json({ success: true, message: 'Course Added' })

    } catch (error) {

        res.json({ success: false, message: error.message })

    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {

        const educator = req.auth.userId

        const courses = await Course.find({ educator })

        res.json({ success: true, courses })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Educator Dashboard Data ( Total Earning, Enrolled Students, No. of Courses)
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        const courses = await Course.find({ educator });

        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        // Calculate total earnings from purchases
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        // Collect unique enrolled student IDs with their course titles
        const enrolledStudentsData = [];
        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents }
            }, 'name imageUrl');

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                enrolledStudentsData,
                totalCourses
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Enrolled Students Data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        // Fetch all courses created by the educator
        const courses = await Course.find({ educator });

        // Get the list of course IDs
        const courseIds = courses.map(course => course._id);

        // Fetch purchases with user and course data
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        // enrolled students data
        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({
            success: true,
            enrolledStudents
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Reset Current User's Enrollments (Development Only)
export const resetMyEnrollments = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Remove user from all courses' enrolledStudents arrays
        await Course.updateMany(
            { enrolledStudents: userId },
            { $pull: { enrolledStudents: userId } }
        );

        // Clear user's enrolledCourses array
        await User.findByIdAndUpdate(
            userId,
            { $set: { enrolledCourses: [] } }
        );

        // Delete user's purchase records
        await Purchase.deleteMany({ userId });

        res.json({
            success: true,
            message: 'Your enrollment data has been reset successfully'
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Reset All Enrollment Data (Development Only)
export const resetAllEnrollments = async (req, res) => {
    try {
        // Clear all users' enrolledCourses arrays
        await User.updateMany(
            {},
            { $set: { enrolledCourses: [] } }
        );

        // Delete all purchase records
        await Purchase.deleteMany({});

        // Get all courses sorted by creation date (oldest first)
        const allCourses = await Course.find({}).sort({ createdAt: 1 });
        
        if (allCourses.length > 2) {
            // Keep only the first 2 courses, delete the rest
            const coursesToKeep = allCourses.slice(0, 2).map(course => course._id);
            const coursesToDelete = allCourses.slice(2).map(course => course._id);
            
            // Delete the excess courses
            await Course.deleteMany({
                _id: { $in: coursesToDelete }
            });

            // Clear enrolledStudents for the remaining courses
            await Course.updateMany(
                { _id: { $in: coursesToKeep } },
                { $set: { enrolledStudents: [] } }
            );

            res.json({
                success: true,
                message: `All enrollment data reset. Kept ${coursesToKeep.length} courses, deleted ${coursesToDelete.length} courses for testing.`
            });
        } else {
            // If 2 or fewer courses, just clear their enrolledStudents
            await Course.updateMany(
                {},
                { $set: { enrolledStudents: [] } }
            );

            res.json({
                success: true,
                message: `All enrollment data reset. Kept all ${allCourses.length} courses (≤2) for testing.`
            });
        }

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Upload Video
export const uploadVideo = async (req, res) => {
    try {
        const videoFile = req.file;
        const educatorId = req.auth.userId;

        if (!videoFile) {
            return res.json({ success: false, message: 'No video file uploaded' });
        }

        const videoPath = `/uploads/videos/${videoFile.filename}`;

        res.json({ 
            success: true, 
            message: 'Video uploaded successfully',
            videoPath: videoPath
        });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
