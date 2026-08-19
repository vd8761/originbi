import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { DosmembershipService } from './dosmembership.service';

@Controller('dosmembership')
export class DosmembershipController {
  constructor(private readonly dosmembershipService: DosmembershipService) {}

  @Post('initiate-payment')
  async initiatePayment(
    @Body() details: { amount: number; plan: string; userId: string; redirectUrl: string }
  ) {
    if (!details || !details.amount || details.amount <= 0) {
      throw new BadRequestException('Valid amount is required');
    }
    return this.dosmembershipService.initiatePayment(details);
  }

  @Post('decode-token')
  async decodeToken(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    return this.dosmembershipService.decodeToken(token);
  }

  @Post('verify-payment')
  async verifyPayment(
    @Body()
    body: {
      token: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    if (!body || !body.token || !body.razorpay_signature) {
      throw new BadRequestException('Complete payment details including token are required');
    }
    return this.dosmembershipService.verifyPayment(body);
  }
}
