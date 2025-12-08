import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../../../../database/entities/AdminUser';


@Injectable()
export class AdminLoginService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly usersRepo: Repository<AdminUser>,
  ) {}

  findByCognitoSub(sub: string): Promise<AdminUser | null> {
    return this.usersRepo.findOne({ where: { cognitoSub: sub } });
  }
}


