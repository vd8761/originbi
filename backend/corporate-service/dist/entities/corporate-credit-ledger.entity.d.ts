import { CorporateAccount } from './corporate-account.entity';
import { User } from './user.entity';
export declare class CorporateCreditLedger {
    id: number;
    corporateAccountId: number;
    corporateAccount: CorporateAccount;
    creditDelta: number;
    reason?: string;
    createdByUserId?: number;
    createdByUser?: User;
    createdAt: Date;
}
