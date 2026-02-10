// backend/student-service/src/student/dto/create-registration.dto.ts

import { IsString, IsEmail, IsNotEmpty, IsOptional, IsIn, MinLength, Matches } from 'class-validator';

export class CreateRegistrationDto {
    @IsString()
    @IsNotEmpty()
    full_name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    mobile_number: string;

    @IsString()
    @IsOptional()
    country_code: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
    @Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, { message: 'Password must contain at least one special character' })
    password: string;

    @IsString()
    @IsOptional()
    @IsIn(['MALE', 'FEMALE', 'OTHER'])
    gender: string;

    @IsString()
    @IsOptional()
    program_code: string;

    @IsString()
    @IsOptional()
    school_level: string;

    @IsString()
    @IsOptional()
    school_stream: string;

    @IsString()
    @IsOptional()
    group_code: string;
}
