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

function isEnvelope(value: unknown): value is IResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'status' in value &&
    'timestamp' in value &&
    'path' in value
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  IResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    const url = context.switchToHttp().getRequest().url;
    return next.handle().pipe(
      map((data) => {
        // Methods that already return a full IResponse envelope are passed
        // through (so the payload stays at `data`, not `data.data`); only
        // backfill an empty `path`. Everything else gets wrapped once.
        if (isEnvelope(data)) {
          return {
            ...data,
            path: data.path || url,
          } as IResponse<T>;
        }
        return {
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
          path: url,
          data,
        };
      }),
    );
  }
}
