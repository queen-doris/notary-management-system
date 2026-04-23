/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { IResponse } from 'src/shared/interfaces/response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  IResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    // console.log(context.switchToHttp().getRequest());
    return next.handle().pipe(
      map((data) => ({
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        path: context.switchToHttp().getRequest().url,
        data,
      })),
    );
  }
}
