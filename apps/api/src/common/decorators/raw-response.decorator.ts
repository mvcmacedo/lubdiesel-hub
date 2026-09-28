import { SetMetadata } from '@nestjs/common';

export const IS_RAW_RESPONSE = 'isRawResponse';

/** Opts a route out of the global `{ data }` response envelope (e.g. health/monitoring endpoints). */
export const RawResponse = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_RAW_RESPONSE, true);
