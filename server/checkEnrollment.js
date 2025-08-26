import mongoose from 'mongoose';
import { Purchase } from './models/Purchase.js';
import User from './models/User.js';
import Course from './models/Course.js';
import 'dotenv/config';

const checkEnrollmentData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userId = "user_2wrfMhfWmUP3xqBHGF9kHrY95Dv";
    const courseId = "685655fbedd18e6aab880c77";

    console.log('\n📊 Checking enrollment data for:');
    console.log(`User ID: ${userId}`);
    console.log(`Course ID: ${courseId}`);
    console.log('=' .repeat(50));

    // 1. Check Purchase records
    console.log('\n🛒 PURCHASE RECORDS:');
    const purchases = await Purchase.find({ userId, courseId });
    console.log(`Found ${purchases.length} purchase record(s)`);
    
    if (purchases.length > 0) {
      purchases.forEach((purchase, index) => {
        console.log(`\nPurchase ${index + 1}:`);
        console.log(`- Order ID: ${purchase.orderId}`);
        console.log(`- Amount: $${purchase.amount}`);
        console.log(`- Status: ${purchase.status}`);
        console.log(`- Created: ${purchase.createdAt}`);
      });
    } else {
      console.log('❌ No purchase records found');
    }

    // 2. Check User enrollment
    console.log('\n👤 USER ENROLLMENT DATA:');
    const user = await User.findById(userId);
    
    if (user) {
      console.log(`User found: ${user.name} (${user.email})`);
      console.log(`Total enrolled courses: ${user.enrolledCourses.length}`);
      
      const isEnrolled = user.enrolledCourses.includes(courseId);
      console.log(`Enrolled in target course: ${isEnrolled ? '✅ YES' : '❌ NO'}`);
      
      if (user.enrolledCourses.length > 0) {
        console.log('\nAll enrolled courses:');
        user.enrolledCourses.forEach((id, index) => {
          console.log(`${index + 1}. ${id}${id === courseId ? ' ← TARGET COURSE' : ''}`);
        });
      }
    } else {
      console.log('❌ User not found');
    }

    // 3. Check Course enrollment data
    console.log('\n📚 COURSE ENROLLMENT DATA:');
    const course = await Course.findById(courseId);
    
    if (course) {
      console.log(`Course found: ${course.courseTitle}`);
      console.log(`Total enrolled students: ${course.enrolledStudents.length}`);
      
      const hasStudent = course.enrolledStudents.includes(userId);
      console.log(`Target user enrolled: ${hasStudent ? '✅ YES' : '❌ NO'}`);
      
      if (course.enrolledStudents.length > 0) {
        console.log('\nAll enrolled students:');
        course.enrolledStudents.forEach((id, index) => {
          console.log(`${index + 1}. ${id}${id === userId ? ' ← TARGET USER' : ''}`);
        });
      }
    } else {
      console.log('❌ Course not found');
    }

    // 4. Summary
    console.log('\n📋 ENROLLMENT STATUS SUMMARY:');
    const purchaseExists = purchases.length > 0;
    const userEnrolled = user && user.enrolledCourses.includes(courseId);
    const courseHasStudent = course && course.enrolledStudents.includes(userId);

    console.log(`Purchase Record: ${purchaseExists ? '✅' : '❌'}`);
    console.log(`User Enrolled: ${userEnrolled ? '✅' : '❌'}`);
    console.log(`Course Has Student: ${courseHasStudent ? '✅' : '❌'}`);
    
    const allGood = purchaseExists && userEnrolled && courseHasStudent;
    console.log(`\n🎯 OVERALL STATUS: ${allGood ? '✅ FULLY ENROLLED' : '❌ INCOMPLETE ENROLLMENT'}`);

    if (!allGood) {
      console.log('\n🔧 ISSUES DETECTED:');
      if (!purchaseExists) console.log('- No purchase record found');
      if (!userEnrolled) console.log('- User not enrolled in course');
      if (!courseHasStudent) console.log('- Course missing student record');
    }

  } catch (error) {
    console.error('❌ Error checking enrollment data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the check
checkEnrollmentData();