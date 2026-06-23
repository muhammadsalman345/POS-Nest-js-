import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const isHttpException = exception instanceof HttpException;
    const isKnownPrismaError = exception instanceof Prisma.PrismaClientKnownRequestError;
    const status = isHttpException
      ? exception.getStatus()
      : isKnownPrismaError
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException ? exception.getResponse() : null;
    const message = this.message(body, exception);

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
      error: body ?? (process.env.NODE_ENV === 'production' ? 'Internal server error' : this.devError(exception)),
    });
  }

  private message(body: string | object | null, exception: unknown) {
    if (typeof body === 'string') return body;
    if (body && 'message' in body) {
      const value = (body as { message?: string | string[] }).message;
      return Array.isArray(value) ? value.join(', ') : value || 'Request failed';
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') return 'Duplicate value already exists';
      if (exception.code === 'P2003') return 'Related record was not found';
      return 'Database request failed';
    }
    return 'Internal server error';
  }

  private devError(exception: unknown) {
    if (exception instanceof Error) {
      return { name: exception.name, message: exception.message };
    }
    return String(exception);
  }
}
