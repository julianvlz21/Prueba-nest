import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

/**
 * Protects integration endpoints for external partners. The valid keys come from the
 * API_KEYS environment variable (comma separated) and are sent in the x-api-key header.
 * Use together with @Public() so the global JWT guard lets the request through.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly validKeys: string[];

  constructor(config: ConfigService) {
    this.validKeys = (config.get<string>('API_KEYS') ?? '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
  }

  canActivate(context: ExecutionContext): boolean {
    const provided = context.switchToHttp().getRequest().headers['x-api-key'];
    if (typeof provided !== 'string' || !provided) {
      throw new UnauthorizedException('API Key no proporcionada');
    }
    // Constant-time comparison so response timing does not leak valid keys.
    const matches = this.validKeys.some((key) => {
      const a = Buffer.from(key);
      const b = Buffer.from(provided);
      return a.length === b.length && timingSafeEqual(a, b);
    });
    if (!matches) throw new UnauthorizedException('API Key incorrecta');
    return true;
  }
}
