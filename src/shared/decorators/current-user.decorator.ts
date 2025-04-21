import { createParamDecorator } from '@nestjs/common';

export const CurrentUser = createParamDecorator((_, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
