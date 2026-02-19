import { Router } from "express";
import { reportController } from "../controllers/reportController";

const router = Router();

// 1. Placement Handbook Route (PDF)
router.get(
    "/generate/placement/:group_id/:department_degree_id",
    reportController.generatePlacementReport,
);

// 2. Group Reports Route (ZIP)
router.get("/generate/group/:group_id", reportController.generateGroupReport);

// 3. User Reports Route (ZIP)
router.get("/generate/users", reportController.generateUserReport);

// 4. Single Student Report Route (PDF)
router.get(
    "/generate/student/:student_id",
    reportController.generateSingleUserReport,
);

// 4. Unified Status & Download Route
router.get("/download/status/:job_id", reportController.getDownloadStatus);

export { router as reportRoutes };
