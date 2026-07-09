import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE_NAME = 'luxa_session';
export const TEMP_USERNAME = 'user12221';
export const TEMP_PASSWORD = 'password';

const SESSION_SECRET =
  process.env.LUXA_SESSION_SECRET ?? 'luxa-temporary-local-session-secret';

function sign(value: string) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

export function createSessionToken(username: string) {
  return `${username}.${sign(username)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [username, signature, extra] = token.split('.');

  if (!username || !signature || extra || username !== TEMP_USERNAME) {
    return false;
  }

  const expected = Buffer.from(sign(username));
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
