import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { CorporateDashboardService } from './corporate-dashboard.service';
import { RegisterCorporateDto } from './dto/register-corporate.dto';

@Controller('dashboard')
export class CorporateDashboardController {
  constructor(private readonly dashboardService: CorporateDashboardService) { }

  @Get('stats')
  getDashboardStats(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.dashboardService.getStats(email);
  }

  @Post('forgot-password/initiate')
  initiateReset(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.dashboardService.initiateCorporateReset(email);
  }

  @Get('profile')
  getProfile(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getProfile(email);
  }

  @Get('ledger')
  getLedger(
    @Query('email') email: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getLedger(email, page, limit, search);
  }

  @Post('top-up')
  topUpCredits(
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
  createOrder(
    @Body('email') email: string,
    @Body('creditCount') creditCount: number,
    @Body('reason') reason: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');

    // Minimum Credit Validation
    const minCredit = Number(process.env.MIN_CREDIT_PURCHASE) || 100;
    if (!creditCount || creditCount < minCredit)
      throw new BadRequestException(`Minimum credit purchase is ${minCredit}`);

    return this.dashboardService.createOrder(email, creditCount, reason);
  }

  @Post('verify-payment')
  verifyPayment(
    @Body('email') email: string,
    @Body('paymentDetails') paymentDetails: any,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!paymentDetails)
      throw new BadRequestException('Payment details are required');
    return this.dashboardService.verifyPayment(email, paymentDetails);
  }

  @Post('record-payment-failure')
  recordPaymentFailure(
    @Body('orderId') orderId: string,
    @Body('description') description: string,
  ) {
    return this.dashboardService.recordPaymentFailure(orderId, description);
  }

  @Post('register-corporate')
  registerCorporate(@Body() dto: RegisterCorporateDto) {
    return this.dashboardService.registerCorporate(dto);
  }

  @Get('my-employees')
  getMyEmployees(
    @Query('email') email: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getMyEmployees(email, page, limit, search, startDate, endDate);
  }

  @Get('assessment-sessions')
  getAssessmentSessions(
    @Query('email') email: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: number,
    @Query('type') type?: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getAssessmentSessions(
      email,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      status,
      userId,
      type
    );
  }

  @Get('counselling-access')
  getCounsellingAccess(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getCounsellingAccess(email);
  }

  @Get('counselling-sessions')
  getCounsellingSessions(
    @Query('email') email: string,
    @Query('typeId') typeId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!typeId) throw new BadRequestException('Type ID is required');
    return this.dashboardService.getCounsellingSessions(email, typeId, page, limit, search, status);
  }

  @Get('counselling-session/:id')
  getCounsellingSessionById(@Query('email') email: string, @Query('id') id: number) {
    if (!email) throw new BadRequestException('Email is required');
    return this.dashboardService.getCounsellingSessionById(email, id);
  }

  @Get('counselling/responses/:sessionId')
  getSessionResponses(@Param('sessionId') sessionId: number) {
    return this.dashboardService.getSessionResponses(sessionId);
  }
}
