import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const error = exception.getResponse();

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
            error: typeof error === 'string' ? { message: error } : error,
        });
    }
} 