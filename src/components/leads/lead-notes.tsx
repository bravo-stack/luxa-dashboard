import { MessageSquareText } from 'lucide-react';

import { addLeadNote } from '@/app/dashboard/actions';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { LeadNote } from '@/lib/dashboard/types';
import { formatDateTime } from '@/lib/dashboard/utils';

type LeadNotesProps = {
  leadId: string;
  notes: LeadNote[];
};

export function LeadNotes({ leadId, notes }: LeadNotesProps) {
  async function handleAddLeadNote(formData: FormData) {
    'use server';

    await addLeadNote(formData);
  }

  return (
    <section className="surface-elevated rounded-lg p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold text-accent-warm uppercase">Internal notes</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Private follow-up context
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Notes stay internal and should never be sent to analytics.
        </p>
      </div>
      <form action={handleAddLeadNote} className="mt-5 space-y-3">
        <input type="hidden" name="leadId" value={leadId} />
        <Textarea name="body" placeholder="Add internal note for this lead" required />
        <Button type="submit">Add note</Button>
      </form>
      <div className="mt-6 space-y-3">
        {notes.length ? (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-lg border border-border bg-muted/45 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {note.created_by}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(note.created_at)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{note.body}</p>
            </article>
          ))
        ) : (
          <EmptyState
            icon={MessageSquareText}
            title="No internal notes"
            description="Add the first note once a call, reply, or qualification decision needs to be captured."
          />
        )}
      </div>
    </section>
  );
}
