import fs from "fs";
import path from "path";
import archiver from "archiver";
import {
    fetchGroupAssessmentData,
    fetchUserAssessmentData,
    MergedUserData,
} from "../helpers/groupReportHelper";
import { getPlacementDetails } from "../helpers/sqlHelper";
import { generateReportForUser } from "../helpers/reportFactory";
import { PlacementReport } from "../reports/placement/placementReport";
import { logger } from "../helpers/logger";

// --- Setup Temp Directory ---
// Note: In a real app, you might want this config to be more centralized
const TEMP_DIR = path.join(__dirname, "../../temp_reports");
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// --- JOB STORE ---
export interface JobState {
    status: "PROCESSING" | "COMPLETED" | "ERROR";
    zipPath?: string; // For bulk reports (Group/User)
    filePath?: string; // For single file reports (Placement)
    error?: string;
    progress?: string;
}

const jobStore = new Map<string, JobState>();

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
                status: "PROCESSING",
                progress: "Fetching Placement Data...",
            });

            // Ensure clean directory
            if (!fs.existsSync(jobDir)) {
                fs.mkdirSync(jobDir, { recursive: true });
            }

            logger.info(`[JOB:${jobId}] Fetching placement details...`);

            // 1. Fetch Data
            const placementData = await getPlacementDetails(
                deptDegreeId,
                groupId,
            );

            if (!placementData) {
                jobStore.set(jobId, {
                    status: "ERROR",
                    error: "No placement data found for this group/department combination.",
                });
                return;
            }

            jobStore.set(jobId, {
                status: "PROCESSING",
                progress: "Generating PDF...",
            });

            // 2. Generate PDF Name
            const safeGroup = placementData.group_name.replace(
                /[^a-zA-Z0-9]/g,
                "_",
            );
            const safeDept = placementData.department_name.replace(
                /[^a-zA-Z0-9]/g,
                "_",
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
                status: "COMPLETED",
                filePath: filePath, // Store as single file path
            });
        } catch (error) {
            console.error(`[JOB:${jobId}] Failed:`, error);
            jobStore.set(jobId, {
                status: "ERROR",
                error: (error as Error).message,
            });
        }
    },

    // ============================================================================
    // WORKER 2: GROUP REPORTS (Bulk Generation & Zipping)
    // ============================================================================
    async processGroupReports(groupId: string, jobId: string) {
        logger.info(`=================================================`);
        const jobDir = path.join(TEMP_DIR, jobId);
        let groupName: string = "";
        try {
            jobStore.set(jobId, {
                status: "PROCESSING",
                progress: "Initializing...",
            });

            // Ensure clean directory
            if (fs.existsSync(jobDir)) {
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (e) {}
            }
            fs.mkdirSync(jobDir, { recursive: true });

            logger.info(`[JOB:${jobId}] Fetching data...`);
            const groupData: MergedUserData[] =
                await fetchGroupAssessmentData(groupId);
            const totalUsers = groupData.length;

            if (totalUsers === 0) {
                jobStore.set(jobId, {
                    status: "ERROR",
                    error: "No completed assessments found.",
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
                    status: "PROCESSING",
                    progress: progressStr,
                });

                const safeName = user.full_name
                    .replace(/[^a-zA-Z0-9 ]/g, "_")
                    .trim();
                const fileName = `${safeName}.${user.dept_code}.${user.exam_ref_no.replace(/[\/\\]/g, "-")}.pdf`;
                groupName = user.group_name?.replace(" ", "_") as string;
                const filePath = path.join(jobDir, fileName);

                console.log(`[JOB:${jobId}] ${progressStr} - ${fileName}`);

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
                    status: "ERROR",
                    error: "All report generations failed.",
                });
                return;
            }

            // ZIP Generation
            logger.info(`[JOB:${jobId}] Zipping...`);
            jobStore.set(jobId, {
                status: "PROCESSING",
                progress: "Zipping files...",
            });

            const zipFileName = `${groupName}_Reports.zip`;
            const zipFilePath = path.join(TEMP_DIR, `${jobId}.zip`); // Zip sits outside job dir

            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", function () {
                logger.info(`[JOB:${jobId}] ZIP Created.`);
                jobStore.set(jobId, {
                    status: "COMPLETED",
                    zipPath: zipFilePath,
                });
                // Optional: Cleanup the raw PDF folder
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (e) {}
            });

            archive.on("error", function (err) {
                throw err;
            });

            archive.pipe(output);
            archive.directory(jobDir, groupName || "Reports");
            await archive.finalize();
        } catch (error) {
            console.error(`[JOB:${jobId}] Failed:`, error);
            jobStore.set(jobId, {
                status: "ERROR",
                error: (error as Error).message,
            });
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
                status: "PROCESSING",
                progress: "Initializing...",
            });

            if (fs.existsSync(jobDir)) {
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (e) {}
            }
            fs.mkdirSync(jobDir, { recursive: true });

            logger.info(`[JOB:${jobId}] Fetching data...`);
            const groupData: MergedUserData[] =
                await fetchUserAssessmentData(userIds);
            const totalUsers = groupData.length;

            if (totalUsers === 0) {
                jobStore.set(jobId, {
                    status: "ERROR",
                    error: "No completed assessments found for users.",
                });
                return;
            }

            const generatedFiles: string[] = [];
            let processedCount = 0;

            for (const user of groupData) {
                processedCount++;
                const progressStr = `Generating: ${processedCount}/${totalUsers}`;
                jobStore.set(jobId, {
                    status: "PROCESSING",
                    progress: progressStr,
                });

                const safeName = user.full_name
                    .replace(/[^a-zA-Z0-9 ]/g, "_")
                    .trim();
                const fileName = `${safeName}.${user.dept_code}.${user.exam_ref_no.replace(/[\/\\]/g, "-")}.pdf`;
                const filePath = path.join(jobDir, fileName);

                console.log(`[JOB:${jobId}] ${progressStr} - ${fileName}`);

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
                    status: "ERROR",
                    error: "All report generations failed.",
                });
                return;
            }

            logger.info(`[JOB:${jobId}] Zipping...`);
            jobStore.set(jobId, {
                status: "PROCESSING",
                progress: "Zipping files...",
            });

            const zipFilePath = path.join(TEMP_DIR, `${jobId}.zip`);
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", function () {
                jobStore.set(jobId, {
                    status: "COMPLETED",
                    zipPath: zipFilePath,
                });
                try {
                    fs.rmSync(jobDir, { recursive: true, force: true });
                } catch (e) {}
            });

            archive.on("error", function (err) {
                throw err;
            });
            archive.pipe(output);
            archive.directory(jobDir, "Reports");
            await archive.finalize();
        } catch (error) {
            console.error(`[JOB:${jobId}] Failed:`, error);
            jobStore.set(jobId, {
                status: "ERROR",
                error: (error as Error).message,
            });
        }
    },

    // ============================================================================
    // WORKER 4: SINGLE STUDENT REPORT (Single PDF Generation)
    // ============================================================================
    async processSingleUserReport(userId: string, jobId: string) {
        logger.info(`=================================================`);
        const jobDir = path.join(TEMP_DIR, jobId);

        try {
            jobStore.set(jobId, {
                status: "PROCESSING",
                progress: "Fetching Student Data...",
            });

            // Ensure clean directory
            if (!fs.existsSync(jobDir)) {
                fs.mkdirSync(jobDir, { recursive: true });
            }

            logger.info(`[JOB:${jobId}] Fetching data for user ${userId}...`);

            // Reuse existing fetchUserAssessmentData which takes array
            const groupData: MergedUserData[] = await fetchUserAssessmentData([
                userId,
            ]);

            if (!groupData || groupData.length === 0) {
                jobStore.set(jobId, {
                    status: "ERROR",
                    error: "No completed assessment found for this student.",
                });
                return;
            }

            const user = groupData[0];

            jobStore.set(jobId, {
                status: "PROCESSING",
                progress: "Generating PDF...",
            });

            const safeName = user.full_name
                .replace(/[^a-zA-Z0-9 ]/g, "_")
                .trim();
            // Naming convention for single download can be simpler or same
            const fileName = `${safeName}_Report.pdf`;
            const filePath = path.join(jobDir, fileName);

            logger.info(`[JOB:${jobId}] Generating ${fileName}...`);

            await generateReportForUser(user, filePath);

            // Complete
            logger.info(`[JOB:${jobId}] PDF Created.`);
            jobStore.set(jobId, {
                status: "COMPLETED",
                filePath: filePath, // Store as single file path
            });
        } catch (error) {
            console.error(`[JOB:${jobId}] Failed:`, error);
            jobStore.set(jobId, {
                status: "ERROR",
                error: (error as Error).message,
            });
        }
    },
};
