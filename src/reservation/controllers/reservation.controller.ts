import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Put, 
    Delete, 
    Query,
    UseGuards 
} from '@nestjs/common';
import { ReservationService } from '../services/reservation.service';
import { CreateReservationDto } from '../dto/create-reservation.dto';
import { UpdateReservationDto } from '../dto/update-reservation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/role.enum';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationController {
    constructor(private readonly reservationService: ReservationService) {}

    @Post()
    @Roles(UserRole.ADMIN, UserRole.CLIENT)
    async create(@Body() createReservationDto: CreateReservationDto) {
        return this.reservationService.create(createReservationDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: string
    ) {
        return this.reservationService.findAll(page, limit, status);
    }

    @Get('automobile/:automobileId')
    @Roles(UserRole.ADMIN)
    async findByAutomobile(
        @Param('automobileId') automobileId: string,
        @Query('status') status?: string
    ) {
        return this.reservationService.findByAutomobile(automobileId, status);
    }

    @Get('client/:clientId')
    @Roles(UserRole.ADMIN, UserRole.CLIENT)
    async findByClient(
        @Param('clientId') clientId: string,
        @Query('status') status?: string
    ) {
        return this.reservationService.findByClient(clientId, status);
    }

    @Get('category/:categoryId')
    @Roles(UserRole.ADMIN)
    async findByCategory(
        @Param('categoryId') categoryId: string,
        @Query('status') status?: string
    ) {
        return this.reservationService.findByCategory(categoryId, status);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.CLIENT)
    async findOne(@Param('id') id: string) {
        return this.reservationService.findOne(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id') id: string, 
        @Body() updateReservationDto: UpdateReservationDto
    ) {
        return this.reservationService.update(id, updateReservationDto);
    }

    @Put(':id/cancel')
    @Roles(UserRole.ADMIN, UserRole.CLIENT)
    async cancel(
        @Param('id') id: string,
        @Body('reason') reason: string
    ) {
        return this.reservationService.cancel(id, reason);
    }

    @Put(':id/confirm')
    @Roles(UserRole.ADMIN)
    async confirm(@Param('id') id: string) {
        return this.reservationService.confirm(id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    async remove(@Param('id') id: string) {
        return this.reservationService.remove(id);
    }

    @Put(':id/complete')
    @Roles(UserRole.ADMIN)
    async complete(@Param('id') id: string) {
        return this.reservationService.complete(id);
    }

    @Put(':id/pending')
    @Roles(UserRole.ADMIN)
    async pending(@Param('id') id: string) {
        return this.reservationService.SetPending(id);
    }
} 