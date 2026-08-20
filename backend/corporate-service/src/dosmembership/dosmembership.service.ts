import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay = require('razorpay');

@Injectable()
export class DosmembershipService {
  private razorpay: any;
  private tokenSecret: string;

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    this.tokenSecret = this.configService.get<string>('JWT_SECRET') || keySecret || 'fallback_secret_for_dos';

    if (keyId && keySecret) {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  private signPayload(payload: any): string {
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', this.tokenSecret).update(payloadBase64).digest('base64url');
    return `${payloadBase64}.${signature}`;
  }

  private verifyAndDecodePayload(token: string): any {
    try {
      const [payloadBase64, signature] = token.split('.');
      if (!payloadBase64 || !signature) throw new Error('Invalid token structure');
      
      const expectedSignature = crypto.createHmac('sha256', this.tokenSecret).update(payloadBase64).digest('base64url');
      if (signature !== expectedSignature) throw new Error('Invalid signature');
      
      return JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
    } catch (e) {
      throw new BadRequestException('Invalid or tampered payment token');
    }
  }

  async initiatePayment(details: { amount: number; plan: string; userId: string; redirectUrl: string }) {
    if (!this.razorpay) {
      throw new BadRequestException('Razorpay is not configured on this server');
    }

    const { amount, plan, userId, redirectUrl } = details;
    const options = {
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `dos_${Date.now()}`,
    };

    try {
      const order = await this.razorpay.orders.create(options);
      
      const payload = {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: this.configService.get<string>('RAZORPAY_KEY_ID'),
        plan,
        userId,
        redirectUrl,
        exp: Date.now() + 60 * 60 * 1000 // 1 hour expiration
      };

      const token = this.signPayload(payload);
      return { success: true, token };
    } catch (error) {
      console.error('Razorpay Order Creation Error:', error);
      throw new BadRequestException('Failed to initiate Razorpay order');
    }
  }

  decodeToken(token: string) {
    const payload = this.verifyAndDecodePayload(token);
    if (Date.now() > payload.exp) {
      throw new BadRequestException('Payment token has expired');
    }
    return { success: true, details: payload };
  }

  verifyPayment(body: {
    token: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const { token, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    
    // Ensure the token is valid and hasn't been tampered with
    const payload = this.verifyAndDecodePayload(token);
    
    if (payload.orderId !== razorpay_order_id) {
      throw new BadRequestException('Order ID mismatch');
    }

    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!secret) {
      throw new BadRequestException('Razorpay is not configured properly');
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    return {
      success: true,
      message: 'Payment verified successfully',
      redirectUrl: payload.redirectUrl,
    };
  }
}
