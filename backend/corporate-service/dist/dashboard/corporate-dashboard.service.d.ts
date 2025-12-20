import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
import { User } from '../entities/user.entity';
import { CorporateAccount } from '../entities/corporate-account.entity';
import { CorporateCreditLedger } from '../entities/corporate-credit-ledger.entity';
import { UserActionLog } from '../entities/user-action-log.entity';
export declare class CorporateDashboardService {
    private readonly userRepo;
    private readonly corporateRepo;
    private actionLogRepository;
    private readonly ledgerRepo;
    private httpService;
    private configService;
    private readonly dataSource;
    private authServiceUrl;
    private razorpay;
    private perCreditCost;
    constructor(userRepo: Repository<User>, corporateRepo: Repository<CorporateAccount>, actionLogRepository: Repository<UserActionLog>, ledgerRepo: Repository<CorporateCreditLedger>, httpService: HttpService, configService: ConfigService, dataSource: DataSource);
    getStats(email: string): Promise<{
        companyName: string;
        availableCredits: number;
        totalCredits: number;
        studentsRegistered: number;
        isActive: boolean;
    }>;
    initiateCorporateReset(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private createCognitoUser;
    registerCorporate(dto: RegisterCorporateDto): Promise<{
        success: boolean;
        message: string;
    }>;
    private sendRegistrationSuccessEmail;
    getProfile(email: string): Promise<{
        id: number;
        company_name: string;
        sector_code: string;
        employee_ref_id: string;
        job_title: string;
        gender: string;
        email: string;
        country_code: string;
        mobile_number: string;
        linkedin_url: string;
        business_locations: string;
        available_credits: number;
        total_credits: number;
        is_active: boolean;
        is_blocked: boolean;
        full_name: string;
        created_at: Date;
        updated_at: Date;
        per_credit_cost: number;
        userId: number;
        user: User;
        companyName: string;
        availableCredits: number;
        totalCredits: number;
        employeeRefId?: string;
        isActive: boolean;
        creditLedgers: CorporateCreditLedger[];
        fullName?: string;
        sectorCode?: string;
        jobTitle?: string;
        countryCode?: string;
        mobileNumber?: string;
        linkedinUrl?: string;
        businessLocations?: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createOrder(email: string, creditCount: number, reason: string): Promise<{
        orderId: any;
        amount: number;
        currency: string;
        key: string;
        perCreditCost: number;
    }>;
    verifyPayment(email: string, paymentDetails: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    recordPaymentFailure(razorpayOrderId: string, errorDescription: string): Promise<{
        success: boolean;
    }>;
    private sendPaymentSuccessEmail;
    getLedger(email: string, page?: number, limit?: number, search?: string): Promise<{
        data: {
            id: number;
            corporate_account_id: number;
            credit_delta: number;
            ledger_type: string;
            reason: string;
            created_by_user_id: number;
            created_at: Date;
            per_credit_cost: number;
            total_amount: number;
            payment_status: string;
            paid_on: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    topUpCredits(email: string, amount: number, reason: string): Promise<{
        success: boolean;
        newAvailable: number;
        newTotal: number;
    }>;
}
