import 'server-only';

import { getWorkspaceUser } from './workspace';

export const ADMIN_ROLE = 'admin';

export async function getAdminUser() {
  const user = await getWorkspaceUser();
  return user?.role === ADMIN_ROLE ? user : null;
}
