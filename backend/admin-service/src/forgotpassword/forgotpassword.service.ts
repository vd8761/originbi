import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class ForgotPasswordService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async checkAdminEligibility(email: string): Promise<boolean> {
        const user = await this.usersRepository.findOne({ where: { email } });

        // User must exist
        if (!user) {
            return false;
        }

        // Role must be explicitly 'ADMIN'
        if (user.role !== 'ADMIN') {
            return false;
        }

        return true;
    }
}
