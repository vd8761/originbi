import axios from 'axios';

const CORPORATE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'; // Verify the port of corporate-service

export const dosmembershipService = {
    decodeToken: async (token: string) => {
        try {
            const response = await axios.post(`${CORPORATE_API_URL}/dosmembership/decode-token`, {
                token,
            });
            return response.data;
        } catch (error: any) {
            console.error('Error decoding DOS token:', error);
            throw new Error(error.response?.data?.message || 'Failed to decode secure payment token');
        }
    },

    verifyPayment: async (paymentDetails: {
        token: string;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }) => {
        try {
            const response = await axios.post(`${CORPORATE_API_URL}/dosmembership/verify-payment`, paymentDetails);
            return response.data;
        } catch (error: any) {
            console.error('Error verifying DOS payment:', error);
            throw new Error(error.response?.data?.message || 'Failed to verify payment');
        }
    },
};
