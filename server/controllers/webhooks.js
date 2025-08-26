import { Webhook } from "svix";
import User from "../models/User.js";
import stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";



// API Controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
  try {

    // Create a Svix instance with clerk webhook secret.
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

    // Verifying Headers
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    })

    // Getting Data from request body
    const { data, type } = req.body

    // Switch Cases for differernt Events
    switch (type) {
      case 'user.created': {

        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
          resume: ''
        }
        await User.create(userData)
        res.json({})
        break;
      }

      case 'user.updated': {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        }
        await User.findByIdAndUpdate(data.id, userData)
        res.json({})
        break;
      }

      case 'user.deleted': {
        await User.findByIdAndDelete(data.id)
        res.json({})
        break;
      }
      default:
        break;
    }

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}


// Stripe Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)


// Stripe Webhooks to Manage Payments Action
export const stripeWebhooks = async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {

      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchaseId)
      const userData = await User.findById(purchaseData.userId)
      const courseData = await Course.findById(purchaseData.courseId.toString())

      // Convert IDs to strings for proper comparison
      const courseIdStr = courseData._id.toString();
      const userIdStr = userData._id.toString();
      
      // Check if user is already enrolled to avoid duplicates
      const isUserEnrolled = userData.enrolledCourses.some(id => id.toString() === courseIdStr);
      if (!isUserEnrolled) {
        userData.enrolledCourses.push(courseData._id)
        await userData.save()
      }

      // Check if student is already in course's enrolled students
      const isStudentInCourse = courseData.enrolledStudents.some(id => id.toString() === userIdStr);
      if (!isStudentInCourse) {
        courseData.enrolledStudents.push(userData._id)
        await courseData.save()
      }

      purchaseData.status = 'completed'
      await purchaseData.save()

      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchaseId)
      purchaseData.status = 'failed'
      await purchaseData.save()

      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
}

// === Midtrans Webhook ===

export const midtransWebhook = async (req, res) => {
  console.log('🔔 ==========================================');
  console.log('🔔 MIDTRANS WEBHOOK CALLED!');
  console.log('🔔 ==========================================');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('📨 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const notif = req.body;
    console.log('🔍 Parsing notification data...');
    const orderId = notif.order_id;
    const transactionStatus = notif.transaction_status;
    const fraudStatus = notif.fraud_status;
    
    console.log('📋 Notification details:');
    console.log('   Order ID:', orderId);
    console.log('   Transaction Status:', transactionStatus);
    console.log('   Fraud Status:', fraudStatus);

    if (transactionStatus === 'settlement' && fraudStatus === 'accept') {
      const purchaseData = await Purchase.findOne({ orderId });
      
      if (purchaseData) {
        purchaseData.status = 'completed';
        await purchaseData.save();

        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId);

        if (!userData || !courseData) {
          console.error('❌ Missing user or course data - cannot proceed with enrollment');
          return res.status(400).send('Missing user or course data');
        }

        // Convert IDs to strings for proper comparison
        const courseIdStr = courseData._id.toString();
        const userIdStr = userData._id.toString();
        
        // Check if user is already enrolled to avoid duplicates
        const isUserEnrolled = userData.enrolledCourses.some(id => id.toString() === courseIdStr);
        
        if (!isUserEnrolled) {
          userData.enrolledCourses.push(courseData._id);
          await userData.save();
        }

        // Check if student is already in course's enrolled students
        const isStudentInCourse = courseData.enrolledStudents.some(id => id.toString() === userIdStr);
        
        if (!isStudentInCourse) {
          courseData.enrolledStudents.push(userData._id);
          await courseData.save();
        }
      } else {
        console.error('❌ No purchase record found for orderId:', orderId);
      }
    } else {
      console.log('ℹ️ Payment not successful or pending:');
      console.log('   Status:', transactionStatus);
      console.log('   Fraud Status:', fraudStatus);
    }

    console.log('📤 Sending response to Midtrans...');
    res.status(200).send('Webhook received!');
    console.log('✅ Webhook processing completed');
    
  } catch (err) {
    console.log('❌ ==========================================');
    console.log('❌ MIDTRANS WEBHOOK ERROR');
    console.log('❌ ==========================================');
    console.error('🚫 Error object:', err);
    console.error('🚫 Error message:', err.message);
    console.error('🚫 Error stack:', err.stack);
    res.status(500).send('Internal Server Error');
  }
};
