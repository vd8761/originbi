import * as crypto from 'crypto';
import { SchoolReport } from '../reports/school/schoolReport';
import { CollegeReport } from '../reports/college/collegeReport';
import { EmployeeReport } from '../reports/employee/employeeReport';
import { CxoReport } from '../reports/cxo/cxoReport';
import { CollegeData, SchoolData, EmployeeData, CxoData, MergedReportData } from '../types/types';
import { logger } from './logger';
import { updateReportPassword } from './sqlHelper';
import { buildSchoolReportJSON } from '../reports/school/schoolReportJSON';
import { buildCollegeReportJSON } from '../reports/college/collegeReportJSON';
import { buildEmployeeReportJSON } from '../reports/employee/employeeReportJSON';
import { buildCxoReportJSON } from '../reports/cxo/cxoReportJSON';
/** Program type IDs — keep in sync with the `programs` table. */
export const ProgramType = {
  SCHOOL: 1,
  COLLEGE: 2,
  EMPLOYEE: 3,
  CXO: 4,
} as const;

/**
 * Generates a cryptographically random password of the given length
 * drawn from lowercase letters and digits.
 */
function generateRandomPassword(length: number = 15): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Factory Function: generateReportForUser
 * ---------------------------------------
 * Instantiates and generates the appropriate PDF report based on the user's `program_type`.
 *
 * @param user - The unified user data object containing assessment results.
 * @param filePath - The absolute file path where the generated PDF will be saved.
 * @returns A Promise that resolves to the PDF user password.
 */
export async function generateReportForUser(
  user: MergedReportData,
  filePath: string,
): Promise<string> {
  logger.info(
    `[ReportFactory] Generating Type ${user.program_type} for ${user.full_name}`,
  );

  // 1. Generate PDF user password (cryptographically random)
  let userPassword = generateRandomPassword();

  // 2. Admin password — MUST be set in environment; no fallback to avoid leaked default
  const adminPassword = process.env.PDF_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      'PDF_ADMIN_PASSWORD environment variable is not set. Cannot generate protected reports.',
    );
  }

  // 3. Update DB with user password (or retrieve existing one)
  if (user.assigned_exam_id) {
    try {
      userPassword = await updateReportPassword(
        user.assigned_exam_id,
        userPassword,
      );
    } catch (err) {
      logger.error(
        `[ReportFactory] Failed to update/fetch password for user ${user.full_name}`,
        err,
      );
      // Proceed with the generated password as a best-effort fallback.
    }
  } else {
    logger.warn(
      `[ReportFactory] User ${user.full_name} has no assigned_exam_id. Skipping DB password update.`,
    );
  }

  // 4. Build PDF options
  const pdfOptions: PDFKit.PDFDocumentOptions = {
    userPassword,
    ownerPassword: adminPassword,
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: false,
      documentAssembly: false,
    },
  };

  logger.info(
    `[ReportFactory] Building PDF for program_type ${user.program_type}`,
  );

  switch (user.program_type) {
    case ProgramType.SCHOOL:
      await new SchoolReport(
        user as unknown as SchoolData,
        pdfOptions,
      ).generate(filePath);
      break;
    case ProgramType.COLLEGE:
      await new CollegeReport(
        user as unknown as CollegeData,
        pdfOptions,
      ).generate(filePath);
      break;
    case ProgramType.EMPLOYEE:
      await new EmployeeReport(
        user as unknown as EmployeeData,
        pdfOptions,
      ).generate(filePath);
      break;
    case ProgramType.CXO:
      await new CxoReport(user as unknown as CxoData, pdfOptions).generate(
        filePath,
      );
      break;
    default:
      logger.error(
        `[ReportFactory] Unknown program_type: ${user.program_type}`,
      );
      throw new Error(`Unknown program_type: ${user.program_type}`);
  }

  return userPassword;
}

/**
 * Factory Function: buildReportJSON
 * ----------------------------------
 * Builds a structured JSON representation of the report content
 * (same logic as the PDF but returns data instead of rendering).
 *
 * @param user - The unified user data object containing assessment results.
 * @returns A Promise that resolves to the structured JSON object.
 */
export async function buildReportJSON(
  user: MergedReportData,
): Promise<Record<string, unknown>> {
  logger.info(
    `[ReportFactory] Building JSON for Type ${user.program_type} - ${user.full_name}`,
  );

  switch (user.program_type) {
    case ProgramType.SCHOOL:
      return await buildSchoolReportJSON(user as unknown as SchoolData);
    case ProgramType.COLLEGE:
      return await buildCollegeReportJSON(user as unknown as CollegeData);
    case ProgramType.EMPLOYEE:
      return await buildEmployeeReportJSON(user as unknown as EmployeeData);
    case ProgramType.CXO:
      return await buildCxoReportJSON(user as unknown as CxoData);
    default:
      throw new Error(
        `JSON API not yet supported for program_type: ${user.program_type}.`,
      );
  }
}
