import { CorporateDashboardService } from './corporate-dashboard.service';
import { RegisterCorporateDto } from './dto/register-corporate.dto';
export declare class CorporateDashboardController {
    private readonly dashboardService;
    constructor(dashboardService: CorporateDashboardService);
    getDashboardStats(email: string): Promise<{
        companyName: string;
        availableCredits: number;
        totalCredits: number;
        studentsRegistered: number;
        isActive: boolean;
    }>;
    initiateReset(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
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
        user: import("../entities/user.entity").User;
        companyName: string;
        availableCredits: number;
        totalCredits: number;
        employeeRefId?: string;
        isActive: boolean;
        creditLedgers: import("../entities/corporate-credit-ledger.entity").CorporateCreditLedger[];
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
    createOrder(email: string, creditCount: number, reason: string): Promise<{
        orderId: any;
        amount: number;
        currency: string;
        key: string;
        perCreditCost: number;
    }>;
    verifyPayment(email: string, paymentDetails: any): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    recordPaymentFailure(orderId: string, description: string): Promise<{
        success: boolean;
    }>;
    registerCorporate(dto: RegisterCorporateDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
