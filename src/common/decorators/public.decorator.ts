import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as accessible without a JWT (opts out of the global JwtAuthGuard). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
