import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { TokenPayload } from '../interfaces/token.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor(
        private configService: ConfigService,
        @InjectModel(User.name) private userModel: Model<User>
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: TokenPayload) {
        const refreshToken = req.get('Authorization').replace('Bearer', '').trim();
        const user = await this.userModel.findOne({
            _id: payload.sub,
            'devices.refreshToken': refreshToken
        });

        if (!user) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        return {
            sub: user._id,
            email: user.email,
            refreshToken
        };
    }
} 