import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets, dummyTestimonial } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const TestimonialsSection = () => {
  const navigate = useNavigate();
  const { allCourses } = useContext(AppContext);

  const handleViewCourse = () => {
    // Scroll to top immediately before navigation
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    // Get a random course from the available courses
    if (allCourses && allCourses.length > 0) {
      const randomIndex = Math.floor(Math.random() * allCourses.length);
      const randomCourse = allCourses[randomIndex];
      navigate(`/course/${randomCourse._id}`);
    } else {
      // Fallback to courses list if no courses available
      navigate('/courses');
    }
    
    // Additional scroll to top after navigation (for safety)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 50);
  };

  return (
    <div className="pb-14 px-8 md:px-0">
      <h2 className="text-3xl font-medium text-gray-800">Testimoni Peserta</h2>
      <p className="md:text-base text-gray-500 mt-3">
        Dengarkan pengalaman peserta E-Course Pra Nikah yang telah merasakan manfaat dari <br /> program persiapan pernikahan kami.
      </p>
      <div className="grid grid-cols-auto gap-8 mt-14">
        {dummyTestimonial.map((testimonial, index) => (
          <div
            key={index}
            className="text-sm text-left border border-gray-500/30 pb-6 rounded-lg bg-white shadow-[0px_4px_15px_0px] shadow-black/5 overflow-hidden"
          >
            <div className="flex items-center gap-4 px-5 py-4 bg-gray-500/10">
              <img className="h-12 w-12 rounded-full" src={testimonial.image} alt={testimonial.name} />
              <div>
                <h1 className="text-lg font-medium text-gray-800">{testimonial.name}</h1>
                <p className="text-gray-800/80">{testimonial.role}</p>
              </div>
            </div>
            <div className="p-5 pb-4">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <img
                    className="h-5"
                    key={i}
                    src={i < Math.floor(testimonial.rating) ? assets.star : assets.star_blank}
                    alt="star"
                  />
                ))}
              </div>
              <p className="text-gray-500 mb-4 leading-relaxed">{testimonial.feedback}</p>
              {testimonial.courseTitle && (
                <div className="text-sm text-gray-600 mb-4 font-medium">
                  Course: {testimonial.courseTitle}
                </div>
              )}
            </div>
            <div className="px-5 pb-5">
              <button 
                onClick={handleViewCourse}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors duration-200 font-medium text-sm"
              >
                Lihat Course Pra Nikah
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsSection;
