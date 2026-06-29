import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, } from '@nestjs/common';
import { Response } from 'express';
import { AppResponse } from '../dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        exception?.message || 'Unhandled exception',
        exception?.stack,
      )
    }

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException 
      ? exception.getResponse() 
      : null;

    let errorCode = HttpStatus[status] || 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An unexpected error occurred';
    let details: any = null;

    if (exception instanceof HttpException) {
      errorMessage = exception.message;
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // If there's an explicit custom error property, use it; otherwise rely on HttpStatus mapping
        errorCode = (exceptionResponse as any).error || errorCode;
        const messageVal = (exceptionResponse as any).message;
        
        // Handle validation errors which are sent as an array of messages
        if (Array.isArray(messageVal)) {
          errorMessage = 'Validation failed';
          details = messageVal;
        } else {
          errorMessage = messageVal || errorMessage;
          details = (exceptionResponse as any).details || null;
        }
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      // In development environments, it might be useful to expose the stack trace in details
      if (process.env.NODE_ENV !== 'production') {
        details = exception.stack;
      }
    }

    // Force uppercase snake_case for the errorCode, replacing spaces
    const formattedErrorCode = errorCode
      .replace(/\s+/g, '_')
      .toUpperCase();

    response.status(status).json(
      AppResponse.error(formattedErrorCode, errorMessage, details),
    );
  }
}
