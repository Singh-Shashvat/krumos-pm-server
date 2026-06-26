import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ required: false })
  details?: any;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Total items' })
  total: number;

  @ApiProperty({ example: 10, description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ example: false, description: 'Has next page' })
  hasNextPage: boolean;

  @ApiProperty({ example: false, description: 'Has previous page' })
  hasPrevPage: boolean;
}

export class AppResponse<T> {
  @ApiProperty({ description: 'Response data', required: false })
  data: T | null = null;

  @ApiProperty({ type: () => PaginationMetaDto, required: false })
  meta: PaginationMetaDto | null = null;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: () => ErrorResponseDto, required: false })
  error: ErrorResponseDto | null = null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  private constructor(
    data: T | null,
    success: boolean,
    meta: PaginationMetaDto | null,
    error: ErrorResponseDto | null,
  ) {
    if (success && !data) {
      throw new Error('Success response must have data');
    }
    if (!success && !error) {
      throw new Error('Error response must have error details');
    }
    if (data && error) {
      throw new Error('Response cannot have both data and error');
    }

    this.success = success;
    this.meta = meta;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, meta?: PaginationMetaDto): AppResponse<T> {
    return new AppResponse(data, true, meta || null, null);
  }

  static error(code: string, message: string, details?: any): AppResponse<null> {
    return new AppResponse(null, false, null, {
      code,
      message,
      ...(details && { details }),
    });
  }
}
