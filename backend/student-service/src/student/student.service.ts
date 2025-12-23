import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/student.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  getProfile() {
    return { message: 'Hello Student!' };
  }

  async createTestStudent(email: string, fullName: string) {
    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({
        email,
        metadata: { fullName }
      });
      await this.userRepo.save(user);
      return { message: 'Test user created successfully', user };
    }
    return { message: 'User already exists', user };
  }
}
