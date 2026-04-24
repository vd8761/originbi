import { Controller, Post, Body } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('student/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('status')
  async getStatus(@Body() body: { email: string }) {
    return this.subscriptionService.getSubscriptionStatus(body.email);
  }

  @Post('create-order')
  async createOrder(@Body() body: { email: string }) {
    return this.subscriptionService.createPurchaseOrder(body.email);
  }

  @Post('verify-payment')
  async verifyPayment(
    @Body()
    body: {
      email: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.subscriptionService.verifyPaymentAndActivate(body);
  }

  @Post('manual-activate')
  async manualActivate(@Body() body: { email: string }) {
    return this.subscriptionService.manualActivate(body.email);
  }
  @Post('debrief/status')
  async getDebriefStatus(@Body() body: { email: string }) {
    return this.subscriptionService.getDebriefStatus(body.email);
  }

  @Post('debrief/order')
  async createDebriefOrder(@Body() body: { email: string }) {
    return this.subscriptionService.createDebriefOrder(body.email);
  }

  @Post('debrief/verify')
  async verifyDebriefPayment(
    @Body()
    body: {
      email: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.subscriptionService.verifyDebriefPayment(body);
  }

  @Post('debrief/retry-team-email')
  async retryDebriefTeamEmail(
    @Body() body: { email: string; registrationId: number },
  ) {
    await this.subscriptionService.sendDebriefEmails(
      body.email,
      body.registrationId,
    );
    return { success: true, message: 'Debrief team email retry triggered' };
  }
}
