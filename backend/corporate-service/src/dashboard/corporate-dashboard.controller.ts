import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CorporateDashboardService } from './corporate-dashboard.service';
import { RegisterCorporateDto } from './dto/register-corporate.dto';

@Controller('dashboard')
export class CorporateDashboardController {
  constructor(private readonly dashboardService: CorporateDashboardService) {}

  @Get('stats')
  async getDashboardStats(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.dashboardService.getStats(email);
  }

  @Post('forgot-password/initiate')
  async initiateReset(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.dashboardService.initiateCorporateReset(email);
  }
  @Get('profile')
  async getProfile(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getProfile(email);
  }

  @Get('ledger')
  async getLedger(
    @Query('email') email: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getLedger(email, page, limit, search);
  }

  @Post('top-up')
  async topUpCredits(
    @Body('email') email: string,
    @Body('amount') amount: number,
    @Body('reason') reason: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!amount || amount <= 0)
      throw new BadRequestException('Valid amount is required');
    return this.dashboardService.topUpCredits(email, amount, reason);
  }

  @Post('create-order')
  async createOrder(
    @Body('email') email: string,
    @Body('creditCount') creditCount: number,
    @Body('reason') reason: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!creditCount || creditCount <= 0)
      throw new BadRequestException('Valid credit count is required');
    return this.dashboardService.createOrder(email, creditCount, reason);
  }

  @Post('verify-payment')
  async verifyPayment(
    @Body('email') email: string,
    @Body('paymentDetails') paymentDetails: any,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!paymentDetails)
      throw new BadRequestException('Payment details are required');
    return this.dashboardService.verifyPayment(email, paymentDetails);
  }

  @Post('record-payment-failure')
  async recordPaymentFailure(
    @Body('orderId') orderId: string,
    @Body('description') description: string,
  ) {
    return this.dashboardService.recordPaymentFailure(orderId, description);
  }

  @Post('register-corporate')
  async registerCorporate(@Body() dto: RegisterCorporateDto) {
    return this.dashboardService.registerCorporate(dto);
  }

  @Get('my-employees')
  async getMyEmployees(
    @Query('email') email: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getMyEmployees(email, page, limit, search);
  }
}
