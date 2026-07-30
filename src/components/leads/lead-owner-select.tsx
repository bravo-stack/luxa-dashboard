'use client';

import { useActionState, useState } from 'react';
import { Building2, CheckCircle2, Loader2, UserRoundCheck } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { assignLead, type AssignmentState } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WORKSPACE_OWNER_VALUE } from '@/lib/dashboard/ownership';

type AssignableMember = {
  id: string;
  displayName: string;
  email: string;
};

const initialState: AssignmentState = { message: '' };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" className="w-full" disabled={disabled || pending}>
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <UserRoundCheck className="size-4" aria-hidden="true" />
      )}
      Save ownership
    </Button>
  );
}

export function LeadOwnerSelect({
  leadId,
  currentOwnerId,
  members,
}: {
  leadId: string;
  currentOwnerId?: string;
  members: AssignableMember[];
}) {
  const effectiveOwnerId =
    currentOwnerId && members.some((member) => member.id === currentOwnerId)
      ? currentOwnerId
      : WORKSPACE_OWNER_VALUE;
  const persistedOwnerId = currentOwnerId ?? WORKSPACE_OWNER_VALUE;
  const [ownerUserId, setOwnerUserId] = useState(effectiveOwnerId);
  const [state, formAction] = useActionState(assignLead, initialState);
  const hasAssignableMembers = members.length > 0;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="ownerUserId" value={ownerUserId} />
      <label
        htmlFor="lead-owner"
        className="text-xs font-semibold text-muted-foreground uppercase"
      >
        Lead owner
      </label>
      <Select value={ownerUserId} onValueChange={setOwnerUserId}>
        <SelectTrigger id="lead-owner" aria-describedby="lead-owner-help">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={WORKSPACE_OWNER_VALUE}>
            <span className="flex items-center gap-2">
              <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Workspace · Shared queue
            </span>
          </SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.displayName} · {member.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p id="lead-owner-help" className="text-xs leading-5 text-muted-foreground">
        {hasAssignableMembers
          ? 'Workspace keeps the lead in the shared admin queue until an active executive is assigned.'
          : 'No active sales executives are available. This lead remains in the shared workspace queue.'}
      </p>
      <SubmitButton disabled={ownerUserId === persistedOwnerId} />
      {state.message ? (
        <p
          className={
            state.success
              ? 'flex items-center gap-1.5 text-xs text-success'
              : 'text-xs text-destructive'
          }
          aria-live="polite"
        >
          {state.success ? (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          ) : null}
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
