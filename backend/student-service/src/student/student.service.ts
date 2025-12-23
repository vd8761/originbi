import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/student.entity';

import { AssessmentSession } from '../entities/assessment_session.entity'; // import entity

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AssessmentSession)
    private readonly sessionRepo: Repository<AssessmentSession>,
  ) { }

  async checkAssessmentStatus(userId: number) {
    // Find the latest session for the user
    // Assuming status logic: Check if ANY session is completed, or if the user has completed ALL required sessions.
    // Based on user prompt: "Redirect to the dashboard on after the all the exam levels has been completed"
    // Usually that means identifying a specific program. For now, let's check if there is at least one COMPLETED session
    // OR if there's a current active session that is NOT completed.

    // Simplest logic based on screenshot and request:
    // If status is NOT_STARTED or anything != COMPLETED, show assessment.

    const session = await this.sessionRepo.findOne({
      where: { userId: userId },
      order: { createdAt: 'DESC' } // Get latest
    });

    if (!session) {
      // No session found? Maybe strictly force assessment or return "not started"
      return { isCompleted: false, status: 'NO_SESSION' };
    }

    return {
      isCompleted: session.status === 'COMPLETED',
      status: session.status
    };
  }

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
