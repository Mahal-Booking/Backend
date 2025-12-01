// src/config/razorpay.config.js
import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Initialize Razorpay instance with safe defaults.
 * If environment variables are missing, we fall back to dummy test values
 * so that the SDK can be instantiated without throwing.
 * In a real deployment you must provide real credentials via env vars.
 */
const keyId = process.env.RAZORPAY_KEY_ID || 'test_key_id';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('⚠️ Razorpay credentials not set – using dummy values for dev. Payments will be disabled.');
}

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
});

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');
    return generated_signature === signature;
};

export default razorpay;
