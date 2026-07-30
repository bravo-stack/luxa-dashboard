export type AuthEmailMode = 'invite' | 'recovery';

export type AuthEmailCallbackPayload =
  | {
      kind: 'session';
      mode: AuthEmailMode;
      accessToken: string;
      refreshToken: string;
    }
  | {
      kind: 'code';
      mode: AuthEmailMode;
      code: string;
    }
  | {
      kind: 'otp';
      mode: AuthEmailMode;
      tokenHash: string;
    }
  | {
      kind: 'error';
    };

function getAuthEmailMode(value: string | null): AuthEmailMode | null {
  return value === 'invite' || value === 'recovery' ? value : null;
}

export function parseAuthEmailCallback({
  hash,
  search,
}: {
  hash: string;
  search: string;
}): AuthEmailCallbackPayload {
  const hashParameters = new URLSearchParams(hash.replace(/^#/, ''));
  const searchParameters = new URLSearchParams(search);
  const hashMode = getAuthEmailMode(hashParameters.get('type'));
  const queryMode =
    getAuthEmailMode(searchParameters.get('mode')) ??
    getAuthEmailMode(searchParameters.get('type'));

  if (hashMode && queryMode && hashMode !== queryMode) {
    return { kind: 'error' };
  }

  const mode = hashMode ?? queryMode;

  if (
    !mode ||
    hashParameters.has('error') ||
    searchParameters.has('error') ||
    searchParameters.has('error_code')
  ) {
    return { kind: 'error' };
  }

  const accessToken = hashParameters.get('access_token');
  const refreshToken = hashParameters.get('refresh_token');

  if (accessToken || refreshToken) {
    return accessToken && refreshToken
      ? { kind: 'session', mode, accessToken, refreshToken }
      : { kind: 'error' };
  }

  const code = searchParameters.get('code');
  if (code) return { kind: 'code', mode, code };

  const tokenHash = searchParameters.get('token_hash');
  if (tokenHash) return { kind: 'otp', mode, tokenHash };

  return { kind: 'error' };
}
