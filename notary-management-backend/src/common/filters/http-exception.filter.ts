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
      error: process.env.NODE_ENV === 'development' ? error : undefined,
      data: null,
    };

    response.status(status).json(responseBody);
  }
}
