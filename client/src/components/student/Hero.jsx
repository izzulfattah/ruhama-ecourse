import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import SearchBar from '../../components/student/SearchBar';
import { AppContext } from '../../context/AppContext';
import { useUser } from '@clerk/clerk-react';

const Hero = () => {
  const { userData } = useContext(AppContext);
  const { user } = useUser();

  // If user is logged in, show simplified version
  if (userData && user) {
    return (
      <div className="flex flex-col items-center justify-center w-full md:pt-36 pt-20 px-7 md:px-0 space-y-7 text-center bg-gradient-to-b from-cyan-100/70">
        <h1 className="md:text-home-heading-large text-home-heading-small relative font-bold text-gray-800 max-w-3xl mx-auto">
          Welcome back, <span className="text-blue-600">{user.firstName || user.fullName || 'Student'}!</span> Continue your learning journey.
          <img src={assets.sketch} alt="sketch" className="md:block hidden absolute -bottom-7 right-0" />
        </h1>
        <p className="md:block hidden text-gray-500 max-w-2xl mx-auto">
          We bring together world-class instructors, interactive content, and a supportive community to help you achieve your personal and professional goals.
        </p>
        <p className="md:hidden text-gray-500 max-w-sm mx-auto">
          We bring together world-class instructors to help you achieve your professional goals.
        </p>
        <SearchBar />
      </div>
    );
  }

  // For non-logged-in users, show original marketing version
  return (
    <div className="flex flex-col items-center justify-center w-full md:pt-36 pt-20 px-7 md:px-0 space-y-7 text-center bg-gradient-to-b from-cyan-100/70">
      <h1 className="md:text-home-heading-large text-home-heading-small relative font-bold text-gray-800 max-w-3xl mx-auto">
        Tagline Ruhama Institute yang keren itu
        <span className="text-blue-600"> disini.</span>
        <img src={assets.sketch} alt="sketch" className="md:block hidden absolute -bottom-7 right-0" />
      </h1>
      <p className="md:block hidden text-gray-500 max-w-2xl mx-auto">
        We bring together world-class instructors, interactive content, and a supportive community to help you achieve your personal and professional goals.
      </p>
      <p className="md:hidden text-gray-500 max-w-sm mx-auto">
        We bring together world-class instructors to help you achieve your professional goals.
      </p>
      <SearchBar />
    </div>
  );
};

export default Hero;
