import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Shared-admin-secret guard for the catalog write endpoint. Unlike the
 * Telegram webhook, which fails with 503 when unconfigured, this guard
 * rejects with 401 in every failure case so a misconfigured deployment
 * can never be mistaken for an open write API.
 */
@Injectable()
export class AdminPasswordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
      throw new UnauthorizedException(
        'Admin password is not configured on the server',
      );
    }
    if (!this.matchesPassword(expectedPassword, request.headers)) {
      throw new UnauthorizedException('Invalid admin password');
    }
    return true;
  }

  private matchesPassword(
    expected: string,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const received = headers['x-admin-password'];
    if (typeof received !== 'string') {
      return false;
    }
    const expectedHash = createHash('sha256').update(expected).digest();
    const receivedHash = createHash('sha256').update(received).digest();
    return timingSafeEqual(expectedHash, receivedHash);
  }
}
