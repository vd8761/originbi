/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unused-vars, no-empty, no-useless-escape */
import * as fs from 'fs';
import * as path from 'path';
// `archiver` is CommonJS-only here; keep the runtime-compatible import local to this file.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import archiver = require('archiver');
import {
  fetchGroupAssessmentData,
  fetchUserAssessmentData,
} from '../helpers/groupReportHelper';
import { MergedReportData } from '../types/types';
import { getPlacementDetails } from '../helpers/sqlHelper';
import { generateReportForUser, generateShortReportForUser } from '../helpers/reportFactory';
import { PlacementReport } from '../reports/placement/placementReport';
import { logger } from '../helpers/logger';

// --- Setup Temp Directory ---
const TEMP_DIR = path.join(__dirname, '../../temp_reports');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// --- JOB STORE ---
export interface JobState {
  status: 'PROCESSING' | 'COMPLETED' | 'ERROR';
  zipPath?: string; // For bulk reports (Group/User)
  filePath?: string; // For single file reports (Placement)
  error?: string;
  progress?: string;
  password?: string;
}

/**
 * File-based job store — persists job state as JSON files in TEMP_DIR so that
 * state survives a process restart (e.g. during a deployment while a job is
 * actively being polled by handleAssessmentCompletion).
 */
const getJobFilePath = (jobId: string) =>
  path.join(TEMP_DIR, `${jobId}.job.json`);

const jobStore = {
  get(jobId: string): JobState | undefined {
    const p = getJobFilePath(jobId);
    if (!fs.existsSync(p)) return undefined;
    try {
      return JSON.parse(fs.readFileSync(p, 'utf-8')) as JobState;
    } catch {
      return undefined;
    }
  },

  set(jobId: string, state: JobState): void {
    try {
      fs.writeFileSync(getJobFilePath(jobId), JSON.stringify(state));
    } catch (e) {
      logger.error(`[JobStore] Failed to persist state for job ${jobId}`, e);
    }
  },

  delete(jobId: string): void {
    const p = getJobFilePath(jobId);
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch {
      // Ignore cleanup errors
    }
  },
};

const scheduleCleanup = (
  jobId: string,
  pathsToClean: string[],
  delayMs = 15 * 60 * 1000,
) => {
  setTimeout(() => {
    try {
      for (const p of pathsToClean) {
        if (fs.existsSync(p)) {
          fs.rmSync(p, { recursive: true, force: true });
        }
      }
      jobStore.delete(jobId);
      logger.info(`[JOB:${jobId}] Cleaned up temp files (TTL Expired).`);
    } catch (e) {
      logger.error(`[JOB:${jobId}] Cleanup failed`, e);
    }
  }, delayMs);
};

export const reportQueueService = {
  getJob: (jobId: string) => jobStore.get(jobId),
  removeJob: (jobId: string) => jobStore.delete(jobId),

  // ============================================================================
  // WORKER 1: PLACEMENT REPORT (Single PDF Generation)
  // ============================================================================
  async processPlacementReport(
    groupId: number,
    deptDegreeId: number,
    jobId: string,
  ) {
    logger.info(`=================================================`);
    const jobDir = path.join(TEMP_DIR, jobId);

    try {
      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Fetching Placement Data...',
      });

      // Ensure clean directory
      if (!fs.existsSync(jobDir)) {
        fs.mkdirSync(jobDir, { recursive: true });
      }

      logger.info(`[JOB:${jobId}] Fetching placement details...`);

      // 1. Fetch Data
      const placementData = await getPlacementDetails(deptDegreeId, groupId);

      if (!placementData) {
        jobStore.set(jobId, {
          status: 'ERROR',
          error:
            'No placement data found for this group/department combination.',
        });
        return;
      }

      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Generating PDF...',
      });

      // 2. Generate PDF Name
      const safeGroup = placementData.group_name.replace(/[^a-zA-Z0-9]/g, '_');
      const safeDept = placementData.department_name.replace(
        /[^a-zA-Z0-9]/g,
        '_',
      );
      const fileName = `Placement_Handbook_${safeGroup}_${safeDept}.pdf`;
      const filePath = path.join(jobDir, fileName);

      logger.info(`[JOB:${jobId}] Generating ${fileName}...`);

      // 3. Generate Report
      const report = new PlacementReport(placementData);
      await report.generate(filePath);

      // 4. Complete
      logger.info(`[JOB:${jobId}] PDF Created.`);
      jobStore.set(jobId, {
        status: 'COMPLETED',
        filePath: filePath, // Store as single file path
      });
      scheduleCleanup(jobId, [jobDir]);
    } catch (error) {
      console.error(`[Report service]`, `[JOB:${jobId}] Failed:`, error);
      jobStore.set(jobId, {
        status: 'ERROR',
        error: (error as Error).message,
      });
      scheduleCleanup(jobId, [jobDir]);
    }
  },

  // ============================================================================
  // WORKER 2: GROUP REPORTS (Bulk Generation & Zipping)
  // ============================================================================
  async processGroupReports(groupId: string, jobId: string) {
    logger.info(`=================================================`);
    const jobDir = path.join(TEMP_DIR, jobId);
    let groupName: string = '';
    try {
      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Initializing...',
      });

      // Ensure clean directory
      if (fs.existsSync(jobDir)) {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (e) {}
      }
      fs.mkdirSync(jobDir, { recursive: true });

      logger.info(`[JOB:${jobId}] Fetching data...`);
      const groupData: MergedReportData[] =
        await fetchGroupAssessmentData(groupId);
      const totalUsers = groupData.length;

      if (totalUsers === 0) {
        jobStore.set(jobId, {
          status: 'ERROR',
          error: 'No completed assessments found.',
        });
        logger.warn(`[JOB:${jobId}] No assessments found.`);
        return;
      }

      const generatedFiles: string[] = [];
      let processedCount = 0;

      for (const user of groupData) {
        processedCount++;
        const progressStr = `Generating: ${processedCount}/${totalUsers}`;
        jobStore.set(jobId, {
          status: 'PROCESSING',
          progress: progressStr,
        });

        const safeName = user.full_name.replace(/[^a-zA-Z0-9 ]/g, '_').trim();
        const deptStr = 'dept_code' in user ? user.dept_code : 'GENERAL';
        const fileName = `${safeName}.${deptStr}.${user.exam_ref_no.replace(/[\/\\]/g, '-')}.pdf`;
        const groupStr = 'group_name' in user ? user.group_name : 'NoGroup';
        groupName = groupStr?.replace(' ', '_');
        const filePath = path.join(jobDir, fileName);

        console.log(
          `[Report service]`,
          `[JOB:${jobId}] ${progressStr} - ${fileName}`,
        );

        try {
          await generateReportForUser(user, filePath);
          generatedFiles.push(fileName);
        } catch (err) {
          logger.error(
            `[JOB:${jobId}] Failed report for ${user.full_name}`,
            err,
          );
        }
      }

      if (generatedFiles.length === 0) {
        jobStore.set(jobId, {
          status: 'ERROR',
          error: 'All report generations failed.',
        });
        return;
      }

      // ZIP Generation
      logger.info(`[JOB:${jobId}] Zipping...`);
      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Zipping files...',
      });

      const zipFileName = `${groupName}_Reports.zip`;
      const zipFilePath = path.join(TEMP_DIR, `${jobId}.zip`); // Zip sits outside job dir

      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', function () {
        logger.info(`[JOB:${jobId}] ZIP Created.`);
        jobStore.set(jobId, {
          status: 'COMPLETED',
          zipPath: zipFilePath,
        });
        // Optional: Cleanup the raw PDF folder
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (e) {}
        scheduleCleanup(jobId, [zipFilePath]);
      });

      archive.on('error', function (err: Error) {
        throw err;
      });

      archive.pipe(output);
      archive.directory(jobDir, groupName || 'Reports');
      await archive.finalize();
    } catch (error) {
      console.error(`[Report service]`, `[JOB:${jobId}] Failed:`, error);
      jobStore.set(jobId, {
        status: 'ERROR',
        error: (error as Error).message,
      });
      scheduleCleanup(jobId, [jobDir]);
    }
  },

  // ============================================================================
  // WORKER 3: USER REPORTS (Bulk Generation & Zipping)
  // ============================================================================
  async processUserReports(userIds: string[], jobId: string) {
    logger.info(`=================================================`);
    const jobDir = path.join(TEMP_DIR, jobId);
    try {
      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Initializing...',
      });

      if (fs.existsSync(jobDir)) {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (e) {}
      }
      fs.mkdirSync(jobDir, { recursive: true });

      logger.info(`[JOB:${jobId}] Fetching data...`);
      const groupData: MergedReportData[] =
        await fetchUserAssessmentData(userIds);
      const totalUsers = groupData.length;

      if (totalUsers === 0) {
        jobStore.set(jobId, {
          status: 'ERROR',
          error: 'No completed assessments found for users.',
        });
        return;
      }

      const generatedFiles: string[] = [];
      let processedCount = 0;

      for (const user of groupData) {
        processedCount++;
        const progressStr = `Generating: ${processedCount}/${totalUsers}`;
        jobStore.set(jobId, {
          status: 'PROCESSING',
          progress: progressStr,
        });

        const safeName = user.full_name.replace(/[^a-zA-Z0-9 ]/g, '_').trim();
        const deptStr = 'dept_code' in user ? user.dept_code : 'GENERAL';
        const fileName = `${safeName}.${deptStr}.${user.exam_ref_no.replace(/[\/\\]/g, '-')}.pdf`;
        const filePath = path.join(jobDir, fileName);

        console.log(
          `[Report service]`,
          `[JOB:${jobId}] ${progressStr} - ${fileName}`,
        );

        try {
          await generateReportForUser(user, filePath);
          generatedFiles.push(fileName);
        } catch (err) {
          logger.error(
            `[JOB:${jobId}] Failed report for ${user.full_name}`,
            err,
          );
        }
      }

      if (generatedFiles.length === 0) {
        jobStore.set(jobId, {
          status: 'ERROR',
          error: 'All report generations failed.',
        });
        return;
      }

      logger.info(`[JOB:${jobId}] Zipping...`);
      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Zipping files...',
      });

      const zipFilePath = path.join(TEMP_DIR, `${jobId}.zip`);
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', function () {
        jobStore.set(jobId, {
          status: 'COMPLETED',
          zipPath: zipFilePath,
        });
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch (e) {}
        scheduleCleanup(jobId, [zipFilePath]);
      });

      archive.on('error', function (err: Error) {
        throw err;
      });
      archive.pipe(output);
      archive.directory(jobDir, 'Reports');
      await archive.finalize();
    } catch (error) {
      console.error(`[Report service]`, `[JOB:${jobId}] Failed:`, error);
      jobStore.set(jobId, {
        status: 'ERROR',
        error: (error as Error).message,
      });
      scheduleCleanup(jobId, [jobDir]);
    }
  },

  // ============================================================================
  // WORKER 4: SINGLE STUDENT REPORT (Single PDF Generation)
  // ============================================================================
  async processSingleUserReport(
    userId: string,
    jobId: string,
    short: boolean = false,
  ) {
    logger.info(`=================================================`);
    const jobDir = path.join(TEMP_DIR, jobId);

    try {
      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Fetching Student Data...',
      });

      // Ensure clean directory
      if (!fs.existsSync(jobDir)) {
        fs.mkdirSync(jobDir, { recursive: true });
      }

      logger.info(`[JOB:${jobId}] Fetching data for user ${userId}...`);

      // Reuse existing fetchUserAssessmentData which takes array
      const groupData: MergedReportData[] = await fetchUserAssessmentData([
        userId,
      ]);

      if (!groupData || groupData.length === 0) {
        jobStore.set(jobId, {
          status: 'ERROR',
          error: 'No completed assessment found for this student.',
        });
        return;
      }

      const user = groupData[0];

      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Generating PDF...',
      });

      const formattedName = (user.full_name || '')
        .replace(/[^a-zA-Z]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join('_');

      const formattedReportNo = (user.exam_ref_no || '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      // Naming convention: <full_name>_<report_number>[_short].pdf
      const fileName = `${formattedName}_${formattedReportNo}${short ? '_short' : ''}.pdf`;
      const filePath = path.join(jobDir, fileName);

      logger.info(
        `[JOB:${jobId}] Generating ${fileName}${short ? ' (SHORT)' : ''}...`,
      );

      const password = await generateReportForUser(user, filePath, short);

      // Complete
      logger.info(`[JOB:${jobId}] PDF Created.`);
      jobStore.set(jobId, {
        status: 'COMPLETED',
        filePath: filePath, // Store as single file path
        password: password,
      });
      scheduleCleanup(jobId, [jobDir]);
    } catch (error) {
      console.error(`[Report service]`, `[JOB:${jobId}] Failed:`, error);
      jobStore.set(jobId, {
        status: 'ERROR',
        error: (error as Error).message,
      });
      scheduleCleanup(jobId, [jobDir]);
    }
  },

  // ============================================================================
  // WORKER 5: SINGLE STUDENT SHORT REPORT (Single PDF Generation)
  // ============================================================================
  async processSingleUserShortReport(userId: string, jobId: string) {
    logger.info(`=================================================`);
    const jobDir = path.join(TEMP_DIR, jobId);

    try {
      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Fetching user data...',
      });

      // Ensure clean directory
      if (!fs.existsSync(jobDir)) {
        fs.mkdirSync(jobDir, { recursive: true });
      }

      logger.info(`[JOB:${jobId}] Fetching data for user ${userId} (short report)...`);

      // Reuse existing fetchUserAssessmentData which takes array
      const groupData: MergedReportData[] = await fetchUserAssessmentData([
        userId,
      ]);

      if (!groupData || groupData.length === 0) {
        jobStore.set(jobId, {
          status: 'ERROR',
          error: 'No assessment data found for this user.',
        });
        return;
      }

      const user = groupData[0];

      jobStore.set(jobId, {
        status: 'PROCESSING',
        progress: 'Generating Short PDF...',
      });

      // Naming convention: <full_name>_Short.pdf
      const safeName = user.full_name
        .replace(/[^a-zA-Z0-9 ]/g, '_')
        .trim()
        .replace(/\s+/g, '_');
      const formattedReportNo = (user.exam_ref_no || '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      const fileName = `${safeName}_${formattedReportNo}_Short.pdf`;
      const filePath = path.join(jobDir, fileName);

      logger.info(`[JOB:${jobId}] Generating ${fileName}...`);

      await generateShortReportForUser(user, filePath);

      // Complete
      logger.info(`[JOB:${jobId}] Short PDF Created.`);
      jobStore.set(jobId, {
        status: 'COMPLETED',
        filePath: filePath,
      });
      scheduleCleanup(jobId, [jobDir]);
    } catch (error) {
      console.error(`[Report service]`, `[JOB:${jobId}] Failed:`, error);
      jobStore.set(jobId, {
        status: 'ERROR',
        error: (error as Error).message,
      });
      scheduleCleanup(jobId, [jobDir]);
    }
  },
};
