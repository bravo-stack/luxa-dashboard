'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, MessageSquareText, Pencil, Trash2, X } from 'lucide-react';

import { addLeadNote, deleteLeadNote, updateLeadNote } from '@/app/dashboard/actions';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { LeadNote } from '@/lib/dashboard/types';
import { formatDateTime } from '@/lib/dashboard/utils';

type LeadNotesProps = {
  leadId: string;
  notes: LeadNote[];
};

type PendingAction =
  | { type: 'add' }
  | { type: 'edit'; noteId: string }
  | { type: 'delete'; noteId: string }
  | null;

export function LeadNotes({ leadId, notes }: LeadNotesProps) {
  const router = useRouter();
  const [newBody, setNewBody] = React.useState('');
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editBody, setEditBody] = React.useState('');
  const [deletingNoteId, setDeletingNoteId] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null);
  const [feedback, setFeedback] = React.useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function runMutation(
    action: () => Promise<{ ok: boolean; message: string }>,
    pending: Exclude<PendingAction, null>,
    onSuccess: () => void,
  ) {
    setFeedback(null);
    setPendingAction(pending);
    startTransition(async () => {
      try {
        const result = await action();

        if (!result.ok) throw new Error(result.message);

        onSuccess();
        setFeedback({ tone: 'success', message: result.message });
        router.refresh();
      } catch (error: unknown) {
        setFeedback({
          tone: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'The note could not be saved. Try again.',
        });
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleAddNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = newBody.trim();

    if (!body) return;

    const formData = new FormData();
    formData.set('leadId', leadId);
    formData.set('body', body);
    runMutation(
      () => addLeadNote(formData),
      { type: 'add' },
      () => setNewBody(''),
    );
  }

  function startEditing(note: LeadNote) {
    setDeletingNoteId(null);
    setEditingNoteId(note.id);
    setEditBody(note.body);
    setFeedback(null);
  }

  function handleUpdateNote(event: React.FormEvent<HTMLFormElement>, noteId: string) {
    event.preventDefault();
    const body = editBody.trim();

    if (!body) return;

    const formData = new FormData();
    formData.set('leadId', leadId);
    formData.set('noteId', noteId);
    formData.set('body', body);
    runMutation(
      () => updateLeadNote(formData),
      { type: 'edit', noteId },
      () => {
        setEditingNoteId(null);
        setEditBody('');
      },
    );
  }

  function handleDeleteNote(noteId: string) {
    const formData = new FormData();
    formData.set('leadId', leadId);
    formData.set('noteId', noteId);
    runMutation(
      () => deleteLeadNote(formData),
      { type: 'delete', noteId },
      () => setDeletingNoteId(null),
    );
  }

  const isAdding = pendingAction?.type === 'add';

  return (
    <section className="surface-elevated rounded-lg p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold text-warning uppercase">Internal notes</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Private follow-up context
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Notes stay internal and should never be sent to analytics.
        </p>
      </div>

      <form onSubmit={handleAddNote} className="mt-5 space-y-3">
        <label htmlFor="new-lead-note" className="sr-only">
          Add an internal note
        </label>
        <Textarea
          id="new-lead-note"
          name="body"
          value={newBody}
          maxLength={5000}
          disabled={isPending}
          placeholder="Add internal note for this lead"
          onChange={(event) => setNewBody(event.target.value)}
          required
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {newBody.length.toLocaleString()} / 5,000
          </span>
          <Button type="submit" disabled={isPending || !newBody.trim()}>
            {isAdding ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <MessageSquareText aria-hidden="true" />
            )}
            {isAdding ? 'Adding note' : 'Add note'}
          </Button>
        </div>
      </form>

      {feedback ? (
        <p
          role="status"
          className={`mt-4 text-sm font-medium ${
            feedback.tone === 'error' ? 'text-destructive' : 'text-success'
          }`}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {notes.length ? (
          notes.map((note) => {
            const isEditing = editingNoteId === note.id;
            const isDeleting = deletingNoteId === note.id;
            const isUpdatingThisNote =
              pendingAction?.type === 'edit' && pendingAction.noteId === note.id;
            const isDeletingThisNote =
              pendingAction?.type === 'delete' && pendingAction.noteId === note.id;
            const wasEdited = note.updated_at !== note.created_at;

            return (
              <article key={note.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {note.created_by}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(note.created_at)}
                      {wasEdited ? ' · Edited' : ''}
                    </p>
                  </div>
                  {!isEditing && !isDeleting ? (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        aria-label={`Edit note from ${formatDateTime(note.created_at)}`}
                        onClick={() => startEditing(note)}
                      >
                        <Pencil aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                        aria-label={`Delete note from ${formatDateTime(note.created_at)}`}
                        onClick={() => {
                          setEditingNoteId(null);
                          setDeletingNoteId(note.id);
                          setFeedback(null);
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>

                {isEditing ? (
                  <form
                    className="mt-4 space-y-3"
                    onSubmit={(event) => handleUpdateNote(event, note.id)}
                  >
                    <label htmlFor={`edit-note-${note.id}`} className="sr-only">
                      Edit internal note
                    </label>
                    <Textarea
                      id={`edit-note-${note.id}`}
                      value={editBody}
                      maxLength={5000}
                      disabled={isPending}
                      onChange={(event) => setEditBody(event.target.value)}
                      required
                      autoFocus
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-muted-foreground">
                        {editBody.length.toLocaleString()} / 5,000
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditBody('');
                          }}
                        >
                          <X aria-hidden="true" />
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isPending || !editBody.trim()}
                        >
                          {isUpdatingThisNote ? (
                            <Loader2 className="animate-spin" aria-hidden="true" />
                          ) : (
                            <Check aria-hidden="true" />
                          )}
                          {isUpdatingThisNote ? 'Saving' : 'Save changes'}
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : isDeleting ? (
                  <div className="mt-4 rounded-md bg-destructive/8 p-3">
                    <p className="text-sm font-semibold text-foreground">
                      Delete this note permanently?
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setDeletingNoteId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        {isDeletingThisNote ? (
                          <Loader2 className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 aria-hidden="true" />
                        )}
                        {isDeletingThisNote ? 'Deleting' : 'Delete permanently'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap text-muted-foreground">
                    {note.body}
                  </p>
                )}
              </article>
            );
          })
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
