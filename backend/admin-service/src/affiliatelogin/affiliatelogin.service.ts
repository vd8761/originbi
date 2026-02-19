import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as AdminUser, AffiliateAccount } from '@originbi/shared-entities';

@Injectable()
export class AffiliateLoginService {
    constructor(
        @InjectRepository(AdminUser)
        private readonly usersRepo: Repository<AdminUser>,
        @InjectRepository(AffiliateAccount)
        private readonly affiliateRepo: Repository<AffiliateAccount>,
    ) { }

    /**
     * Resolve affiliate user from Cognito sub or email.
     * 1) Find user by cognitoSub
     * 2) Fallback: find by email, sync cognitoSub
     * 3) Returns { user, affiliate } or null
     */
    async resolveUser(
        sub: string,
        email: string | undefined,
    ): Promise<{ user: AdminUser; affiliate: AffiliateAccount } | null> {
        // 1. Try by cognitoSub
        let user = await this.usersRepo.findOne({ where: { cognitoSub: sub } });

        // 2. Fallback: try by email
        if (!user && email) {
            user = await this.usersRepo.findOne({ where: { email } });
            if (user) {
                // Sync cognitoSub
                user.cognitoSub = sub;
                await this.usersRepo.save(user);
            }
        }

        if (!user) return null;

        // 3. Find linked affiliate account
        const affiliate = await this.affiliateRepo.findOne({
            where: { userId: user.id },
        });

        if (!affiliate) {
            console.warn(
                `[AffiliateLoginService] User ${user.id} (${user.email}) has no affiliate account`,
            );
            return null;
        }

        return { user, affiliate };
    }

    findByCognitoSub(sub: string): Promise<AdminUser | null> {
        return this.usersRepo.findOne({ where: { cognitoSub: sub } });
    }
}
