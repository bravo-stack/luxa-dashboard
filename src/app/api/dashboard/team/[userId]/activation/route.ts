import { resendPendingActivationEmail } from '@/lib/auth/activation-email';
import { getAdminUser } from '@/lib/auth/admin';
import { getInvitationExceptionCode } from '@/lib/auth/invitations';
import { isSameOriginRequest } from '@/lib/auth/same-origin';

const errorStatuses = {
  configuration_unverified: 503,
  delivery_failed: 502,
  invalid_target: 400,
  not_pending: 409,
} as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  if (!isSameOriginRequest(request.url, request.headers.get('origin'))) {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  if (!(await getAdminUser())) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await context.params;

  try {
    const result = await resendPendingActivationEmail(userId);
    const status = result.success ? 200 : result.code ? errorStatuses[result.code] : 500;

    return Response.json(result, { status });
  } catch (error) {
    console.error(
      'Unexpected activation email API failure',
      getInvitationExceptionCode(error),
    );

    return Response.json(
      {
        message:
          'The activation request was interrupted. Refresh the page and try again.',
      },
      { status: 500 },
    );
  }
}
