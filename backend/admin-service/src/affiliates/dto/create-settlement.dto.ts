import { IsNotEmpty, IsString, IsNumber, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSettlementDto {
    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    settleAmount: number;

    @IsString()
    @IsNotEmpty()
    @IsIn(['UPI_ID', 'UPI_NUMBER', 'BANK_TRANSFER'])
    transactionMode: string;

    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @IsString()
    @IsNotEmpty()
    paymentDate: string; // ISO date string e.g. '2026-02-17'
}
