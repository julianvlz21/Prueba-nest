import { describe, expect, it } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function build(opts: { isPublic?: boolean; verify?: () => Promise<unknown> } = {}) {
  const request: any = { headers: {} };
  const context: any = {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => request }),
  };
  const guard = new JwtAuthGuard(
    { verifyAsync: opts.verify ?? (async () => ({ sub: 1, role: 'ADMIN' })) } as any,
    { getAllAndOverride: () => opts.isPublic ?? false } as any,
  );
  return { guard, context, request };
}

describe('JwtAuthGuard', () => {
  it('lets @Public() routes through without a token', async () => {
    const { guard, context } = build({ isPublic: true });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects a request without token', async () => {
    const { guard, context } = build();
    await expect(guard.canActivate(context)).rejects.toThrow('Token no proporcionado');
  });

  it('rejects a non-Bearer authorization header', async () => {
    const { guard, context, request } = build();
    request.headers.authorization = 'Basic abc';
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid or expired token', async () => {
    const { guard, context, request } = build({ verify: async () => { throw new Error('jwt expired'); } });
    request.headers.authorization = 'Bearer bad';
    await expect(guard.canActivate(context)).rejects.toThrow('Token inválido o expirado');
  });

  it('accepts a valid token and exposes the payload as request.user', async () => {
    const { guard, context, request } = build();
    request.headers.authorization = 'Bearer good';
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ sub: 1, role: 'ADMIN' });
  });
});
