import { describe, expect, it, jest } from '@jest/globals';
import { ArgumentsHost, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './http-exception.filter.js';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/maintenances' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return { status: status.mock.calls[0][0], body: json.mock.calls[0][0] as any };
}

const dbError = (code: string) => {
  const error = new QueryFailedError('INSERT', [], new Error('db'));
  (error as any).driverError = { code };
  return error;
};

describe('AllExceptionsFilter', () => {
  it('formats HttpExceptions with code, message, path and timestamp', () => {
    const { status, body } = run(new NotFoundException('Vehículo 9 no encontrado'));
    expect(status).toBe(404);
    expect(body).toMatchObject({ success: false, statusCode: 404, message: 'Vehículo 9 no encontrado', path: '/maintenances' });
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('keeps the validation message list', () => {
    const { body } = run(new ConflictException(['a', 'b']));
    expect(body.message).toEqual(['a', 'b']);
  });

  it('maps a unique violation (23505) to 409 instead of 500', () => {
    expect(run(dbError('23505')).status).toBe(409);
  });

  it('maps a foreign key violation (23503) to 409 and bad data (22P02) to 400', () => {
    expect(run(dbError('23503')).status).toBe(409);
    expect(run(dbError('22P02')).status).toBe(400);
  });

  it('maps numeric out of range (22003) and value too long (22001) to 400 instead of 500', () => {
    expect(run(dbError('22003')).status).toBe(400);
    expect(run(dbError('22001')).status).toBe(400);
  });

  it('hides unexpected errors behind a generic 500', () => {
    // The filter logs unexpected errors on purpose; keep the test output clean.
    const logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { status, body } = run(new Error('secret internals'));
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
    expect(status).toBe(500);
    expect(body.message).toBe('Error interno del servidor');
  });
});
