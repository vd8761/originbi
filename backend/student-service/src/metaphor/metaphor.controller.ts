import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MetaphorService } from './metaphor.service';

@Controller('metaphor')
export class MetaphorController {
  constructor(private readonly metaphor: MetaphorService) {}

  // Candidate's generated questions + page config (resumable).
  @Get('attempt/:attemptId/questions')
  getQuestions(@Param('attemptId') attemptId: string) {
    return this.metaphor.getQuestionsForAttempt(Number(attemptId));
  }

  // STT provider config (+ ephemeral token for cloud providers).
  @Get('stt-config')
  getSttConfig() {
    return this.metaphor.getSttConfig();
  }

  // Save one question's assembled answer.
  @Post('answers')
  saveAnswer(
    @Body()
    body: {
      attemptId: number;
      metaphorQuestionId: number;
      spokenLanguage?: string;
      answerText: string;
    },
  ) {
    return this.metaphor.saveAnswer({
      attemptId: Number(body.attemptId),
      metaphorQuestionId: Number(body.metaphorQuestionId),
      spokenLanguage: body.spokenLanguage,
      answerText: body.answerText ?? '',
    });
  }

  // Complete the Level 3 attempt + queue translation.
  @Post('attempt/:attemptId/finish')
  finish(@Param('attemptId') attemptId: string) {
    return this.metaphor.finishAttempt(Number(attemptId));
  }

  // Admin: manually (re-)queue translation for an attempt.
  @Post('admin/translate/:attemptId')
  translateNow(@Param('attemptId') attemptId: string) {
    return this.metaphor.translateNow(Number(attemptId));
  }
}
