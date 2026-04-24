/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import * as crypto from 'crypto';
import { SchoolReport } from '../reports/school/schoolReport';
import { SchoolShortReport } from '../reports/school/schoolShortReport';
import { CollegeReport } from '../reports/college/collegeReport';
import { EmployeeReport } from '../reports/employee/employeeReport';
import { CxoReport } from '../reports/cxo/cxoReport';
import { CollegeShortReport } from '../reports/college/collegeShortReport';
import { EmployeeShortReport } from '../reports/employee/employeeShortReport';
import {
  CollegeData,
  SchoolData,
  EmployeeData,
  CxoData,
  MergedReportData,
} from '../types/types';
import { logger } from './logger';
import { updateReportPassword } from './sqlHelper';
import { getPool } from './dbPool';
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
 * Fetches report password settings from the originbi_settings table.
 * This is called from a standalone context (not NestJS DI) so it queries
 * the DB directly via the existing pg pool.
 */
async function getReportPasswordSettings(): Promise<{
  enabled: boolean;
  adminPassword: string;
}> {
  const pool = getPool();
  try {
    // Fetch the toggle
    const toggleResult = await pool.query(
      `SELECT value_boolean FROM originbi_settings WHERE category = 'report' AND setting_key = 'report_password_enabled' LIMIT 1`,
    );
    const enabled =
      toggleResult.rows.length > 0 ? toggleResult.rows[0].value_boolean : true;

    // Fetch the admin password
    const pwResult = await pool.query(
      `SELECT value_string FROM originbi_settings WHERE category = 'report' AND setting_key = 'report_admin_password' LIMIT 1`,
    );
    const adminPassword =
      pwResult.rows.length > 0 ? pwResult.rows[0].value_string || '' : '';

    return { enabled: enabled !== false, adminPassword };
  } catch (err) {
    logger.warn(
      `[ReportFactory] Failed to fetch report password settings from DB, falling back to defaults.`,
      err,
    );
    return { enabled: true, adminPassword: '' };
  }
}

/**
 * Factory Function: generateReportForUser
 * ---------------------------------------
 * Instantiates and generates the appropriate PDF report based on the user's `program_type`.
 *
 * @param user - The unified user data object containing assessment results.
 * @param filePath - The absolute file path where the generated PDF will be saved.
 * @returns A Promise that resolves to the PDF user password (empty string if passwords disabled).
 */
export async function generateReportForUser(
  user: MergedReportData,
  filePath: string,
  short: boolean = false,
): Promise<string> {
  logger.info(
    `[ReportFactory] Generating Type ${user.program_type}${short ? ' (SHORT)' : ''} for ${user.full_name}`,
  );

  // 1. Fetch password settings from DB
  const passwordSettings = await getReportPasswordSettings();

  let userPassword = '';
  let pdfOptions: PDFKit.PDFDocumentOptions = {};

  if (passwordSettings.enabled) {
    // 2. Generate PDF user password (cryptographically random)
    userPassword = generateRandomPassword();

    // 3. Admin password — from DB, fall back to ENV, then throw if neither is set
    const adminPassword =
      passwordSettings.adminPassword || process.env.PDF_ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error(
        'PDF admin password is not configured. Set it in Admin Panel → Report Settings, or set PDF_ADMIN_PASSWORD environment variable.',
      );
    }

    // 4. Update DB with user password (or retrieve existing one)
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

    // 5. Build PDF options with password protection
    pdfOptions = {
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
  } else {
    logger.info(
      `[ReportFactory] Report password protection is DISABLED. Generating unprotected PDF.`,
    );
  }

  logger.info(
    `[ReportFactory] Building PDF for program_type ${user.program_type}`,
  );

  switch (user.program_type) {
    case ProgramType.SCHOOL: {
      const schoolUser = user as unknown as SchoolData;
      if (short) {
        // Select short-report variant by school level / board.
        // Currently only SSLC is implemented; HSC/GCSE fall through to
        // the same class with a variant flag (placeholder for now).
        const isGCSE =
          schoolUser.student_board?.toUpperCase() === 'IGCSE' ||
          schoolUser.student_board?.toUpperCase() === 'IGSCE' ||
          schoolUser.group_name?.toUpperCase() === 'IGCSE' ||
          schoolUser.dept_code?.toUpperCase() === 'IGCSE';

        const variant: 'SSLC' | 'HSC' | 'GCSE' = isGCSE
          ? 'GCSE'
          : schoolUser.school_level_id === 1
            ? 'SSLC'
            : 'HSC';

        await new SchoolShortReport(schoolUser, pdfOptions, variant).generate(
          filePath,
        );
      } else {
        await new SchoolReport(schoolUser, pdfOptions).generate(filePath);
      }
      break;
    }
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
 * Factory Function: generateShortReportForUser
 * ---------------------------------------------
 * Instantiates and generates the appropriate SHORT PDF report
 * based on the user's `program_type`.
 */
export async function generateShortReportForUser(
  user: MergedReportData,
  filePath: string,
): Promise<void> {
  logger.info(
    `[ReportFactory] Building SHORT PDF for program_type ${user.program_type}`,
  );

  switch (user.program_type) {
    case ProgramType.COLLEGE:
      await new CollegeShortReport(
        user as unknown as CollegeData,
      ).generate(filePath);
      break;
    case ProgramType.EMPLOYEE:
      await new EmployeeShortReport(
        user as unknown as EmployeeData,
      ).generate(filePath);
      break;
    default:
      logger.error(
        `[ReportFactory] Short report not supported for program_type: ${user.program_type}`,
      );
      throw new Error(`Short report not supported for program_type: ${user.program_type}`);
  }
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
