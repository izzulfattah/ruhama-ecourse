import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets';
import { useParams } from 'react-router-dom';
import humanizeDuration from 'humanize-duration';
import axios from 'axios';
import { toast } from 'react-toastify';
import Rating from '../../components/student/Rating';
import Footer from '../../components/student/Footer';
import Loading from '../../components/student/Loading';
import SimpleProtectedVideo from '../../components/SimpleProtectedVideo';

const Player = ({ }) => {

  const { enrolledCourses, backendUrl, getToken, calculateChapterTime, userData, fetchUserEnrolledCourses } = useContext(AppContext)

  const { courseId } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);



  const getCourseData = () => {
    console.log('🔍 ============================');
    console.log('🔍 GET COURSE DATA CALLED');
    console.log('🔍 ============================');
    console.log('🎯 Looking for courseId:', courseId);
    console.log('📚 User enrolled courses:', enrolledCourses);
    console.log('📊 Number of enrolled courses:', enrolledCourses.length);
    console.log('🆔 Enrolled course IDs:', enrolledCourses.map(course => course._id));
    
    const foundCourse = enrolledCourses.find(course => course._id === courseId)
    console.log('🔍 Found course:', !!foundCourse);
    
    if (foundCourse) {
      console.log('✅ Course found! Setting course data...');
      console.log('📖 Course title:', foundCourse.courseTitle);
      setCourseData(foundCourse)
      const userRating = foundCourse.courseRatings.find(item => item.userId === userData._id)
      if (userRating) {
        setInitialRating(userRating.rating)
      }
    } else {
      console.log('❌ ============================');
      console.log('❌ COURSE NOT FOUND IN ENROLLMENT');
      console.log('❌ ============================');
      console.log('🎯 Looking for courseId:', courseId);
      console.log('🆔 Available enrolled course IDs:');
      enrolledCourses.forEach((course, index) => {
        console.log(`   ${index + 1}. ${course._id} - ${course.courseTitle}`);
      });
      console.log('❓ Possible issues:');
      console.log('   1. User not enrolled in this course');
      console.log('   2. Payment/enrollment process failed');
      console.log('   3. Course ID mismatch');
      console.log('   4. Enrolled courses not refreshed after payment');
      
      toast.error('Course not found. Please make sure you are enrolled.')
    }
  }

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };


  useEffect(() => {
    if (userData) {
      fetchUserEnrolledCourses()
    }
  }, [userData])

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData()
    }
  }, [enrolledCourses])

  const markLectureAsCompleted = async (lectureId) => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/update-course-progress',
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        getCourseProgress()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }

  }

  const getCourseProgress = async () => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/get-course-progress',
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setProgressData(data.progressData)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }

  }

  const handleRate = async (rating) => {

    try {

      const token = await getToken()

      const { data } = await axios.post(backendUrl + '/api/user/add-rating',
        { courseId, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        fetchUserEnrolledCourses()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }


  useEffect(() => {

    getCourseProgress()

  }, [])

  return courseData ? (
    <>
    
    <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36' >
      <div className=" text-gray-800" >
        <h2 className="text-xl font-semibold">Course Structure</h2>
        <div className="pt-5">
          {courseData && courseData.courseContent.map((chapter, index) => (
            <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                onClick={() => toggleSection(index)}
              >
                <div className="flex items-center gap-2">
                  <img src={assets.down_arrow_icon} alt="arrow icon" className={`transform transition-transform ${openSections[index] ? "rotate-180" : ""}`} />
                  <p className="font-medium md:text-base text-sm">{chapter.chapterTitle}</p>
                </div>
                <p className="text-sm md:text-default">{chapter.chapterContent.length} lectures - {calculateChapterTime(chapter)}</p>
              </div>

              <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? "max-h-96" : "max-h-0"}`} >
                <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                  {chapter.chapterContent.map((lecture, i) => (
                    <li key={i} className="flex items-start gap-2 py-1">
                      <img src={progressData && progressData.lectureCompleted.includes(lecture.lectureId) ? assets.blue_tick_icon : assets.play_icon} alt="bullet icon" className="w-4 h-4 mt-1" />
                      <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                        <p>{lecture.lectureTitle}</p>
                        <div className='flex gap-2'>
                          {lecture.lectureUrl && <p onClick={() => setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })} className='text-blue-500 cursor-pointer'>Watch</p>}
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

        <div className=" flex items-center gap-2 py-3 mt-10">
          <h1 className="text-xl font-bold">Rate this Course:</h1>
          <Rating initialRating={initialRating} onRate={handleRate} />
        </div>

      </div>

      <div className='md:mt-10'>
        {
          playerData
            ? (
              <SimpleProtectedVideo
                src={`${backendUrl}${playerData.lectureUrl}`}
                className='w-full aspect-video'
                onMarkComplete={markLectureAsCompleted}
                isCompleted={progressData && progressData.lectureCompleted.includes(playerData.lectureId)}
                lectureId={playerData.lectureId}
                playerData={playerData}
              />
            )
            : <img src={courseData ? courseData.courseThumbnail : ''} alt="" />
        }
      </div>
    </div>
    <Footer />
    </>
  ) : <Loading />
}

export default Player