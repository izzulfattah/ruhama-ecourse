import express from 'express'
import { addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, resetMyEnrollments, resetAllEnrollments, updateRoleToEducator, uploadVideo } from '../controllers/educatorController.js';
import upload, { videoUpload } from '../configs/multer.js';
import { protectEducator } from '../middlewares/authMiddleware.js';


const educatorRouter = express.Router()

// Add Educator Role 
educatorRouter.get('/update-role', updateRoleToEducator)

// Add Courses 
educatorRouter.post('/add-course', upload.single('image'), protectEducator, addCourse)

// Upload Video
educatorRouter.post('/upload-video', videoUpload.single('video'), protectEducator, uploadVideo)

// Get Educator Courses 
educatorRouter.get('/courses', protectEducator, getEducatorCourses)

// Get Educator Dashboard Data
educatorRouter.get('/dashboard', protectEducator, educatorDashboardData)

// Get Educator Students Data
educatorRouter.get('/enrolled-students', protectEducator, getEnrolledStudentsData)

// Development Reset Routes
educatorRouter.delete('/reset-my-enrollments', resetMyEnrollments)
educatorRouter.delete('/reset-all-enrollments', resetAllEnrollments)


export default educatorRouter;