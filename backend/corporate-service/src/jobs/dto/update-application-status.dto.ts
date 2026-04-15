import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsString()
  @IsIn(['APPLIED', 'SHORTLISTED', 'HIRED', 'REJECTED', 'WITHDRAWN'])
  toStatus: 'APPLIED' | 'SHORTLISTED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
