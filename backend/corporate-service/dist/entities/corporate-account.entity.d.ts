import { User } from './user.entity';
import { CorporateCreditLedger } from './corporate-credit-ledger.entity';
export declare class CorporateAccount {
    id: number;
    userId: number;
    user: User;
    companyName: string;
    availableCredits: number;
    totalCredits: number;
    employeeRefId?: string;
    isActive: boolean;
    creditLedgers: CorporateCreditLedger[];
}
