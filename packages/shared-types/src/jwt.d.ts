import type { UserRole } from './user';
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=jwt.d.ts.map