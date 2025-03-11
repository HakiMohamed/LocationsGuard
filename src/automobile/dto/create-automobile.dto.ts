import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { FuelType, TransmissionType } from '../schemas/automobile.schema';
import { IsObjectId, TransformObjectId } from '../../common/decorators/is-object-id.decorator'; 


export class CreateAutomobileDto {
    @IsNotEmpty()
    @IsString()
    brand: string;

    @IsNotEmpty()
    @IsString()
    model: string;

    @IsNotEmpty()
    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    year: number;

    @IsNotEmpty()
    @IsObjectId()
    @TransformObjectId()
    category: string;

    @IsNotEmpty()
    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    dailyRate: number;

    @IsNotEmpty()
    @IsEnum(FuelType)
    fuelType: FuelType;

    @IsNotEmpty()
    @IsEnum(TransmissionType)
    transmission: TransmissionType;

    @IsNotEmpty()
    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    seats: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsString()
    licensePlate?: string;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    mileage?: number;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    engineCapacity?: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseFloat(value))
    fuelConsumption?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    features?: string[];

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;
}