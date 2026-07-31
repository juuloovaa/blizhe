import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types/models';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);

export const StartParam = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.telegram?.startParam as string | undefined;
  },
);
