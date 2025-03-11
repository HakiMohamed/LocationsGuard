import { IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';
import { ReservationStatus } from '../schemas/reservation.schema';

export class CreateReservationDto {
    @IsNotEmpty()
    @IsString()
    client: string;

    @IsNotEmpty()
    @IsString()
    automobile: string;

    @IsNotEmpty()
    @IsString()

    startDate: Date;

    @IsNotEmpty()
    @IsString()

    endDate: Date;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    isPaid?: boolean;

    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: ReservationStatus;

    @IsOptional()
    @IsString()
    category?: string;
} 