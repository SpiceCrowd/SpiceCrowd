import jwt from 'jsonwebtoken';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }
  return 'dev_jwt_secret';
}

type AuthTokenPayload = {
  email?: string;
  isAdmin?: boolean;
  role?: string;
  sub?: string;
};

export function verifyToken(token?: string | null): AuthTokenPayload | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token.replace(/^Bearer\s+/i, ''), getJwtSecret());
    return typeof payload === 'string' ? null : (payload as AuthTokenPayload);
  } catch {
    return null;
  }
}

export function isAdmin(token?: string | null) {
  const payload = verifyToken(token);
  return payload?.role === 'admin' || payload?.isAdmin === true;
}

const auth = { verifyToken, isAdmin };

export default auth;
