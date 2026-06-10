import { Injectable } from '@nestjs/common';
import { reportQueueService, JobState } from './reportQueueService';
import { ReportVariant } from '../helpers/reportFactory';

/**
 * NestJS-injectable wrapper around the report queue singleton.
 * All state and logic lives in reportQueueService.ts (unchanged from report-service).
 */
@Injectable()
export class ReportQueueService {
  getJob(jobId: string): JobState | undefined {
    return reportQueueService.getJob(jobId);
  }

  processPlacementReport(
    groupId: number,
    deptDegreeId: number,
    jobId: string,
    reportTypeOverride?: 'standard' | 'mba' | 'level1',
  ): Promise<void> {
    return reportQueueService.processPlacementReport(
      groupId,
      deptDegreeId,
      jobId,
      reportTypeOverride,
    );
  }

  processGroupReports(
    groupId: string,
    jobId: string,
    programId?: string,
    variant: ReportVariant = 'full',
  ): Promise<void> {
    return reportQueueService.processGroupReports(
      groupId,
      jobId,
      programId,
      variant,
    );
  }

  processUserReports(
    userIds: string[],
    jobId: string,
    variant: ReportVariant = 'full',
  ): Promise<void> {
    return reportQueueService.processUserReports(userIds, jobId, variant);
  }

  processSingleUserReport(
    userId: string,
    jobId: string,
    variant: ReportVariant = 'full',
  ): Promise<void> {
    return reportQueueService.processSingleUserReport(userId, jobId, variant);
  }
}
