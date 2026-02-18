import { Request, Response } from "express";
import { logger } from "../helpers/logger";
import { reportQueueService } from "../services/reportQueueService";
import fs from "fs";

export const reportController = {
    // 1. Placement Handbook Route (PDF)
    generatePlacementReport: async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const groupId = parseInt(req.params.group_id as string);
        const deptDegreeId = parseInt(
            req.params.department_degree_id as string,
        );

        if (isNaN(groupId) || isNaN(deptDegreeId)) {
            res.status(400).send("Invalid IDs provided");
            return;
        }

        logger.info(
            `[API] Start Placement Report: Group ${groupId}, Dept ${deptDegreeId}`,
        );

        const jobId = `placement_${groupId}_${deptDegreeId}_${Date.now()}`;

        // Start background worker
        // Note: We don't await this because we want to return immediately
        reportQueueService
            .processPlacementReport(groupId, deptDegreeId, jobId)
            .catch((err) => logger.error("Background Job Error", err));

        // Redirect to unified download page
        if (req.query.json === "true") {
            res.json({
                success: true,
                jobId,
                statusUrl: `/download/status/${jobId}`,
            });
        } else {
            res.redirect(`/download/status/${jobId}`);
        }
    },

    // 2. Group Reports Route (ZIP)
    generateGroupReport: async (req: Request, res: Response): Promise<void> => {
        const groupId = req.params.group_id as string;
        logger.info(`[API] Start Group Report: Group ${groupId}`);

        const jobId = `group_${groupId}_${Date.now()}`;

        // Start background worker
        reportQueueService
            .processGroupReports(groupId, jobId)
            .catch((err) => logger.error("Background Job Error", err));

        if (req.query.json === "true") {
            res.json({
                success: true,
                jobId,
                statusUrl: `/download/status/${jobId}`,
            });
        } else {
            res.redirect(`/download/status/${jobId}`);
        }
    },

    // 3. User Reports Route (ZIP)
    generateUserReport: async (req: Request, res: Response): Promise<void> => {
        const { user_ids } = req.body;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            res.status(400).send("Invalid input: user_ids array is required.");
            return;
        }

        logger.info(`[API] Start User Report: ${user_ids.length} users`);

        const jobId = `users_${Date.now()}`;

        // Start background worker
        reportQueueService
            .processUserReports(user_ids, jobId)
            .catch((err) => logger.error("Background Job Error", err));

        // Return the redirect URL (since this is a POST, we usually return JSON, but for simplicity:)
        res.json({
            success: true,
            statusUrl: `/download/status/${jobId}`,
        });
    },

    // 4. Unified Status & Download Route
    getDownloadStatus: async (req: Request, res: Response): Promise<void> => {
        const jobId = req.params.job_id as string;
        const job = reportQueueService.getJob(jobId);

        if (!job) {
            res.status(404).send(
                "Job not found or expired. Please start a new generation.",
            );
            return;
        }

        if (
            req.query.json === "true" ||
            req.headers.accept === "application/json"
        ) {
            if (job.status === "PROCESSING") {
                res.json({
                    status: "PROCESSING",
                    progress: job.progress || "Processing...",
                });
                return;
            }
            if (job.status === "ERROR") {
                res.status(500).json({
                    status: "ERROR",
                    error: job.error,
                });
                return;
            }
            if (job.status === "COMPLETED") {
                // If asking for JSON status of a completed job, return the download link trigger
                // OR we could just return status: COMPLETED and let frontend handle the download request
                res.json({
                    status: "COMPLETED",
                    downloadUrl: `/download/status/${jobId}?download=true`,
                });
                return;
            }
        }

        // --- Standard Browser HTML / File Download Handling ---

        if (job.status === "PROCESSING") {
            const progress = job.progress || "Processing...";
            // Simple auto-refreshing HTML
            res.send(`
                <html>
                    <head>
                        <meta http-equiv="refresh" content="3">
                        <title>${progress}</title>
                        <style>
                            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f4f4f9; }
                            .card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h2>Generating Reports</h2>
                            <div class="loader"></div>
                            <p style="color:#666;">${progress}</p>
                            <p style="font-size:12px; color:#999;">Please wait, this page will refresh automatically.</p>
                        </div>
                    </body>
                </html>
            `);
            return;
        }

        if (job.status === "ERROR") {
            res.status(500).send(`
                <html>
                    <body style="font-family:sans-serif; text-align:center; padding:50px;">
                        <h1 style="color:red;">Generation Failed</h1>
                        <p>${job.error}</p>
                        <a href="#" onclick="window.history.back()">Go Back</a>
                    </body>
                </html>
            `);
            return;
        }

        if (job.status === "COMPLETED") {
            // Determine if we are downloading a ZIP or a File
            const downloadPath = job.zipPath || job.filePath;

            if (downloadPath && fs.existsSync(downloadPath)) {
                res.download(downloadPath, (err) => {
                    if (err) {
                        logger.error(
                            `[API] Download failed for job ${jobId}:`,
                            err,
                        );
                    }

                    // --- Clean up: Delete file and remove job from store ---
                    // Add a small delay for Windows file locking and to ensure stream is fully closed
                    setTimeout(() => {
                        try {
                            if (fs.existsSync(downloadPath)) {
                                logger.info(
                                    `[API] Deleting temporary report file: ${downloadPath}`,
                                );
                                fs.unlinkSync(downloadPath);
                            }
                            reportQueueService.removeJob(jobId);
                        } catch (cleanupErr) {
                            logger.error(
                                `[API] Failed to cleanup job ${jobId}`,
                                cleanupErr,
                            );
                        }
                    }, 10000); // 10 seconds delay to be safe
                });
            } else {
                res.status(404).send(
                    "File generated successfully but could not be found on the server.",
                );
            }
            return;
        }
    },

    // 5. Single Student Report Route (PDF)
    generateSingleUserReport: async (
        req: Request,
        res: Response,
    ): Promise<void> => {
        const userId = req.params.student_id as string;

        if (!userId) {
            res.status(400).send("Invalid input: student_id is required.");
            return;
        }

        logger.info(`[API] Start Single Student Report: ${userId}`);

        const jobId = `student_${userId}_${Date.now()}`;

        // Start background worker
        reportQueueService
            .processSingleUserReport(userId, jobId)
            .catch((err) => logger.error("Background Job Error", err));

        // Return JSON with status URL (Client will poll this)
        res.json({
            success: true,
            jobId,
            statusUrl: `/download/status/${jobId}`,
        });
    },
};
