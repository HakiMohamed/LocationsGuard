import { 
    Controller, 
    Get, 
    Put, 
    Delete, 
    Body, 
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('profile')
    @HttpCode(HttpStatus.OK)
    getProfile(@CurrentUser('sub') userId: string) {
        return this.usersService.getProfile(userId);
    }

    @Put('profile')
    @HttpCode(HttpStatus.OK)
    updateProfile(
        @CurrentUser('sub') userId: string,
        @Body() updateProfileDto: UpdateProfileDto
    ) {
        return this.usersService.updateProfile(userId, updateProfileDto);
    }

    @Delete('profile')
    @HttpCode(HttpStatus.OK)
    deleteProfile(@CurrentUser('sub') userId: string) {
        return this.usersService.deleteProfile(userId);
    }
} 