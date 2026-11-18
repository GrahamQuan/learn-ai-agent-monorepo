import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/api-response.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return request.user;
  },
);
