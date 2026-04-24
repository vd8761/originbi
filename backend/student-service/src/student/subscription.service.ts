import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Registration, StudentSubscription } from '@originbi/shared-entities';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AssessmentReport } from '../entities/assessment-report.entity';
import { User } from '../entities/student.entity';
import { Program } from '../entities/program.entity';
import { SettingsService } from '../settings/settings.service';
import { lastValueFrom } from 'rxjs';
import * as nodemailer from 'nodemailer';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { getDebriefBookingEmailTemplate } from '../mail/templates/debrief-booking.template';
import { getDebriefTeamNotificationEmailTemplate } from '../mail/templates/debrief-team-notification.template';

interface RegistrationRow {
  id: number;
  user_id: number;
  has_ai_counsellor?: boolean;
  full_name?: string;
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

export interface SubscriptionPlanInfo {
  planType: string;
  status: string;
  purchasedAt?: Date | null;
  expiresAt?: Date | null;
  daysRemaining?: number;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(StudentSubscription)
    private readonly subscriptionRepo: Repository<StudentSubscription>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(AssessmentReport)
    private readonly reportRepo: Repository<AssessmentReport>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Creates a configured nodemailer transporter backed by AWS SES v2.
   */
  private createEmailTransporter() {
    const region =
      this.configService.get<string>('AWS_REGION') ||
      this.configService.get<string>('AWS_DEFAULT_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS SES configuration is missing. Ensure AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are set.',
      );
    }

    const sesClient = new SESv2Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    return nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand },
    } as any);
  }

  private async queryRegistration(
    sql: string,
    params: unknown[],
  ): Promise<RegistrationRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await this.dataSource.query(sql, params);
    return result as RegistrationRow[];
  }

  /**
   * Send debrief booking emails to student and expert team
   */
  public async sendDebriefEmails(email: string, registrationId: number) {
    try {
      // 1. Get detailed info for the templates
      const registration = await this.registrationRepo.findOne({
        where: { id: registrationId },
        relations: ['group'],
      });

      if (!registration) return;

      // Idempotency check: if team email was sent, both emails (student/team) are already handled
      if (registration.metadata?.debriefTeamEmailSent === true || registration.metadata?.debriefTeamEmailSent === 'true') {
        this.logger.log(`Debrief emails already sent for registration ${registrationId}, skipping.`);
        return;
      }

      const user = await this.userRepo.findOne({ where: { id: registration.userId } });
      const program = await this.programRepo.findOne({ where: { id: registration.programId } });

      if (!user) return;

      // 2. Prepare assets and transporter
      const assets = {
        logo: `https://mind.originbi.com/Origin-BI-Logo-01.png`,
        popper: `${this.configService.get('API_URL') || 'https://mind.originbi.com'}/assets/Popper.png`,
        footer: `${this.configService.get('API_URL') || 'https://mind.originbi.com'}/assets/Email_Vector.png`,
      };

      const transporter = this.createEmailTransporter();
      const {
        fromName,
        fromAddress: fromEmail,
        replyToAddress,
      } = await this.settingsService.getEmailConfig('report_email_config');

      // 3. Send Student Confirmation Email IMMEDIATELY
      const studentHtml = getDebriefBookingEmailTemplate(
        registration.fullName || 'Student',
        assets,
      );

      const studentMailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: user.email,
        subject: `Expert Debrief Booking Confirmed - Origin BI`,
        html: studentHtml,
        replyTo: replyToAddress,
      };

      await transporter.sendMail(studentMailOptions);
      this.logger.log(`Debrief booking confirmation sent to student: ${user.email}`);

      // 4. Try to send Team Notification (only if report is already ready)
      let pdfBuffer: Buffer | null = null;
      let attachmentFileName = '';

      const sessionSql = `SELECT id FROM assessment_sessions WHERE registration_id = $1 AND status = 'COMPLETED' ORDER BY updated_at DESC LIMIT 1`;
      const sessions = await this.dataSource.query(sessionSql, [registrationId]);

      if (sessions && sessions.length > 0) {
        const sessionId = sessions[0].id;
        const report = await this.reportRepo.findOne({
          where: { assessmentSessionId: sessionId },
          order: { generatedAt: 'DESC' },
        });

        if (report && report.reportNumber) {
          try {
            const port = process.env.PORT || 4004;
            const downloadUrl = `http://localhost:${port}/report/download/file/${report.reportNumber}`;
            
            this.logger.log(`Attempting to download report for team attachment: ${downloadUrl}`);
            const pdfResponse = await lastValueFrom(
              this.httpService.get(downloadUrl, { responseType: 'arraybuffer' }),
            );
            pdfBuffer = Buffer.from(pdfResponse.data, 'binary');
            attachmentFileName = `${(registration.fullName || 'Student').replace(/\s/g, '_')}_Report.pdf`;
          } catch (downloadErr: any) {
            this.logger.warn(`Could not download report for debrief attachment: ${downloadErr.message}`);
          }
        }
      }

      // If report is not ready, team notification will be sent later by handleAssessmentCompletion
      if (!pdfBuffer) {
        this.logger.log(`Debrief student confirmation sent. Team notification postponed: report not yet ready for registration ${registrationId}`);
        return;
      }

      // 5. Report is ready — send Team Notification now
      const debriefForwardEmails = (this.configService.get('DEBRIEF_FORWARD_EMAILS') || 'info@originbi.com,vikashuvi07@gmail.com')
        .split(',')
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0);

      // Construct academic details string
      let academicDetails = 'Not specified';
      if (registration.schoolLevel) {
        academicDetails = `Class ${registration.schoolLevel}`;
        if (registration.schoolStream) academicDetails += `, ${registration.schoolStream}`;
        if (registration.studentBoard) academicDetails += `, ${registration.studentBoard}`;
      } else if (registration.departmentDegreeId) {
        academicDetails = `College/University Degree`;
        if (registration.metadata?.currentYear) academicDetails += ` (Year ${registration.metadata.currentYear})`;
      }

      const totalAmount = parseFloat(registration.paymentAmount?.toString() || '2500');
      const debriefAmountStr = this.configService.get<string>('DEBRIEF_AMOUNT') || this.configService.get<string>('NEXT_PUBLIC_DEBRIEF_AMOUNT') || '2500';
      const debriefCostValue = parseFloat(debriefAmountStr);
      const registrationCostValue = totalAmount > debriefCostValue ? totalAmount - debriefCostValue : 0;

      const teamHtml = getDebriefTeamNotificationEmailTemplate(
        registration.fullName || 'Student',
        user.email,
        `${registration.countryCode || '+91'} ${registration.mobileNumber}`,
        registration.gender || 'Not specified',
        totalAmount.toFixed(2),
        registrationCostValue.toFixed(2),
        debriefCostValue.toFixed(2),
        registration.paymentReference || 'N/A',
        new Date(registration.createdAt).toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
          hour12: true,
        }),
        program?.assessmentTitle || program?.name || 'Assessment Program',
        academicDetails,
        assets,
      );

      for (const forwardEmail of debriefForwardEmails) {
        const teamMailOptions: any = {
          from: `"${fromName}" <${fromEmail}>`,
          to: forwardEmail,
          subject: `[Debrief Booking] ${registration.fullName || 'Student'} - Expert Debrief Session`,
          html: teamHtml,
          attachments: [
            {
              filename: attachmentFileName,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        };

        await transporter.sendMail(teamMailOptions);
        this.logger.log(`Debrief team notification sent to: ${forwardEmail}`);
      }

      // 6. Mark team notification as sent to avoid duplicates
      const freshReg = await this.registrationRepo.findOne({ where: { id: registrationId } });
      if (freshReg) {
        const meta = freshReg.metadata || {};
        meta.debriefTeamEmailSent = true;
        await this.registrationRepo.update(registrationId, { metadata: meta });
      }

    } catch (err: any) {
      this.logger.error(`Failed to send debrief emails: ${err.message}`);
    }
  }

  /**
   * Check if a student has an active AI Counsellor subscription
   */
  async getSubscriptionStatus(email: string): Promise<{
    hasAiCounsellor: boolean;
    plan: SubscriptionPlanInfo | null;
    daysRemaining?: number;
  }> {
    try {
      // Quick check via registration flag first
      this.logger.log(`Checking subscription status for email: ${email}`);
      const registration = await this.queryRegistration(
        `SELECT r.id, r.user_id, r.has_ai_counsellor, r.full_name
                 FROM registrations r
                 JOIN users u ON r.user_id = u.id
                 WHERE LOWER(u.email) = LOWER($1) AND r.is_deleted = false
                 ORDER BY r.created_at DESC LIMIT 1`,
        [email],
      );
      this.logger.log(
        `Registration query result: ${JSON.stringify(registration)}`,
      );

      if (!registration || registration.length === 0) {
        return { hasAiCounsellor: false, plan: null };
      }

      const reg = registration[0];

      if (reg.has_ai_counsellor) {
        // Try to fetch active subscription details (may not exist for admin-toggled access)
        let sub: StudentSubscription | null = null;
        try {
          sub = await this.subscriptionRepo.findOne({
            where: {
              userId: reg.user_id,
              planType: 'ai_counsellor' as StudentSubscription['planType'],
              status: 'active' as StudentSubscription['status'],
            },
            order: { createdAt: 'DESC' },
          });
        } catch (subErr: unknown) {
          // student_subscriptions table may not exist yet — that's fine for admin-toggled access
          this.logger.warn(
            `Subscription table query failed (may not exist yet): ${getErrorMessage(subErr)}`,
          );
        }

        if (sub) {
          // Check if subscription has expired (90-day validity)
          if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
            this.logger.log(
              `⏰ Subscription expired for ${email} (expired: ${String(sub.expiresAt)})`,
            );
            // Mark as expired
            try {
              await this.subscriptionRepo.update(sub.id, {
                status: 'expired' as StudentSubscription['status'],
              });
            } catch {
              /* table may not exist */
            }
            await this.dataSource.query(
              `UPDATE registrations SET has_ai_counsellor = false WHERE id = $1`,
              [reg.id],
            );
            return {
              hasAiCounsellor: false,
              plan: {
                planType: sub.planType,
                status: 'expired',
                expiresAt: sub.expiresAt,
              },
            };
          }

          const daysRemaining = sub.expiresAt
            ? Math.max(
                0,
                Math.ceil(
                  (new Date(sub.expiresAt).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                ),
              )
            : 90;

          return {
            hasAiCounsellor: true,
            daysRemaining,
            plan: {
              planType: sub.planType,
              status: sub.status,
              purchasedAt: sub.purchasedAt,
              expiresAt: sub.expiresAt,
              daysRemaining,
            },
          };
        }

        // Admin-toggled access (no subscription record) — grant access
        return {
          hasAiCounsellor: true,
          plan: { planType: 'ai_counsellor', status: 'active' },
        };
      }

      return { hasAiCounsellor: false, plan: null };
    } catch (error: unknown) {
      this.logger.error(
        `Error checking subscription: ${getErrorMessage(error)}`,
      );
      return { hasAiCounsellor: false, plan: null };
    }
  }

  /**
   * Create a Razorpay order for AI Counsellor purchase
   */
  async createPurchaseOrder(email: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> {
    const razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const razorpayKeySecret = this.configService.get<string>(
      'RAZORPAY_KEY_SECRET',
    );

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Payment gateway not configured');
    }

    const amount = 35000; // ₹350 in paise
    const currency = 'INR';

    // Create Razorpay order via API
    const orderData = {
      amount,
      currency,
      receipt: `ai_counsellor_${String(Date.now())}`,
      notes: { email, plan: 'ai_counsellor' },
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' +
          Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString(
            'base64',
          ),
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Razorpay order creation failed: ${err}`);
      throw new Error('Failed to create payment order');
    }

    const order = (await response.json()) as RazorpayOrderResponse;

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
    };
  }

  /**
   * Verify Razorpay payment and activate subscription
   */
  async verifyPaymentAndActivate(body: {
    email: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; message: string }> {
    const razorpayKeySecret = this.configService.get<string>(
      'RAZORPAY_KEY_SECRET',
    );

    if (!razorpayKeySecret) {
      throw new Error('Payment gateway not configured');
    }

    // Verify signature
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== body.razorpay_signature) {
      this.logger.warn(`Payment verification failed for ${body.email}`);
      return { success: false, message: 'Payment verification failed' };
    }

    // Get user and registration
    const registration = await this.queryRegistration(
      `SELECT r.id, r.user_id
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             WHERE u.email = $1 AND r.is_deleted = false
             ORDER BY r.created_at DESC LIMIT 1`,
      [body.email],
    );

    if (!registration || registration.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const reg = registration[0];

    // Use a transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create subscription record (90-day validity)
      await queryRunner.query(
        `INSERT INTO student_subscriptions 
                    (user_id, registration_id, plan_type, status, payment_provider, payment_reference, payment_order_id, amount, currency, purchased_at, expires_at)
                 VALUES ($1, $2, 'ai_counsellor', 'active', 'razorpay', $3, $4, 350.00, 'INR', NOW(), NOW() + INTERVAL '90 days')`,
        [reg.user_id, reg.id, body.razorpay_payment_id, body.razorpay_order_id],
      );

      // Set fast-access flag on registration
      await queryRunner.query(
        `UPDATE registrations SET has_ai_counsellor = true WHERE id = $1`,
        [reg.id],
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `✅ AI Counsellor activated for ${body.email} (payment: ${body.razorpay_payment_id})`,
      );
      return {
        success: true,
        message: 'AI Counsellor activated successfully!',
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Activation failed: ${getErrorMessage(error)}`);
      return {
        success: false,
        message: 'Activation failed. Please contact support.',
      };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Admin/test: manually activate AI Counsellor for a student
   */
  async manualActivate(email: string): Promise<{ success: boolean }> {
    try {
      const registration = await this.queryRegistration(
        `SELECT r.id, r.user_id
                 FROM registrations r
                 JOIN users u ON r.user_id = u.id
                 WHERE u.email = $1 AND r.is_deleted = false
                 ORDER BY r.created_at DESC LIMIT 1`,
        [email],
      );

      if (!registration || registration.length === 0) {
        return { success: false };
      }

      const reg = registration[0];

      await this.dataSource.query(
        `INSERT INTO student_subscriptions 
                    (user_id, registration_id, plan_type, status, amount, purchased_at, expires_at, metadata)
                 VALUES ($1, $2, 'ai_counsellor', 'active', 0, NOW(), NOW() + INTERVAL '90 days', '{"source": "manual_activation"}')`,
        [reg.user_id, reg.id],
      );

      await this.dataSource.query(
        `UPDATE registrations SET has_ai_counsellor = true WHERE id = $1`,
        [reg.id],
      );

      this.logger.log(`✅ AI Counsellor manually activated for ${email}`);
      return { success: true };
    } catch (error: unknown) {
      this.logger.error(`Manual activation failed: ${getErrorMessage(error)}`);
      return { success: false };
    }
  }

  /**
   * Create a Razorpay order for Debrief Booking
   */
  async createDebriefOrder(email: string): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> {
    const razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const razorpayKeySecret = this.configService.get<string>(
      'RAZORPAY_KEY_SECRET',
    );

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Payment gateway not configured');
    }

    const user = await this.userRepo.findOne({ where: { email: (email as any).email || email } });
    if (!user) throw new BadRequestException('User not found');

    // Amount can be overridden by env, defaults to 2500 INR (250000 paise)
    const baseAmountStr = this.configService.get<string>('NEXT_PUBLIC_DEBRIEF_AMOUNT') || '2500';
    const amountStr = this.configService.get<string>('DEBRIEF_AMOUNT') || baseAmountStr;
    const amount = parseInt(amountStr, 10) * 100;
    const currency = 'INR';

    // Create Razorpay order via API
    const orderData = {
      amount,
      currency,
      receipt: `debrief_${String(Date.now())}`,
      notes: { email, plan: 'debrief' },
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          'Basic ' +
          Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString(
            'base64',
          ),
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Razorpay debrief order creation failed: ${err}`);
      throw new Error('Failed to create debrief payment order');
    }

    const order = (await response.json()) as RazorpayOrderResponse;

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
    };
  }

  /**
   * Check if a student has booked a debrief session
   */
  async getDebriefStatus(email: string): Promise<{
    booked: boolean;
    purchasedAt?: Date | null;
    paymentReference?: string | null;
  }> {
    try {
      const registration = await this.queryRegistration(
        `SELECT r.id, r.user_id, r.metadata
                 FROM registrations r
                 JOIN users u ON r.user_id = u.id
                 WHERE LOWER(u.email) = LOWER($1) AND r.is_deleted = false
                 ORDER BY r.created_at DESC LIMIT 1`,
        [email],
      );

      if (!registration || registration.length === 0) {
        return { booked: false };
      }

      const reg = registration[0];
      const metadata = (reg as any).metadata || {};

      // Check registration metadata first (fastest)
      if (metadata.debrief) {
        // Try to find the actual subscription record for details
        const sub = await this.subscriptionRepo.findOne({
          where: {
            registrationId: reg.id,
            planType: 'debrief' as any,
            status: 'active' as any,
          },
          order: { createdAt: 'DESC' },
        });

        return {
          booked: true,
          purchasedAt: sub?.purchasedAt || null,
          paymentReference: sub?.paymentReference || null,
        };
      }

      return { booked: false };
    } catch (error: unknown) {
      this.logger.error(`Error checking debrief status: ${getErrorMessage(error)}`);
      return { booked: false };
    }
  }

  /**
   * Verify Razorpay payment and activate debrief
   */
  async verifyDebriefPayment(body: {
    email: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; message: string }> {
    const razorpayKeySecret = this.configService.get<string>(
      'RAZORPAY_KEY_SECRET',
    );

    if (!razorpayKeySecret) {
      throw new Error('Payment gateway not configured');
    }

    // Verify signature
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== body.razorpay_signature) {
      this.logger.warn(`Debrief payment verification failed for ${body.email}`);
      return { success: false, message: 'Payment verification failed' };
    }

    // Get user and registration
    const registration = await this.queryRegistration(
      `SELECT r.id, r.user_id, r.metadata
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             WHERE u.email = $1 AND r.is_deleted = false
             ORDER BY r.created_at DESC LIMIT 1`,
      [body.email],
    );

    if (!registration || registration.length === 0) {
      return { success: false, message: 'User not found' };
    }

    const reg = registration[0];

    // Use a transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const dbAmount = this.configService.get<string>('DEBRIEF_AMOUNT') || this.configService.get<string>('NEXT_PUBLIC_DEBRIEF_AMOUNT') || '2500';

      // Create subscription record
      await queryRunner.query(
        `INSERT INTO student_subscriptions 
                    (user_id, registration_id, plan_type, status, payment_provider, payment_reference, payment_order_id, amount, currency, purchased_at, metadata)
                 VALUES ($1, $2, 'debrief', 'active', 'razorpay', $3, $4, $5, 'INR', NOW(), '{"debrief": true}')`,
        [reg.user_id, reg.id, body.razorpay_payment_id, body.razorpay_order_id, parseFloat(dbAmount)],
      );

      // Update metadata on registration for easy frontend/subsequent workflow checking
      const currentMeta = (reg as any).metadata || {};
      const newMeta = { ...currentMeta, debrief: true };
      
      await queryRunner.query(
        `UPDATE registrations SET metadata = $1 WHERE id = $2`,
        [JSON.stringify(newMeta), reg.id],
      );

      await queryRunner.commitTransaction();

      this.logger.log(
        `✅ Debrief booked for ${body.email} (payment: ${body.razorpay_payment_id})`,
      );

      // Trigger emails in background
      this.sendDebriefEmails((body.email as any).email || body.email, reg.id).catch((err) =>
        this.logger.error(`Background debrief emails failed: ${err.message}`),
      );

      return {
        success: true,
        message: 'Debrief booked successfully!',
      };
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Debrief booking failed: ${getErrorMessage(error)}`);
      return {
        success: false,
        message: 'Booking failed. Please contact support.',
      };
    } finally {
      await queryRunner.release();
    }
  }
}
