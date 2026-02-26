import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StudentSubscription } from '@originbi/shared-entities';
import { Registration } from '@originbi/shared-entities';
import { ConfigService } from '@nestjs/config';

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
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  private async queryRegistration(
    sql: string,
    params: unknown[],
  ): Promise<RegistrationRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const result = await this.dataSource.query(sql, params);
    return result as RegistrationRow[];
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
}
