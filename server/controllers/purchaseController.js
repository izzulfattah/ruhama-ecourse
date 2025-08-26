// controllers/purchaseController.js
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

export const addPurchase = async (req, res) => {
  console.log('🛒 =============================================');
  console.log('🛒 ADD PURCHASE ENDPOINT HIT!');
  console.log('🛒 =============================================');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('🌐 Request method:', req.method);
  console.log('📡 Request URL:', req.url);
  console.log('🏠 Request origin:', req.get('origin'));
  console.log('🎯 User-Agent:', req.get('user-agent'));
  console.log('📨 Request headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    console.log('🚀 =================================');
    console.log('🚀 ADD PURCHASE FUNCTION CALLED!');
    console.log('🚀 =================================');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📦 Request body exists:', !!req.body);
    console.log('📦 Request body keys:', Object.keys(req.body || {}));
    
    const { userId, courseId, amount, orderId } = req.body;
    console.log('🔍 Extracted variables:');
    console.log('   userId:', userId, 'type:', typeof userId);
    console.log('   courseId:', courseId, 'type:', typeof courseId);
    console.log('   amount:', amount);
    console.log('   orderId:', orderId);

    const existing = await Purchase.findOne({ userId, courseId });
    console.log('🔍 Checking for existing purchase...');
    if (existing) {
      console.log('❌ EXISTING PURCHASE FOUND - BLOCKING');
      return res.status(400).json({ message: 'Udah pernah beli course ini' });
    }
    console.log('✅ No existing purchase found - proceeding');

    console.log('💾 Creating new purchase...');
    const newPurchase = new Purchase({
      userId,
      courseId,
      amount,
      orderId,
      status: 'completed',
    });

    await newPurchase.save();
    console.log('✅ Purchase saved to database');

    // Enroll the user in the course
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData) {
      console.error('❌ USER NOT FOUND:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!courseData) {
      console.error('❌ COURSE NOT FOUND:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Convert courseId to string for comparison
    const courseIdStr = courseId.toString();
    const userIdStr = userId.toString();

    // Check if user is already enrolled to avoid duplicates
    const isUserEnrolled = userData.enrolledCourses.some(id => id.toString() === courseIdStr);
    
    if (!isUserEnrolled) {
      userData.enrolledCourses.push(courseId);
      await userData.save();
    }

    // Check if student is already in course's enrolled students
    const isStudentInCourse = courseData.enrolledStudents.some(id => id.toString() === userIdStr);
    
    if (!isStudentInCourse) {
      courseData.enrolledStudents.push(userId);
      await courseData.save();
    }
    res.status(201).json({ 
      message: 'Purchase saved and user enrolled successfully',
      enrolled: true 
    });

  } catch (error) {
    console.error('❌ ERROR IN ADD PURCHASE:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
