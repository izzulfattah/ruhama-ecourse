import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import CourseCard from './CourseCard';
import { Link } from 'react-router-dom';

const CoursesSection = () => {

  const { allCourses } = useContext(AppContext)

  return (
    <div className="py-12 md:px-40 px-8">
      <h2 className="text-2xl font-medium text-gray-800 text-center">Available Courses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 md:px-0 md:my-12 my-8 gap-4">
        {allCourses.slice(0, 4).map((course, index) => <CourseCard key={index} course={course} />)}
      </div>
      <div className="text-center">
        <Link to={'/course-list'} onClick={() => scrollTo(0, 0)} className="text-blue-600 border border-blue-600/30 hover:bg-blue-50 px-8 py-2 rounded transition-colors">Browse all courses</Link>
      </div>
    </div>
  );
};

export default CoursesSection;
