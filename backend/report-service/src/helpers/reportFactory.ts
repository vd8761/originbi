import { SchoolReport } from "../reports/school/schoolReport";
import { CollegeReport } from "../reports/college/collegeReport";
import { EmployeeReport } from "../reports/employee/employeeReport";
import { CxoReport } from "../reports/cxo/cxoReport";
import { CollegeData, SchoolData } from "../types/types";
import { MergedUserData } from "./groupReportHelper";
import { logger } from "./logger";

import { updateReportPassword } from "./sqlHelper";

/**
 * Helper to generate a random 15-character password (lowercase + numbers).
 */
function generateRandomPassword(length: number = 15): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Factory Function: generateReportForUser
 * ---------------------------------------
 * Instantiates and generates the appropriate PDF report based on the user's `program_type`.
 *
 * Supported Program Types:
 * - 1: School Report
 * - 2: College Report
 * - 3: Employee Report
 * - 4: CXO Report
 *
 * @param user - The unified user data object containing assessment results.
 * @param filePath - The absolute file path where the generated PDF will be saved.
 * @returns A Promise that resolves when the PDF generation is complete.
 */
export async function generateReportForUser(
    user: MergedUserData,
    filePath: string,
): Promise<void> {
    logger.info(
        `[ReportFactory] Generating Type ${user.program_type} for ${user.full_name}`,
    );

    // 1. Generate User Password (initial candidate)
    let userPassword = generateRandomPassword();

    // 2. Get Admin Password from Env
    const adminPassword = process.env.PDF_ADMIN_PASSWORD || "5vf6vanf9493glq";

    // 3. Update DB with the User Password (or get existing)
    // We use 'assigned_exam_id' which maps to 'assessment_session_id'
    if (user.assigned_exam_id) {
        try {
            // This function now returns the existing password if found, or the new one if updated.
            userPassword = await updateReportPassword(
                user.assigned_exam_id,
                userPassword,
            );
        } catch (err) {
            logger.error(
                `[ReportFactory] Failed to update/fetch password for user ${user.full_name}`,
                err,
            );
            // If DB fails, we still have the generated 'userPassword' as fallback.
            // But user won't know it if it wasn't saved.
        }
    } else {
        logger.warn(
            `[ReportFactory] User ${user.full_name} has no assigned_exam_id. Skipping DB password update.`,
        );
    }

    // 4. Prepare PDF Options
    const pdfOptions: PDFKit.PDFDocumentOptions = {
        userPassword: userPassword,
        ownerPassword: adminPassword,
        permissions: {
            printing: "highResolution",
            modifying: false,
            copying: false,
            annotating: false,
            fillingForms: false,
            contentAccessibility: false,
            documentAssembly: false,
        },
    };

    console.log(user.program_type);

    switch (user.program_type) {
        case 1:
            // School
            await new SchoolReport(
                user as unknown as SchoolData,
                pdfOptions,
            ).generate(filePath);
            break;
        case 2:
            // College
            await new CollegeReport(
                user as unknown as CollegeData,
                pdfOptions,
            ).generate(filePath);
            break;
        case 3:
            // Employee
            await new EmployeeReport(
                user as unknown as CollegeData,
                pdfOptions,
            ).generate(filePath);
            break;
        case 4:
            // CXO
            await new CxoReport(
                user as unknown as CollegeData,
                pdfOptions,
            ).generate(filePath);
            break;
        default:
            logger.error(
                `[ReportFactory] Unknown program_type: ${user.program_type}`,
            );
            throw new Error(`Unknown program_type: ${user.program_type}`);
    }
}
