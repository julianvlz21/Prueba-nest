import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/**
 * Single place where every error becomes { success:false, statusCode, message, path, timestamp }.
 * Database constraint violations are mapped to 4xx so they never surface as HTTP 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === 'string' ? body : ((body as any).message ?? exception.message);
    } else if (exception instanceof QueryFailedError) {
      const code = (exception as any).driverError?.code;
      if (code === '23505') {
        statusCode = HttpStatus.CONFLICT;
        message = 'Ya existe un registro con esos datos únicos';
      } else if (code === '23503') {
        statusCode = HttpStatus.CONFLICT;
        message = 'La operación viola una relación con otros registros';
      } else if (['23502', '22P02', '22003', '22001'].includes(code)) {
        // not null / invalid text / numeric out of range / value too long
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Datos inválidos';
      }
    }

    if (statusCode >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
