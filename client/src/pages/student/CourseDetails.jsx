import React, { useContext, useEffect, useState } from 'react';
import Footer from '../../components/student/Footer';
import { assets } from '../../assets/assets';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import humanizeDuration from 'humanize-duration';
import { useAuth } from '@clerk/clerk-react';
import Loading from '../../components/student/Loading';
import SimpleProtectedVideo from '../../components/SimpleProtectedVideo';


const CourseDetails = () => {

  const { id } = useParams()

  const [courseData, setCourseData] = useState(null)
  const [playerData, setPlayerData] = useState(null)
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)

  const { backendUrl, currency, userData, calculateChapterTime, calculateCourseDuration, calculateRating, calculateNoOfLectures, formatPrice, calculateDiscountedPrice, fetchUserEnrolledCourses, navigate } = useContext(AppContext)
  const { getToken } = useAuth()

  const [midtransLoaded, setMidtransLoaded] = useState(false);

  useEffect(() => {
    console.log('📜 Loading Midtrans script...');
    console.log('   VITE_MIDTRANS_CLIENT_KEY:', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
    console.log('   Current origin:', window.location.origin);
    
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
    script.setAttribute("data-environment", "sandbox");
    
    script.onload = () => {
      console.log('✅ Midtrans script loaded successfully');
      console.log('   window.snap available:', !!window.snap);
      
      // Configure Snap for localhost development
      if (window.snap) {
        console.log('🔧 Configuring Snap for localhost...');
        // This helps with CORS issues in development
        window.snap.onSuccess = null; // Will be overridden in payment call
        window.snap.onPending = null;
        window.snap.onError = null;
      }
      
      setMidtransLoaded(true);
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Midtrans script:', error);
      toast.error('Failed to load payment system. Please refresh the page.');
    };
    
    document.body.appendChild(script);
    
    // Add message event listener for postMessage handling
    const handlePostMessage = (event) => {
      console.log('📨 Received postMessage:', event);
      console.log('   Origin:', event.origin);
      console.log('   Data:', event.data);
      
      // Handle Midtrans postMessage events
      if (event.origin === 'https://app.sandbox.midtrans.com') {
        console.log('✅ Valid Midtrans postMessage received');
      }
    };
    
    window.addEventListener('message', handlePostMessage);
    
    return () => {
      // Cleanup script on component unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      window.removeEventListener('message', handlePostMessage);
    };
  }, []);

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/course/' + id)
      if (data.success) {
        setCourseData(data.courseData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const manualEnrollCourse = async () => {
    console.log('🧪 ================================');
    console.log('🧪 MANUAL ENROLL FUNCTION CALLED');
    console.log('🧪 ================================');
    
    try {
      console.log('🔍 Checking user authentication...');
      if (!userData) {
        console.log('❌ USER NOT AUTHENTICATED');
        return toast.warn('Login to Enroll');
      }
      console.log('✅ User authenticated');

      console.log('🔍 Checking enrollment status...');
      if (isAlreadyEnrolled) {
        console.log('❌ USER ALREADY ENROLLED');
        return toast.warn('Already Enrolled');
      }
      console.log('✅ User not yet enrolled, proceeding...');

      console.log('🔑 Getting authentication token...');
      const token = await getToken();
      console.log('✅ Token obtained:', token ? 'YES' : 'NO');

      console.log('📡 Sending manual enrollment request...');
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/manual-enroll`,
        { courseId: courseData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Manual enrollment response:', data);

      if (data.success) {
        console.log('🎉 Manual enrollment successful!');
        toast.success('Successfully enrolled! (TEST MODE)');
        
        // Refresh enrolled courses
        await fetchUserEnrolledCourses();
        setIsAlreadyEnrolled(true);
        
        // Navigate to player
        navigate(`/player/${courseData._id}`);
      } else {
        console.log('❌ Manual enrollment failed:', data.message);
        toast.error(data.message);
      }

    } catch (error) {
      console.log('❌ ===========================');
      console.log('❌ MANUAL ENROLL ERROR CAUGHT');
      console.log('❌ ===========================');
      console.error('🚫 Error:', error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const enrollCourse = async () => {
    console.log('🚀 ================================');
    console.log('🚀 ENROLL COURSE FUNCTION CALLED');
    console.log('🚀 ================================');
    
    try {
      console.log('🔍 Checking user authentication...');
      console.log('   userData:', userData);
      console.log('   userData._id:', userData?._id);
      
      if (!userData) {
        console.log('❌ USER NOT AUTHENTICATED');
        return toast.warn('Login to Enroll')
      }
      console.log('✅ User authenticated');

      console.log('🔍 Checking enrollment status...');
      console.log('   isAlreadyEnrolled:', isAlreadyEnrolled);
      console.log('   userData.enrolledCourses:', userData.enrolledCourses);
      console.log('   courseData._id:', courseData._id);
      
      if (isAlreadyEnrolled) {
        console.log('❌ USER ALREADY ENROLLED');
        return toast.warn('Already Enrolled')
      }
      console.log('✅ User not yet enrolled, proceeding...');

      console.log('🔑 Getting authentication token...');
      const token = await getToken();
      console.log('✅ Token obtained:', token ? 'YES' : 'NO');
      console.log('   Token preview:', token ? token.substring(0, 20) + '...' : 'null');

      console.log('💰 Calculating payment amount...');
      const paymentAmount = calculateDiscountedPrice(courseData);
      console.log('   Original price:', courseData.coursePrice);
      console.log('   Discount:', courseData.discount);
      console.log('   Final amount:', paymentAmount);

      console.log('📦 Preparing payment request data...');
      const requestData = {
        amount: paymentAmount,
        userId: userData._id,
        courseId: courseData._id,
      };
      console.log('   Request data:', JSON.stringify(requestData, null, 2));

      console.log('📡 Sending request to Midtrans API...');
      console.log('   URL:', `${import.meta.env.VITE_BACKEND_URL}/api/payment/midtrans`);
      console.log('   Headers:', { Authorization: `Bearer ${token ? token.substring(0, 20) + '...' : 'null'}` });

      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/payment/midtrans`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ Midtrans API response received:');
      console.log('   data:', JSON.stringify(data, null, 2));

      console.log('🎯 Preparing to launch Midtrans payment popup...');
      console.log('   Payment token:', data.token ? data.token.substring(0, 20) + '...' : 'null');
      console.log('   midtransLoaded state:', midtransLoaded);
      console.log('   window.snap exists:', !!window.snap);
      console.log('   window.snap.pay exists:', !!(window.snap && window.snap.pay));
      
      if (!midtransLoaded) {
        console.error('❌ Midtrans script not yet loaded!');
        return toast.error('Payment system is still loading. Please wait and try again.');
      }
      
      if (!window.snap) {
        console.error('❌ Midtrans Snap object not found! Script may not be loaded.');
        return toast.error('Payment system not loaded. Please refresh the page.');
      }
      
      if (!window.snap.pay) {
        console.error('❌ Midtrans Snap.pay function not found!');
        return toast.error('Payment function not available. Please refresh the page.');
      }
      
      console.log('🚀 All checks passed, launching payment popup...');
      
      console.log('✅ Midtrans Snap loaded, calling snap.pay...');
      
      try {
        window.snap.pay(data.token, {
        onSuccess: async function (result) {
          console.log('🎉 ===========================');
          console.log('🎉 PAYMENT SUCCESS CALLBACK');
          console.log('🎉 ===========================');
          console.log('💳 Payment Result:', JSON.stringify(result, null, 2));
          
          toast.success("Payment successful! Redirecting...");
          
          // With redirect-based system, user will be redirected automatically by Midtrans
          // to /payment-success/:courseId which will handle enrollment
          console.log('🔄 User will be redirected to payment success page for enrollment');
          
          // Note: The redirect happens automatically via Midtrans finish URL
          // No need for manual handling here anymore
        },
        onPending: function (result) {
          console.log('⏳ ===========================');
          console.log('⏳ PAYMENT PENDING CALLBACK');
          console.log('⏳ ===========================');
          console.log('📋 Pending Result:', JSON.stringify(result, null, 2));
          toast.info("Transaksinya nunggu nih cuy!");
        },
        onError: function (result) {
          console.log('💥 ===========================');
          console.log('💥 PAYMENT ERROR CALLBACK');
          console.log('💥 ===========================');
          console.log('🚫 Error Result:', JSON.stringify(result, null, 2));
          toast.error("Payment error occurred!");
        },
        onClose: function() {
          console.log('🔒 Payment popup closed by user');
          toast.info('Payment was cancelled');
        },
        });
      } catch (snapError) {
        console.error('❌ Error calling Midtrans snap.pay:', snapError);
        toast.error('Failed to open payment popup: ' + snapError.message);
      }

    } catch (error) {
      console.log('❌ ===========================');
      console.log('❌ ENROLL COURSE ERROR CAUGHT');
      console.log('❌ ===========================');
      console.log('🚫 Error object:', error);
      console.log('🚫 Error message:', error.message);
      console.log('🚫 Error response:', error.response?.data);
      console.log('🚫 Error status:', error.response?.status);
      console.log('🚫 Error stack:', error.stack);
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchCourseData()
  }, [])

  useEffect(() => {
    if (userData && courseData) {
      setIsAlreadyEnrolled(userData.enrolledCourses.includes(courseData._id))
    }
  }, [userData, courseData])

  return courseData ? (
    <>
      <div className="flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-20 pt-10 text-left">
        <div className="absolute top-0 left-0 w-full h-section-height -z-1 bg-gradient-to-b from-cyan-100/70"></div>

        <div className="max-w-xl z-10 text-gray-500">
          <h1 className="md:text-course-deatails-heading-large text-course-deatails-heading-small font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>
          <p className="pt-4 md:text-base text-sm" dangerouslySetInnerHTML={{ __html: courseData.courseDescription.slice(0, 200) }} />

          <div className='flex items-center space-x-2 pt-3 pb-1 text-sm'>
            <p>{calculateRating(courseData)}</p>
            <div className='flex'>
              {[...Array(5)].map((_, i) => (
                <img key={i} src={i < Math.floor(calculateRating(courseData)) ? assets.star : assets.star_blank} alt='' className='w-3.5 h-3.5' />
              ))}
            </div>
            <p className='text-blue-600'>({courseData.courseRatings.length} {courseData.courseRatings.length > 1 ? 'ratings' : 'rating'})</p>
            <p>{courseData.enrolledStudents.length} {courseData.enrolledStudents.length > 1 ? 'students' : 'student'}</p>
          </div>

          <p className='text-sm'>Course by <span className='text-blue-600 underline'>{courseData.educator.name}</span></p>

          <div className="pt-8 text-gray-800">
            <h2 className="text-xl font-semibold">Course Structure</h2>
            <div className="pt-5">
              {courseData.courseContent.map((chapter, index) => (
                <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                  <div className="flex items-center justify-between px-4 py-3 cursor-pointer select-none" onClick={() => toggleSection(index)}>
                    <div className="flex items-center gap-2">
                      <img src={assets.down_arrow_icon} alt="arrow icon" className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`} />
                      <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
                    </div>
                    <p className="text-sm md:text-default">{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`}>
                    <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-start gap-2 py-1">
                          <img src={assets.play_icon} alt="bullet icon" className="w-4 h-4 mt-1" />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p>{lecture.lectureTitle}</p>
                            <div className='flex gap-2'>
                            
                              {lecture.isPreviewFree && ( <p onClick={() => {setPlayerData({ lectureUrl: lecture.lectureUrl });}} className='text-blue-500 cursor-pointer'>Preview</p>
                            )}
                            
                              <p>{humanizeDuration(lecture.lectureDuration * 60 * 1000, { units: ['h', 'm'] })}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="py-20 text-sm md:text-default">
            <h3 className="text-xl font-semibold text-gray-800">Course Description</h3>
            <p className="rich-text pt-3" dangerouslySetInnerHTML={{ __html: courseData.courseDescription }} />
          </div>
        </div>

        <div className="max-w-course-card z-10 shadow-custom-card rounded-t md:rounded-none overflow-hidden bg-white min-w-[300px] sm:min-w-[420px]">
          {playerData
            ? <SimpleProtectedVideo
                src={`${backendUrl}${playerData.lectureUrl}`}
                className='w-full aspect-video'
              />
            : <img src={courseData.courseThumbnail} alt="" />
          }
          <div className="p-5">
            <div className="flex items-center gap-2">
              <img className="w-3.5" src={assets.time_left_clock_icon} alt="time left clock icon" />
              <p className="text-red-500">
                <span className="font-medium">5 days</span> left at this price!
              </p>
            </div>
            <div className="flex gap-3 items-center pt-2">
              <p className="text-gray-800 md:text-4xl text-2xl font-semibold">{formatPrice(calculateDiscountedPrice(courseData))}</p>
              <p className="md:text-lg text-gray-500 line-through">{formatPrice(courseData.coursePrice)}</p>
              <p className="md:text-lg text-gray-500">{courseData.discount}% off</p>
            </div>
            <div className="flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500">
              <div className="flex items-center gap-1">
                <img src={assets.star} alt="star icon" />
                <p>{calculateRating(courseData)}</p>
              </div>
              <div className="h-4 w-px bg-gray-500/40"></div>
              <div className="flex items-center gap-1">
                <img src={assets.time_clock_icon} alt="clock icon" />
                <p>{calculateCourseDuration(courseData)}</p>
              </div>
              <div className="h-4 w-px bg-gray-500/40"></div>
              <div className="flex items-center gap-1">
                <img src={assets.lesson_icon} alt="lesson icon" />
                <p>{calculateNoOfLectures(courseData)} lessons</p>
              </div>
            </div>
            <button 
              onClick={() => {
                console.log('🖱️  ENROLL BUTTON CLICKED!');
                console.log('   Button state - isAlreadyEnrolled:', isAlreadyEnrolled);
                console.log('   Button state - midtransLoaded:', midtransLoaded);
                console.log('   Button text would be:', isAlreadyEnrolled ? "Already Enrolled" : !midtransLoaded ? "Loading Payment..." : "Enroll Now");
                if (!midtransLoaded) {
                  toast.warn('Payment system is loading, please wait...');
                  return;
                }
                enrollCourse();
              }} 
              disabled={isAlreadyEnrolled || !midtransLoaded}
              className={`md:mt-6 mt-4 w-full py-3 rounded font-medium ${
                isAlreadyEnrolled || !midtransLoaded 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAlreadyEnrolled ? "Already Enrolled" : !midtransLoaded ? "Loading Payment..." : "Enroll Now"}
            </button>
            
            {/* Manual Enroll Button for Testing */}
            <button 
              onClick={() => {
                console.log('🧪 MANUAL ENROLL BUTTON CLICKED!');
                manualEnrollCourse();
              }} 
              disabled={isAlreadyEnrolled}
              className={`mt-2 w-full py-3 rounded font-medium border-2 ${
                isAlreadyEnrolled 
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                  : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              {isAlreadyEnrolled ? "Already Enrolled" : "🧪 Manual Enroll (TEST)"}
            </button>
            <div className="pt-6">
              <p className="md:text-xl text-lg font-medium text-gray-800">What's in the course?</p>
              <ul className="ml-4 pt-2 text-sm md:text-default list-disc text-gray-500">
                <li>Lifetime access with free updates.</li>
                <li>Step-by-step, hands-on project guidance.</li>
                <li>Downloadable resources and source code.</li>
                <li>Quizzes to test your knowledge.</li>
                <li>Certificate of completion.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : <Loading />
};

export default CourseDetails;
