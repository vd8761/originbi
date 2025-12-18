import { CorporateDashboardService } from './corporate-dashboard.service';
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
}
