import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IatService, IntakeDto, TrialEvent } from './iat.service';

@Controller('iat')
export class IatController {
  constructor(private readonly iat: IatService) {}

  @Get('attempt/:attemptId/state')
  getState(@Param('attemptId') attemptId: string) {
    return this.iat.getState(Number(attemptId));
  }

  @Post('attempt/:attemptId/intake')
  saveIntake(@Param('attemptId') attemptId: string, @Body() body: IntakeDto) {
    return this.iat.saveIntake(Number(attemptId), body || {});
  }

  @Post('attempt/:attemptId/trial-events')
  saveTrialEvents(
    @Param('attemptId') attemptId: string,
    @Body('events') events: TrialEvent[],
  ) {
    return this.iat.saveTrialEvents(Number(attemptId), events || []);
  }

  @Post('attempt/:attemptId/modules/:attemptModuleId/complete')
  completeModule(
    @Param('attemptId') attemptId: string,
    @Param('attemptModuleId') attemptModuleId: string,
  ) {
    return this.iat.completeModule(Number(attemptId), Number(attemptModuleId));
  }

  @Post('attempt/:attemptId/finish')
  finish(@Param('attemptId') attemptId: string) {
    return this.iat.finishAttempt(Number(attemptId));
  }

  @Post('admin/:attemptId/report/retry')
  retryReport(@Param('attemptId') attemptId: string) {
    return this.iat.retryReport(Number(attemptId));
  }
}
