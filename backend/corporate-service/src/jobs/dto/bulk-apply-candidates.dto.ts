import { ArrayNotEmpty, IsArray, IsIn, IsOptional } from 'class-validator';

export class BulkApplyCandidatesDto {
  @IsArray()
  @ArrayNotEmpty()
  registrationIds: number[];

  @IsOptional()
  @IsIn(['INTERNAL', 'EXTERNAL', 'REFERRAL', 'BULK_IMPORT'])
  source?: 'INTERNAL' | 'EXTERNAL' | 'REFERRAL' | 'BULK_IMPORT';
}
