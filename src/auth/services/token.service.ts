import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { TokenPayload } from '../interfaces/token.interface';

@Injectable()
export class TokenService {
    private blacklistedTokens: Set<string> = new Set();

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) { }

    async generateTokens(user: UserDocument) {
        const [access_token, refresh_token] = await Promise.all([
            this.generateAccessToken(user),
            this.generateRefreshToken(user)
        ]);

        return {
            access_token,
            refresh_token
        };
    }

    async validateRefreshToken(refreshToken: string) {
        try {
            // Vérifiez le refresh token sans tenir compte des dispositifs
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET')
            });

            // Trouver l'utilisateur par son ID
            const user = await this.userModel.findById(payload.sub);
            if (!user) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Si vous souhaitez retourner l'utilisateur et le payload, vous pouvez le faire ici
            return { user, payload };
        } catch (error) {
            console.error('Refresh token validation error:', error);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private async generateAccessToken(user: UserDocument): Promise<string> {
        const payload: TokenPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role
        };

        const configValue = this.configService.get<string>('ACCESS_TOKEN_EXPIRATION');
        console.log('ACCESS_TOKEN_EXPIRATION from config:', configValue);
        
        const expiresIn = `${configValue}m`;
        console.log('Final expiresIn value:', expiresIn);

        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: expiresIn
        });
    }

    private async generateRefreshToken(user: UserDocument): Promise<string> {
        const payload: TokenPayload = {
            sub: user._id.toString(),
            email: user.email
        };

        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: `${this.configService.get<number>('REFRESH_TOKEN_EXPIRATION')}m`
        });
    }

    async blacklistToken(token: string) {
        this.blacklistedTokens.add(token);
        setTimeout(() => {
            this.blacklistedTokens.delete(token);
        }, 15 * 60 * 1000);
    }

    isTokenBlacklisted(token: string): boolean {
        return this.blacklistedTokens.has(token);
    }
}