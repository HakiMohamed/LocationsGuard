import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: Error | null) {
        // Token expiré
        if (info instanceof TokenExpiredError) {
            throw new UnauthorizedException({
                message: 'Token expired',
                error: 'TokenExpired',
                statusCode: 401
            });
        }

        // Token invalide
        if (info instanceof JsonWebTokenError) {
            throw new UnauthorizedException({
                message: 'Invalid token',
                error: 'InvalidToken',
                statusCode: 401
            });
        }

        // Pas de token ou autres erreurs
        if (err || !user) {
            throw new UnauthorizedException({
                message: 'Authentication required',
                error: 'NoToken',
                statusCode: 401
            });
        }

        return user;
    }
} 