import { describe, expect, it } from '@jest/globals';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor.js';

describe('ResponseInterceptor', () => {
  it('wraps the payload in { success, statusCode, data, timestamp }', async () => {
    const context = { switchToHttp: () => ({ getResponse: () => ({ statusCode: 201 }) }) } as ExecutionContext;
    const next: CallHandler = { handle: () => of({ id: 1 }) };

    const result: any = await lastValueFrom(new ResponseInterceptor().intercept(context, next) as any);

    expect(result).toMatchObject({ success: true, statusCode: 201, data: { id: 1 } });
    expect(typeof result.timestamp).toBe('string');
  });
});
