import express from 'express';
import {
  addUserRating,
  getUserCourseProgress,
  getUserData,
  logVideoActivity,
  generateVideoToken,
  getExamStatus,
  manualEnrollment,
  purchaseCourse,
  updateUserCourseProgress,
  userEnrolledCourses
} from '../controllers/userController.js';
import { addPurchase } from '../controllers/purchaseController.js';
import { requireAuth } from '@clerk/express';

const userRouter = express.Router();

// Get user Data
userRouter.get('/data', requireAuth(), getUserData);
userRouter.post('/purchase', requireAuth(), purchaseCourse); // ini dari userController
userRouter.get('/enrolled-courses', requireAuth(), userEnrolledCourses);
userRouter.post('/update-course-progress', requireAuth(), updateUserCourseProgress);
userRouter.post('/get-course-progress', requireAuth(), getUserCourseProgress);
userRouter.post('/add-rating', requireAuth(), addUserRating);

// Manual enrollment for testing (bypasses payment)
userRouter.post('/manual-enroll', requireAuth(), manualEnrollment);

// Video security endpoints
userRouter.post('/log-video-activity', requireAuth(), logVideoActivity);
userRouter.post('/generate-video-token', requireAuth(), generateVideoToken);

// Exam status endpoint
userRouter.get('/exam-status/:courseId', requireAuth(), getExamStatus);

// Endpoint tambahan buat nyimpen purchase ke DB
userRouter.post('/add-purchase', addPurchase); // ini dari purchaseController - no auth required for webhook

export default userRouter;
