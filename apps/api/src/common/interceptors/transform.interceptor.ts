import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IS_RAW_RESPONSE } from '../decorators/raw-response.decorator';

/** Wraps successful responses in a `{ data }` envelope, leaving paginated `{ data, meta }` intact. */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(IS_RAW_RESPONSE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isRaw) {
      return next.handle();
    }

    return next.handle().pipe(
      map((value) => {
        if (value !== null && typeof value === 'object' && 'data' in value && 'meta' in value) {
          return value;
        }
        return { data: value ?? null };
      }),
    );
  }
}
