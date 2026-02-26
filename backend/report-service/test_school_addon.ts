// Quick test: generate SchoolReport (with CI appendix) to output/
import path from "path";
import { SchoolReport } from "./src/reports/school/schoolReportAddon.js";
import { SchoolData } from "./src/types/types";

const NAME = "Sriharan";
const EMAIL = "[EMAIL_ADDRESS]";
const EXAM_START = "2026-01-31 10:00:00";
const EXAM_END = "2026-01-31 11:00:00";

// Reuse same test data from index.ts setup
const schoolData: SchoolData = {
    full_name: NAME,
    email_id: EMAIL,
    exam_start: EXAM_START,
    exam_end: EXAM_END,
    bi_registration_ID: "REG123",
    assigned_exam_id: "1001",
    exam_ref_no: "OBI-G2-06/25-WB-CS-0008",
    report_title: "Origin BI ClarityFit - Behavioural Insight",
    score_D: 55,
    score_I: 40,
    score_S: 30,
    score_C: 45,
    most_answered_answer_type: [
        { ANSWER_TYPE: "D", COUNT: 11 },
        { ANSWER_TYPE: "C", COUNT: 9 },
    ],
    top_answered_types: [],
    program_type: 1,
    school_stream_id: 2,
    school_level_id: 2,
    agile_scores: [
        {
            focus: 18,
            courage: 12,
            respect: 20,
            openness: 15,
            commitment: 16,
        },
    ],
};

const outputDir = "output";
const report = new SchoolReport(schoolData as any);
const outputPath = path.join(outputDir, "SchoolAddon_Test.pdf");

console.log("Generating SchoolReport (with CI Appendix)...");
report
    .generate(outputPath)
    .then(() => {
        console.log(`✅ Generated: ${outputPath}`);
    })
    .catch((e: any) => {
        console.error("❌ Error:", e.message);
    });
