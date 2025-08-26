import express from 'express';
import { createPayment } from '../controllers/midtransController.js';

const router = express.Router();

router.post('/midtrans', createPayment);

export default router; // ✅ pake export default
