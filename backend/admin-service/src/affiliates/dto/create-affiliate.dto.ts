import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateAffiliateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsOptional()
    countryCode?: string;

    @IsString()
    @IsNotEmpty()
    mobileNumber: string;

    @IsString()
    @IsOptional()
    address?: string;

    // Commission
    @IsNumber()
    @IsOptional()
    commissionPercentage?: number;

    // Payment: UPI
    @IsString()
    @IsOptional()
    upiId?: string;

    @IsString()
    @IsOptional()
    upiNumber?: string;

    // Payment: Banking
    @IsString()
    @IsOptional()
    bankingName?: string;

    @IsString()
    @IsOptional()
    accountNumber?: string;

    @IsString()
    @IsOptional()
    ifscCode?: string;

    @IsString()
    @IsOptional()
    branchName?: string;

    // Document URLs (stored as arrays after OneDrive upload)
    @IsArray()
    @IsOptional()
    aadharUrls?: string[];

    @IsArray()
    @IsOptional()
    panUrls?: string[];
}

export class UpdateAffiliateDto extends PartialType(CreateAffiliateDto) { }
