/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { IResponse } from 'src/shared/interfaces/response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    console.log(exception);

    // console.log('Request body:', request.body);
    // console.log('Request headers:', request.headers);

    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (Array.isArray((res as any).message)) {
        message = (res as any).message;
      } else if ((res as any).message) {
        message = (res as any).message;
      }
      error = res;
    } else if (exception instanceof Error) {
      // A raw Error serializes to `{}` via JSON.stringify because
      // name/message/stack are non-enumerable. Surface them explicitly so
      // 500s are diagnosable instead of opaque.
      message = isProduction
        ? 'Internal server error'
        : exception.message || 'Internal server error';
      error = {
        name: exception.name,
        message: exception.message,
        ...(isProduction ? {} : { stack: exception.stack }),
      };
    } else {
      error = exception;
    }

    // Log everything
    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(message)}`,
      error instanceof Error
        ? `${error.name}: ${error.message}\nStack: ${error.stack}`
        : JSON.stringify(error),
    );

    const responseBody: IResponse<null> = {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message.join(', ') : message,
      error: isProduction ? undefined : error,
      data: null,
    };

    response.status(status).json(responseBody);
  }
}
