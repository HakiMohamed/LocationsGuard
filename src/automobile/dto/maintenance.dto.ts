import { IsDate, IsEnum, IsMongoId, IsNumber, IsOptional, IsString, IsArray, IsUrl, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceType, MaintenanceStatus } from '../schemas/maintenance.schema';

export class CreateMaintenanceDto {
    @IsMongoId()
    automobileId: string;

    @IsEnum(MaintenanceType)
    type: MaintenanceType;

    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @Type(() => Date)
    @IsDate()
    scheduledDate: Date;

    @IsNumber()
    @Min(0)
    cost: number;

    @IsArray()
    @IsUrl({}, { each: true })
    @IsOptional()
    documents?: string[];

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    nextMaintenanceDate?: Date;

    @IsNumber()
    @IsOptional()
    mileageAtMaintenance?: number;
}

export class UpdateMaintenanceDto {
    @IsEnum(MaintenanceStatus)
    @IsOptional()
    status?: MaintenanceStatus;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    scheduledDate?: Date;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    completedDate?: Date;

    @IsNumber()
    @Min(0)
    @IsOptional()
    cost?: number;

    @IsArray()
    @IsUrl({}, { each: true })
    @IsOptional()
    documents?: string[];
} 