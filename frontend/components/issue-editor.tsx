"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, SubmitEvent } from "react";
import {
  LIMITS,
  shortId,
  STATUSES,
  type Issue,
  type IssueChanges,
  type IssueDraft,
  type IssuePriority,
  type IssueStatus,
} from "@/lib/issues";
import { Button, CloseIcon, PriorityGlyph, StatusDot } from "./ui";

interface IssueEditorProps {
  open: boolean;
  /** Change à chaque ouverture pour repartir d'un formulaire neuf. */
  session: number;
  /** L'issue à modifier, ou null pour en créer une. */
  issue: Issue | null;
  onClose: () => void;
  /** Résout avec un message d'erreur si la création a échoué, sinon null. */
  onCreate: (draft: IssueDraft) => Promise<string | null>;
  onUpdate: (issue: Issue, changes: IssueChanges) => void;
  onDelete: (issue: Issue) => void;
}

export function IssueEditor({ open, session, ...formProps }: IssueEditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, session]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="editor-title"
      onClose={formProps.onClose}
      onMouseDown={(event) => {
        // Un clic sur le fond (hors du formulaire) ferme la fenêtre.
        if (event.target === event.currentTarget) formProps.onClose();
      }}
      className="dialog-pop m-auto max-h-[calc(100dvh-24px)] w-[min(560px,calc(100vw-24px))] rounded-[20px] border border-line bg-surface text-fg shadow-[0_30px_80px_rgb(0_0_0/0.5)]"
    >
      <EditorForm key={session} {...formProps} />
    </dialog>
  );
}

type FieldName = "title" | "description";
type FieldErrors = Partial<Record<FieldName, string>>;

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; icon: ReactNode }[] = [
  { value: "low", label: "Basse", icon: <PriorityGlyph priority="low" /> },
  { value: "medium", label: "Moyenne", icon: <PriorityGlyph priority="medium" /> },
  { value: "high", label: "Haute", icon: <PriorityGlyph priority="high" /> },
];

const STATUS_OPTIONS = STATUSES.map((status) => ({
  value: status.key,
  label: status.label,
  icon: <StatusDot slug={status.slug} />,
}));

const INPUT_CLASS =
  "w-full rounded-[11px] border border-line bg-canvas px-3 py-2.5 outline-none transition duration-150 placeholder:text-muted/70 focus:border-accent focus:ring-3 focus:ring-accent/15 aria-invalid:border-danger";

function EditorForm({
  issue,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: Omit<IssueEditorProps, "open" | "session">) {
  const [title, setTitle] = useState(issue?.title ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");
  const [priority, setPriority] = useState<IssuePriority>(issue?.priority ?? "medium");
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "open");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Suppression en deux temps : le bouton se désarme seul après quelques secondes.
  useEffect(() => {
    if (!deleteArmed) return;
    const timer = setTimeout(() => setDeleteArmed(false), 3500);
    return () => clearTimeout(timer);
  }, [deleteArmed]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { title: title.trim(), description: description.trim(), priority };

    const nextErrors: FieldErrors = {};
    for (const field of ["title", "description"] as const) {
      if (values[field].length < LIMITS[field].min) {
        nextErrors[field] = `${LIMITS[field].min} caractères minimum.`;
      }
    }
    setErrors(nextErrors);
    if (nextErrors.title) return titleRef.current?.focus();
    if (nextErrors.description) return descriptionRef.current?.focus();

    if (issue) {
      const next = { ...values, status };
      const changes: IssueChanges = Object.fromEntries(
        Object.entries(next).filter(([key, value]) => issue[key as keyof Issue] !== value),
      );
      onClose();
      if (Object.keys(changes).length > 0) onUpdate(issue, changes);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const failure = await onCreate(values);
    if (failure) {
      setFormError(failure);
      setSubmitting(false);
    } else {
      onClose();
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.currentTarget.requestSubmit();
        }
      }}
      className="flex flex-col gap-4 p-5"
    >
      <header className="flex items-center gap-2.5">
        <h2 id="editor-title" className="text-lg font-semibold tracking-tight">
          {issue ? "Modifier l'issue" : "Nouvelle issue"}
        </h2>
        {issue && <span className="font-mono text-xs text-muted">{shortId(issue.id)}</span>}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="ml-auto grid size-8 place-items-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
        >
          <CloseIcon />
        </button>
      </header>

      <Field
        label="Titre"
        htmlFor="issue-title"
        error={errors.title}
        count={title.length}
        max={LIMITS.title.max}
      >
        <input
          ref={titleRef}
          id="issue-title"
          data-autofocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={LIMITS.title.max}
          aria-invalid={errors.title ? true : undefined}
          autoComplete="off"
          placeholder="Ex. Le bouton de connexion ne répond plus"
          className={INPUT_CLASS}
        />
      </Field>

      <Field
        label="Description"
        htmlFor="issue-description"
        error={errors.description}
        count={description.length}
        max={LIMITS.description.max}
      >
        <textarea
          ref={descriptionRef}
          id="issue-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={LIMITS.description.max}
          aria-invalid={errors.description ? true : undefined}
          rows={5}
          placeholder="Que se passe-t-il ? Comment le reproduire ?"
          className={`${INPUT_CLASS} min-h-24 resize-y`}
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <Segmented
          legend="Priorité"
          name="priority"
          value={priority}
          onChange={setPriority}
          options={PRIORITY_OPTIONS}
        />
        {issue && (
          <Segmented
            legend="Statut"
            name="status"
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
          />
        )}
      </div>

      {formError && (
        <p role="alert" className="rounded-[11px] bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}

      <footer className="mt-1 flex items-center gap-2.5">
        {issue && (
          <Button
            variant="danger"
            onClick={() => {
              if (!deleteArmed) return setDeleteArmed(true);
              onClose();
              onDelete(issue);
            }}
            className={deleteArmed ? "bg-danger/10" : undefined}
          >
            {deleteArmed ? "Confirmer la suppression" : "Supprimer"}
          </Button>
        )}
        <span className="flex-1" />
        <Button onClick={onClose}>Annuler</Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {issue ? "Enregistrer" : submitting ? "Création…" : "Créer"}
        </Button>
      </footer>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  count,
  max,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  count: number;
  max: number;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-muted">
        {label}
      </label>
      {children}
      <div className="flex min-h-4.5 justify-between gap-3 text-xs">
        <span role={error ? "alert" : undefined} className="text-danger">
          {error}
        </span>
        <span className="text-muted tabular-nums">
          {count}/{max}
        </span>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon: ReactNode }[];
}) {
  return (
    <fieldset className="min-w-55 flex-1">
      <legend className="mb-1.5 text-[13px] font-semibold text-muted">{legend}</legend>
      <div className="flex gap-0.5 rounded-[11px] border border-line bg-canvas p-0.75">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-medium whitespace-nowrap text-muted transition-colors duration-150 hover:text-fg has-checked:bg-surface-2 has-checked:text-fg has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-accent"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
