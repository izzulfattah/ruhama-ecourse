import React, { useContext, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const PaymentSuccess = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const { backendUrl, userData, fetchUserEnrolledCourses, navigate } = useContext(AppContext);
  const { getToken } = useAuth();
  
  const [enrollmentStatus, setEnrollmentStatus] = useState('processing'); // processing, success, error
  const [enrollmentMessage, setEnrollmentMessage] = useState('Processing your enrollment...');

  useEffect(() => {
    console.log('💳 ========================================');
    console.log('💳 PAYMENT SUCCESS PAGE LOADED');
    console.log('💳 ========================================');
    console.log('📋 Course ID:', courseId);
    console.log('📋 URL Search Params:', Object.fromEntries(searchParams));
    console.log('👤 User Data:', userData);

    const processEnrollment = async () => {
      try {
        // Get payment details from URL parameters
        const orderId = searchParams.get('order_id');
        const statusCode = searchParams.get('status_code');
        const transactionStatus = searchParams.get('transaction_status');
        
        console.log('💳 Payment Details from URL:');
        console.log('   Order ID:', orderId);
        console.log('   Status Code:', statusCode);
        console.log('   Transaction Status:', transactionStatus);
        console.log('   All URL params:', Object.fromEntries(searchParams));
        
        // Validate payment success only if we have payment parameters
        const hasPaymentParams = orderId || statusCode || transactionStatus;
        
        if (hasPaymentParams) {
          // Validate payment success
          // Accept multiple valid payment statuses
          const successStatuses = ['capture', 'settlement'];
          const pendingStatuses = ['pending'];
          
          console.log('🔍 Payment validation:');
          console.log('   Status Code:', statusCode);
          console.log('   Transaction Status:', transactionStatus);
          console.log('   Success statuses:', successStatuses);
          console.log('   Pending statuses:', pendingStatuses);
          
          const isSuccessfulPayment = statusCode === '200' && successStatuses.includes(transactionStatus);
          const isPendingPayment = statusCode === '201' && pendingStatuses.includes(transactionStatus);
          const isValidPayment = isSuccessfulPayment || isPendingPayment;
          
          if (!isValidPayment) {
            console.log('❌ Payment not successful or valid');
            console.log('   Expected status codes: 200 (success) or 201 (pending)');
            console.log('   Expected transaction statuses:', [...successStatuses, ...pendingStatuses]);
            setEnrollmentStatus('error');
            setEnrollmentMessage('Payment was not successful. Please try again.');
            return;
          }
          
          // Handle pending payments differently
          if (isPendingPayment) {
            console.log('⏳ Payment is pending');
            setEnrollmentStatus('error');
            setEnrollmentMessage('Payment is still being processed. Please check back later or contact support.');
            return;
          }
          
          console.log('✅ Payment validation passed');
        } else {
          console.log('⚠️ No payment parameters found - assuming successful payment for testing');
        }

        // Validate user authentication
        if (!userData) {
          console.log('❌ User not authenticated');
          setEnrollmentStatus('error');
          setEnrollmentMessage('User authentication required. Please login and try again.');
          return;
        }

        console.log('✅ Payment successful, processing enrollment...');
        setEnrollmentMessage('Payment successful! Enrolling you in the course...');

        // Get auth token
        const token = await getToken();
        if (!token) {
          console.log('❌ Could not get auth token');
          setEnrollmentStatus('error');
          setEnrollmentMessage('Authentication failed. Please login and try again.');
          return;
        }

        console.log('📡 Sending enrollment request...');
        const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/manual-enroll`,
          { courseId: courseId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('✅ Enrollment response:', data);

        if (data.success) {
          console.log('🎉 Enrollment successful!');
          setEnrollmentStatus('success');
          setEnrollmentMessage('🎉 Successfully enrolled in the course!');
          
          // Refresh enrolled courses
          await fetchUserEnrolledCourses();
          
          // Show success message and redirect after delay
          toast.success('Payment successful! You are now enrolled in the course.');
          
          setTimeout(() => {
            navigate(`/player/${courseId}`);
          }, 2000);
          
        } else {
          console.log('❌ Enrollment failed:', data.message);
          setEnrollmentStatus('error');
          setEnrollmentMessage(data.message || 'Enrollment failed. Please contact support.');
          toast.error('Payment successful but enrollment failed. Please contact support.');
        }

      } catch (error) {
        console.log('❌ Error processing enrollment:', error);
        setEnrollmentStatus('error');
        setEnrollmentMessage('An error occurred during enrollment. Please contact support.');
        toast.error('Enrollment error: ' + (error.response?.data?.message || error.message));
      }
    };

    // Only process if we have user data and course ID
    if (userData && courseId) {
      processEnrollment();
    } else if (!userData) {
      setEnrollmentMessage('Waiting for user authentication...');
    }
  }, [userData, courseId, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        
        {enrollmentStatus === 'processing' && (
          <div>
            <div className="mb-6">
              <Loading />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Processing Payment
            </h2>
            <p className="text-gray-600 mb-6">
              {enrollmentMessage}
            </p>
            <div className="text-sm text-gray-500">
              Please wait while we complete your enrollment...
            </div>
          </div>
        )}

        {enrollmentStatus === 'success' && (
          <div>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-green-800 mb-4">
              Enrollment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              {enrollmentMessage}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to your course...
            </p>
            <button 
              onClick={() => navigate(`/player/${courseId}`)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Go to Course Now
            </button>
          </div>
        )}

        {enrollmentStatus === 'error' && (
          <div>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-red-800 mb-4">
              Enrollment Error
            </h2>
            <p className="text-gray-600 mb-6">
              {enrollmentMessage}
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;