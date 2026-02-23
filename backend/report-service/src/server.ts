import "dotenv/config";
import express from "express";
import cors from "cors";
import { logger } from "./helpers/logger";
import { reportRoutes } from "./routes/reportRoutes";
import { testDbConnection } from "./helpers/sqlHelper";

const app = express();
const PORT = process.env.PORT || 3000;

// Allow origins from localhost and production
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:4001",
    "http://localhost:4002",
    "http://localhost:4003",
    "http://localhost:4004",
    "http://localhost:4005",
    "https://mind.originbi.com",
    "https://discover.originbi.com",
];

app.use(
    cors({
        origin: allowedOrigins,
    }),
);
app.use(express.json());

// --- ROUTES ---
app.use("/", reportRoutes);

app.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Debug logs enabled: ${process.env.DEBUG_LOGS === "true"}`);

    // Test DB connection on startup
    await testDbConnection();

    logger.info(`-----------------------------------------------------`);
    logger.info(
        `[GET] Placement: http://localhost:${PORT}/generate/placement/:group_id/:dept_degree_id`,
    );
    logger.info(
        `[GET] Group:     http://localhost:${PORT}/generate/group/:group_id`,
    );
    logger.info(
        `[GET] Users:     http://localhost:${PORT}/generate/users  { "user_ids": [...] }`,
    );
    logger.info(
        `[GET] Student:   http://localhost:${PORT}/generate/student/:student_id`,
    );
    logger.info(`[GET] Status:    http://localhost:${PORT}/report-status`);
    logger.info(`-----------------------------------------------------`);
});
