import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getMessage() {
    return { message: 'Admin service working!' };
  }
}
