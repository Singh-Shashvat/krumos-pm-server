import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // If response headers have already been sent (e.g., res.redirect or res.send was called manually), bypass.
        if (response && response.headersSent) {
          return data;
        }

        // If data is already an instance of AppResponse, return it as-is.
        if (data instanceof AppResponse) {
          return data;
        }

        // If the return object contains paginated structure: { items: T[], meta: PaginationMetaDto }
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          return AppResponse.success(data.items, data.meta);
        }

        // Otherwise, wrap standard return value into success data.
        // If data is undefined or null, default it to an empty object to satisfy the DTO constraint.
        const responseData = data !== undefined && data !== null ? data : {};
        return AppResponse.success(responseData);
      }),
    );
  }
}
