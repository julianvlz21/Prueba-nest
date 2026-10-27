import { describe, expect, it } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard.js';

const guardWith = (keys: string) => new ApiKeyGuard({ get: () => keys } as any);
const contextWith = (headers: Record<string, string>): any => ({
  switchToHttp: () => ({ getRequest: () => ({ headers }) }),
});

describe('ApiKeyGuard', () => {
  const guard = guardWith('demo-key-partner-1, demo-key-partner-2');

  it('accepts any key configured in API_KEYS', () => {
    expect(guard.canActivate(contextWith({ 'x-api-key': 'demo-key-partner-1' }))).toBe(true);
    expect(guard.canActivate(contextWith({ 'x-api-key': 'demo-key-partner-2' }))).toBe(true);
  });

  it('rejects a missing header', () => {
    expect(() => guard.canActivate(contextWith({}))).toThrow(UnauthorizedException);
  });

  it('rejects an incorrect key', () => {
    expect(() => guard.canActivate(contextWith({ 'x-api-key': 'nope' }))).toThrow('API Key incorrecta');
  });

  it('rejects everything when API_KEYS is not configured', () => {
    expect(() => guardWith('').canActivate(contextWith({ 'x-api-key': '' }))).toThrow(UnauthorizedException);
  });
});
