import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { MaintenanceService } from '../services/maintenance.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from '../dto/maintenance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/role.enum';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) {}

    @Post()
    create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
        return this.maintenanceService.create(createMaintenanceDto);
    }

    @Get()
    findAll() {
        return this.maintenanceService.findAll();
    }

    @Get('stats')
    async getStats(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ) {
        return this.maintenanceService.getMaintenanceStats(
            new Date(startDate),
            new Date(endDate)
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.maintenanceService.findOne(id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateMaintenanceDto: UpdateMaintenanceDto
    ) {
        return this.maintenanceService.update(id, updateMaintenanceDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.maintenanceService.remove(id);
    }
} 