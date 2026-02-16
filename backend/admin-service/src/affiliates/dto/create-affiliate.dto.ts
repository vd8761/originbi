import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

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
}

export class UpdateAffiliateDto extends PartialType(CreateAffiliateDto) {
    @IsArray()
    @IsOptional()
    aadharDocuments?: Array<{ key: string; url: string; fileName: string }>;

    @IsArray()
    @IsOptional()
    panDocuments?: Array<{ key: string; url: string; fileName: string }>;
}

