import React, { useContext } from 'react';
import Footer from '../../components/student/Footer';
import Hero from '../../components/student/Hero';
import Companies from '../../components/student/Companies';
import CoursesSection from '../../components/student/CoursesSection';
import TestimonialsSection from '../../components/student/TestimonialsSection';
import CallToAction from '../../components/student/CallToAction';
import { AppContext } from '../../context/AppContext';
import { useUser } from '@clerk/clerk-react';

const Home = () => {
  const { userData } = useContext(AppContext);
  const { user } = useUser();

  // For logged-in users, show simplified version
  if (userData && user) {
    return (
      <div className="flex flex-col items-center space-y-8">
        <Hero />
        <CoursesSection />
        <Footer />
      </div>
    );
  }

  // For non-logged-in users, show full marketing version
  return (
    <div className="flex flex-col items-center space-y-7 text-center">
      <Hero />
      <Companies />
      <CoursesSection />
      <TestimonialsSection />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Home;
