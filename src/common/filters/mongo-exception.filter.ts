import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';
import { Response } from 'express';

@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
    catch(exception: MongoServerError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'UNKNOWN_ERROR';
        let field = null;

        // Gérer les erreurs de duplication (E11000)
        if (exception.code === 11000) {
            status = HttpStatus.CONFLICT;
            const duplicatedField = Object.keys(exception.keyPattern)[0];
            field = duplicatedField;

            switch (duplicatedField) {
                case 'phoneNumber':
                    message = 'This phone number is already registered';
                    error = 'PHONE_NUMBER_EXISTS';
                    break;
                case 'email':
                    message = 'This email is already registered';
                    error = 'EMAIL_EXISTS';
                    break;
                default:
                    message = `This ${duplicatedField} is already in use`;
                    error = 'DUPLICATE_FIELD';
            }
        }

        response.status(status).json({
            statusCode: status,
            message,
            error,
            field,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
        });
    }
} 