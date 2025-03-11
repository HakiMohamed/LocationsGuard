import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CreateAutomobileDto } from '../../automobile/dto/create-automobile.dto';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    console.log('Données envoyées par le front-end:');
    console.log('Body:', request.body);
    console.log('CreateAutomobileDto:', request.body as CreateAutomobileDto);
    console.log('Files:', request.files);

    return next.handle();
  }
}