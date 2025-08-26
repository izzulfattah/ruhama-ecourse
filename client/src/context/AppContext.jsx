import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext()

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const currency = import.meta.env.VITE_CURRENCY

    const navigate = useNavigate()
    const { getToken } = useAuth()
    const { user } = useUser()

    const [showLogin, setShowLogin] = useState(false)
    const [isEducator,setIsEducator] = useState(false)
    const [allCourses, setAllCourses] = useState([])
    const [userData, setUserData] = useState(null)
    const [enrolledCourses, setEnrolledCourses] = useState([])

    // Fetch All Courses
    const fetchAllCourses = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/course/all');

            if (data.success) {
                setAllCourses(data.courses)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Fetch UserData 
    const fetchUserData = async () => {

        try {

            if (user.publicMetadata.role === 'educator') {
                setIsEducator(true)
            }

            const token = await getToken();

            const { data } = await axios.get(backendUrl + '/api/user/data',
                { headers: { Authorization: `Bearer ${token}` } })

            if (data.success) {
                setUserData(data.user)
            } else (
                toast.error(data.message)
            )

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Fetch User Enrolled Courses
    const fetchUserEnrolledCourses = async () => {

        const token = await getToken();

        const { data } = await axios.get(backendUrl + '/api/user/enrolled-courses',
            { headers: { Authorization: `Bearer ${token}` } })

        if (data.success) {
            setEnrolledCourses(data.enrolledCourses.reverse())
        } else (
            toast.error(data.message)
        )

    }

    // Function to Calculate Course Chapter Time
    const calculateChapterTime = (chapter) => {

        let time = 0

        chapter.chapterContent.map((lecture) => time += lecture.lectureDuration)

        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })

    }

    // Function to Calculate Course Duration
    const calculateCourseDuration = (course) => {

        let time = 0

        course.courseContent.map(
            (chapter) => chapter.chapterContent.map(
                (lecture) => time += lecture.lectureDuration
            )
        )

        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] })

    }

    const calculateRating = (course) => {

        if (course.courseRatings.length === 0) {
            return 0
        }

        let totalRating = 0
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        })
        return Math.floor(totalRating / course.courseRatings.length)
    }

    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach(chapter => {
            if (Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    }

    // Format price in Indonesian Rupiah
    const formatPrice = (price) => {
        // Convert to number and format with Indonesian locale
        const numPrice = Number(price);
        if (isNaN(numPrice)) return 'Rp0';
        
        // Use Indonesian locale formatting
        return numPrice.toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0, // No decimal places for IDR
            maximumFractionDigits: 0
        });
    }

    // Calculate discounted price
    
    // Calculate course completion status (requires BOTH lectures AND passed exam)
    const calculateCourseCompletion = async (course) => {
        try {
            const token = await getToken();
            
            // Get lecture progress
            const { data } = await axios.post(backendUrl + '/api/user/get-course-progress',
                { courseId: course._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (data.success && data.progressData) {
                const totalLectures = calculateNoOfLectures(course);
                const completedLectures = data.progressData.lectureCompleted.length;
                const lecturesCompleted = completedLectures >= totalLectures && totalLectures > 0;
                
                // Check exam status
                const examData = await axios.get(backendUrl + `/api/user/exam-status/${course._id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                const examPassed = examData.data.success && examData.data.examPassed;
                const examExists = examData.data.examExists;
                
                return {
                    completed: completedLectures,
                    total: totalLectures,
                    percentage: totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0,
                    lecturesCompleted,
                    examExists,
                    examPassed,
                    isCompleted: lecturesCompleted && examPassed,
                    examPending: lecturesCompleted && examExists && !examPassed
                };
            }
            return { 
                completed: 0, 
                total: calculateNoOfLectures(course), 
                percentage: 0, 
                lecturesCompleted: false,
                examExists: false,
                examPassed: false,
                isCompleted: false,
                examPending: false
            };
        } catch (error) {
            console.error('Error calculating course completion:', error);
            return { 
                completed: 0, 
                total: calculateNoOfLectures(course), 
                percentage: 0, 
                lecturesCompleted: false,
                examExists: false,
                examPassed: false,
                isCompleted: false,
                examPending: false
            };
        }
    };

    // Get recommended courses (courses user hasn't enrolled in)
    const getRecommendedCourses = () => {
        if (!userData || !enrolledCourses) return [];
        
        const enrolledCourseIds = enrolledCourses.map(course => course._id);
        const availableCourses = allCourses.filter(course => !enrolledCourseIds.includes(course._id));
        
        // Sort by rating and enrollment count for better recommendations
        return availableCourses
            .sort((a, b) => {
                const ratingA = calculateRating(a);
                const ratingB = calculateRating(b);
                const enrollmentA = a.enrolledStudents?.length || 0;
                const enrollmentB = b.enrolledStudents?.length || 0;
                
                // Sort by rating first, then by enrollment count
                if (ratingB !== ratingA) return ratingB - ratingA;
                return enrollmentB - enrollmentA;
            })
            .slice(0, 6); // Return top 6 recommended courses
    };
    const calculateDiscountedPrice = (course) => {
        return course.coursePrice - (course.discount * course.coursePrice / 100);
    }


    useEffect(() => {
        fetchAllCourses()
    }, [])

    // Fetch User's Data if User is Logged In
    useEffect(() => {
        if (user) {
            fetchUserData()
            fetchUserEnrolledCourses()
        }
    }, [user])

    const value = {
        showLogin, setShowLogin,
        backendUrl, currency, navigate,
        userData, setUserData, getToken,
        allCourses, fetchAllCourses,
        enrolledCourses, fetchUserEnrolledCourses,
        calculateChapterTime, calculateCourseDuration,
        calculateRating, calculateNoOfLectures,
        formatPrice, calculateDiscountedPrice,
        calculateCourseCompletion, getRecommendedCourses,
        isEducator,setIsEducator
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}
