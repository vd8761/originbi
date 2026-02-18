import "dotenv/config";
import express from "express";
import cors from "cors";
import { logger } from "./helpers/logger";
import { reportRoutes } from "./routes/reportRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:3000" })); // Allow all origins for dev, or specify http://localhost:3000
app.use(express.json());

// --- ROUTES ---
app.use("/", reportRoutes);

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Debug logs enabled: ${process.env.DEBUG_LOGS === "true"}`);
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
    logger.info(`-----------------------------------------------------`);
});
