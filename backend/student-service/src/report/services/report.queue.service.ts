import { Injectable } from '@nestjs/common';
import { reportQueueService, JobState } from './reportQueueService';

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
  ): Promise<void> {
    return reportQueueService.processPlacementReport(
      groupId,
      deptDegreeId,
      jobId,
    );
  }

  processGroupReports(groupId: string, jobId: string): Promise<void> {
    return reportQueueService.processGroupReports(groupId, jobId);
  }

  processUserReports(userIds: string[], jobId: string): Promise<void> {
    return reportQueueService.processUserReports(userIds, jobId);
  }

  processSingleUserReport(userId: string, jobId: string): Promise<void> {
    return reportQueueService.processSingleUserReport(userId, jobId);
  }
}
