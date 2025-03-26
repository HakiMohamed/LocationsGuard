import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Put, 
    Delete,
    UseGuards,
    Query
} from '@nestjs/common';
import { ClientService } from '../services/client.service';
import { CreateClientDto, UpdateClientDto } from '../dto/create-client.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/role.enum';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ClientController {
    constructor(private readonly clientService: ClientService) {}

    @Post()
    async create(@Body() createClientDto: CreateClientDto) {
        return this.clientService.create(createClientDto);
    }

    @Get()
    async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.clientService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.clientService.findOne(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
        return this.clientService.update(id, updateClientDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.clientService.remove(id);
    }

    @Get('search/filter')
    async searchClients(
        @Query('search') search: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.clientService.search(search);
    }

    @Get(':id/rentals')
    async getClientRentals(@Param('id') id: string) {
        return this.clientService.getClientRentals(id);
    }

    @Get(':id/statistics')
    async getClientStatistics(@Param('id') id: string) {
        return this.clientService.getClientStatistics(id);
    }
}