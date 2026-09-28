import type { UserRole } from '@prisma/client';

/** Shape of the user attached to the request after JWT authentication. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
