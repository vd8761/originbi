// backend/admin-service/src/registrations/dto/create-registration.dto.ts

import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  MinLength,
  Matches,
  IsIn,
} from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  // ✅ frontend will send MALE/FEMALE/OTHER now
  @IsOptional()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @IsOptional()
  @IsString()
  countryCode?: string; // +91 default handled in service

  @IsString()
  @IsNotEmpty()
  mobile: string;

  // ✅ now optional (you said will store in another table later)
  @IsOptional()
  @IsString()
  programType?: string;

  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  // ✅ now optional
  @IsOptional()
  @IsString()
  examStart?: string;

  @IsOptional()
  @IsString()
  examEnd?: string;

  // School
  @IsOptional()
  @IsString()
  schoolLevel?: string;

  @IsOptional()
  @IsString()
  schoolStream?: string;

  @IsOptional()
  @IsString()
  currentYear?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  // ✅ password required (Cognito)
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
    message: 'Password must contain at least one special character',
  })
  password: string;
}
