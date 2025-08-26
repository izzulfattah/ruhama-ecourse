// === /controllers/midtransController.js ===
import midtransClient from 'midtrans-client';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

let snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

export const createPayment = async (req, res) => {
  console.log('🏦 =======================================');
  console.log('🏦 MIDTRANS CREATE PAYMENT CALLED');
  console.log('🏦 =======================================');
  console.log('📨 Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('📨 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    console.log('🔍 Extracting payment data...');
    const { amount, userId, courseId } = req.body;
    console.log('   amount:', amount, 'type:', typeof amount);
    console.log('   userId:', userId, 'type:', typeof userId);
    console.log('   courseId:', courseId, 'type:', typeof courseId);

    console.log('📋 Generating order ID...');
    const orderId = 'ORDER-' + Date.now();
    console.log('   Generated order ID:', orderId);

    console.log('💾 Creating purchase record in database...');
    try {
      const newPurchase = new Purchase({
        userId,
        courseId,
        amount,
        orderId,
        status: 'pending',
      });
      await newPurchase.save();
      console.log('✅ Purchase record created successfully');
      console.log('   Purchase ID:', newPurchase._id);
    } catch (purchaseError) {
      console.error('❌ Error creating purchase record:', purchaseError);
      return res.status(500).json({ 
        message: 'Failed to create purchase record',
        error: purchaseError.message 
      });
    }

    console.log('🔧 Building Midtrans parameter object...');
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: 'User',
        email: 'user@email.com',
      },
      item_details: [
        {
          id: courseId,
          name: 'Course Access',
          price: amount,
          quantity: 1,
        },
      ],
      callbacks: {
        finish: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success/${courseId}`,
      },
      
      // Add additional settings for localhost development
      custom_field1: JSON.stringify({
        userId: userId,
        courseId: courseId
      }),
      // Configure for development environment
      enabled_payments: ['credit_card', 'bca_va', 'bni_va', 'bri_va', 'other_va', 'gopay', 'shopeepay']
    };
    console.log('📋 Midtrans parameter:', JSON.stringify(parameter, null, 2));

    console.log('🚀 Calling Midtrans createTransaction...');
    console.log('   Midtrans config - isProduction:', snap.isProduction);
    console.log('   Midtrans config - serverKey exists:', !!process.env.MIDTRANS_SERVER_KEY);
    console.log('   Success redirect URL:', parameter.callbacks.finish);
    console.log('   Using redirect-based enrollment (no webhooks needed)');
    
    const transaction = await snap.createTransaction(parameter);
    console.log('✅ Midtrans transaction created successfully');
    console.log('   Transaction token:', transaction.token ? transaction.token.substring(0, 20) + '...' : 'null');
    console.log('   Redirect URL:', transaction.redirect_url);

    console.log('📤 Sending response to frontend...');
    res.json({ 
      token: transaction.token, 
      redirect_url: transaction.redirect_url
    });
    console.log('✅ Response sent successfully');

  } catch (err) {
    console.log('❌ =======================================');
    console.log('❌ MIDTRANS CREATE PAYMENT ERROR');
    console.log('❌ =======================================');
    console.error('🚫 Error object:', err);
    console.error('🚫 Error message:', err.message);
    console.error('🚫 Error stack:', err.stack);
    console.error('🚫 Error response:', err.response?.data);
    
    res.status(500).json({ 
      message: 'Gagal generate transaksi Midtrans',
      error: err.message 
    });
  }
};
