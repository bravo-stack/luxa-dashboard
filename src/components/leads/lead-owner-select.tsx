'use client';

import { useActionState, useState } from 'react';
import { CheckCircle2, Loader2, UserRoundCheck } from 'lucide-react';
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

type AssignableMember = {
  id: string;
  displayName: string;
  email: string;
};

const initialState: AssignmentState = { message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" className="w-full" disabled={pending}>
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
  const [ownerUserId, setOwnerUserId] = useState(currentOwnerId ?? 'unassigned');
  const [state, formAction] = useActionState(assignLead, initialState);

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
        <SelectTrigger id="lead-owner">
          <SelectValue placeholder="Choose an owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned queue</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.displayName} · {member.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SubmitButton />
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
