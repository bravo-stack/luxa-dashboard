export const WORKSPACE_OWNER_VALUE = 'workspace';

const workspaceValues = new Set(['', 'unassigned', WORKSPACE_OWNER_VALUE]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type NormalizedLeadOwner =
  { valid: true; ownerUserId: string | null } | { valid: false; ownerUserId: null };

export function normalizeLeadOwner(value: unknown): NormalizedLeadOwner {
  const normalized = String(value ?? '').trim();

  if (workspaceValues.has(normalized)) {
    return { valid: true, ownerUserId: null };
  }

  if (!uuidPattern.test(normalized)) {
    return { valid: false, ownerUserId: null };
  }

  return { valid: true, ownerUserId: normalized };
}
