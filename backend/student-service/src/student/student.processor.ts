import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { StudentService } from './student.service';
import { Logger } from '@nestjs/common';

@Processor('assessment-email-queue', { concurrency: 1 })
export class StudentProcessor extends WorkerHost {
  private readonly logger = new Logger(StudentProcessor.name);

  constructor(private readonly studentService: StudentService) {
    super();
  }

  async process(job: Job<{ userId: number }>): Promise<any> {
    this.logger.log(`Processing job ${job.id} for user ${job.data.userId}...`);

    await this.studentService.handleAssessmentCompletion(job.data.userId);

    this.logger.log(`Job ${job.id} completed successfully.`);
  }
}
