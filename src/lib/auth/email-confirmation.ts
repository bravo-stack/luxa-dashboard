export type EmailConfirmationType = 'invite' | 'recovery';

const supportedTypes = new Set<EmailConfirmationType>(['invite', 'recovery']);
const maximumTokenHashLength = 2_048;

export function parseEmailConfirmation(
  tokenHash: unknown,
  type: unknown,
): { tokenHash: string; type: EmailConfirmationType } | null {
  if (
    typeof tokenHash !== 'string' ||
    tokenHash.length === 0 ||
    tokenHash.length > maximumTokenHashLength ||
    tokenHash.trim() !== tokenHash ||
    typeof type !== 'string' ||
    !supportedTypes.has(type as EmailConfirmationType)
  ) {
    return null;
  }

  return { tokenHash, type: type as EmailConfirmationType };
}
