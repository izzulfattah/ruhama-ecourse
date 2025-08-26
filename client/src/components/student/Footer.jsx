import React from 'react';
import { assets } from '../../assets/assets';

const Footer = () => {
  return (
    <footer className="bg-gray-900 w-full mt-10">
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-12 md:gap-16 border-b border-white/30 pb-8">

          <div className="flex flex-col items-center md:items-start max-w-md">
            <img src={assets.logo_dark} alt="logo" className="mb-6" />
            <p className="text-center md:text-left text-sm text-white/80 leading-relaxed">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h2 className="font-semibold text-white mb-6 text-lg">Company</h2>
            <ul className="flex flex-col items-center md:items-start space-y-3 text-sm text-white/80">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">About us</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Contact us</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy policy</a></li>
            </ul>
          </div>

        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8">
        <p className="py-6 text-center text-xs md:text-sm text-white/60">
          Muhammad Izzul Fattah | Ruhama Institute
        </p>
      </div>
    </footer>
  );
};

export default Footer;
