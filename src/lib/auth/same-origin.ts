export function isSameOriginRequest(requestUrl: string, originHeader: string | null) {
  if (!originHeader) return false;

  try {
    return new URL(requestUrl).origin === new URL(originHeader).origin;
  } catch {
    return false;
  }
}
