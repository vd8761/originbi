import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../entities/AdminUser';
@Injectable()
export class AdminLoginService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly usersRepo: Repository<AdminUser>,
  ) { }

  async resolveUser(sub: string, email: string | undefined): Promise<AdminUser | null> {
    // 1. Try by sub
    let user = await this.usersRepo.findOne({ where: { cognitoSub: sub } });
    if (user) return user;

    // 2. Try by email
    if (email) {
      user = await this.usersRepo.findOne({ where: { email } });
      if (user) {
        // Sync sub
        user.cognitoSub = sub;
        await this.usersRepo.save(user);
        return user;
      }

      // 3. Auto-create user if not found (Enable this for initial setup/dev)
      console.log(`[AdminLoginService] Auto-creating admin user for ${email}`);
      const newUser = this.usersRepo.create({
        cognitoSub: sub,
        email: email,
        role: 'ADMIN',
        isActive: true,
        isBlocked: false,
      });
      return this.usersRepo.save(newUser);
    }

    return null;
  }

  // kept for backward compatibility if needed, but resolveUser is preferred
  findByCognitoSub(sub: string): Promise<AdminUser | null> {
    return this.usersRepo.findOne({ where: { cognitoSub: sub } });
  }
}
