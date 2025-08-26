import mongoose from 'mongoose';
import User from './models/User.js';
import Course from './models/Course.js';
import 'dotenv/config';

const fixExistingEnrollment = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userId = "user_2wrfMhfWmUP3xqBHGF9kHrY95Dv";
    const courseId = "685655fbedd18e6aab880c77";

    console.log('\n🔧 Fixing existing enrollment...');
    console.log(`User ID: ${userId}`);
    console.log(`Course ID: ${courseId}`);
    console.log('=' .repeat(50));

    // Get user and course data
    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData) {
      console.error('❌ User not found');
      return;
    }

    if (!courseData) {
      console.error('❌ Course not found');
      return;
    }

    console.log('✅ User found:', userData.name);
    console.log('✅ Course found:', courseData.courseTitle);

    let changes = 0;

    // Fix user enrollment
    const courseIdStr = courseId.toString();
    const isUserEnrolled = userData.enrolledCourses.some(id => id.toString() === courseIdStr);
    
    if (!isUserEnrolled) {
      console.log('➕ Adding course to user enrolledCourses');
      userData.enrolledCourses.push(courseId);
      await userData.save();
      console.log('✅ User enrollment fixed');
      changes++;
    } else {
      console.log('✅ User already enrolled');
    }

    // Fix course enrollment
    const userIdStr = userId.toString();
    const isStudentInCourse = courseData.enrolledStudents.some(id => id.toString() === userIdStr);
    
    if (!isStudentInCourse) {
      console.log('➕ Adding user to course enrolledStudents');
      courseData.enrolledStudents.push(userId);
      await courseData.save();
      console.log('✅ Course enrollment fixed');
      changes++;
    } else {
      console.log('✅ Student already in course');
    }

    console.log(`\n🎯 RESULT: ${changes} enrollment record(s) fixed`);
    
    if (changes > 0) {
      console.log('✅ Enrollment has been repaired successfully!');
    } else {
      console.log('ℹ️ No changes needed - enrollment was already correct');
    }

  } catch (error) {
    console.error('❌ Error fixing enrollment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the fix
fixExistingEnrollment();