"use client";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiError, issuesApi, type ApiResult } from "@/lib/api";
import type { Issue, IssueChanges, IssueDraft, IssueStatus } from "@/lib/issues";
import { Board } from "./board";
import { IssueEditor } from "./issue-editor";
import { IssueList } from "./issue-list";
import { Overview, type PriorityFilter } from "./overview";
import { BoardSkeleton, EmptyState, ErrorState, NoResults } from "./states";
import { Topbar, type ApiStatus, type View } from "./topbar";
import { cn, MAIN_CLASS } from "./ui";

interface IssueTrackerProps {
  initialIssues: Issue[];
  initialError: string | null;
  initialProcessMs: number | null;
}

interface EditorState {
  open: boolean;
  issue: Issue | null;
  session: number;
}

interface Toast {
  id: number;
  message: string;
  tone: "info" | "error";
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Une erreur inattendue est survenue.";

const sameIssues = (a: Issue[], b: Issue[]) => JSON.stringify(a) === JSON.stringify(b);

export function IssueTracker({ initialIssues, initialError, initialProcessMs }: IssueTrackerProps) {
  const [issues, setIssues] = useState(initialIssues);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const [api, setApi] = useState<ApiStatus>({
    ok: initialError === null,
    ms: initialProcessMs,
    tick: 0,
  });

  const [query, setQuery] = useState("");
  // La valeur différée est une transition : le filtrage s'anime sans freiner la saisie.
  const deferredQuery = useDeferredValue(query);
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [view, setView] = useState<View>("board");

  const [editor, setEditor] = useState<EditorState>({ open: false, issue: null, session: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [intro, setIntro] = useState(true);

  const searchRef = useRef<HTMLInputElement>(null);
  const nextToastId = useRef(0);

  // ---------- Aides ----------

  const toast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = nextToastId.current++;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 3600);
  }, []);

  /** Attend une réponse de l'API et met à jour le voyant de la barre du haut. */
  const track = useCallback(async <T,>(request: Promise<ApiResult<T>>): Promise<T> => {
    try {
      const { data, processMs } = await request;
      setApi((current) => ({ ok: true, ms: processMs, tick: current.tick + 1 }));
      return data;
    } catch (failure) {
      const unreachable = failure instanceof ApiError && failure.status === null;
      setApi((current) => ({
        ok: !unreachable,
        ms: unreachable ? null : current.ms,
        tick: current.tick + 1,
      }));
      throw failure;
    }
  }, []);

  const openEditor = useCallback((issue: Issue | null = null) => {
    setEditor((current) => ({ open: true, issue, session: current.session + 1 }));
  }, []);

  const closeEditor = useCallback(() => {
    setEditor((current) => (current.open ? { ...current, open: false } : current));
  }, []);

  // ---------- Données ----------
  // Les changements de liste passent par startTransition : c'est ce qui déclenche
  // les animations <ViewTransition> des cartes.

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setIssues(await track(issuesApi.list()));
    } catch (failure) {
      setError(messageOf(failure));
    } finally {
      setLoading(false);
    }
  }

  async function createIssue(draft: IssueDraft) {
    try {
      const issue = await track(issuesApi.create(draft));
      startTransition(() => setIssues((current) => [...current, issue]));
      toast("Issue créée");
      return null;
    } catch (failure) {
      return messageOf(failure);
    }
  }

  /** Mise à jour optimiste : l'interface bouge tout de suite, on annule si l'API refuse. */
  function updateIssue(issue: Issue, changes: IssueChanges) {
    const replace = (next: Issue) =>
      setIssues((current) => current.map((item) => (item.id === issue.id ? next : item)));

    startTransition(() => replace({ ...issue, ...changes }));
    track(issuesApi.update(issue.id, changes)).then(replace, (failure) => {
      startTransition(() => replace(issue));
      toast(messageOf(failure), "error");
    });
  }

  function deleteIssue(issue: Issue) {
    const index = issues.findIndex((item) => item.id === issue.id);

    startTransition(() => setIssues((current) => current.filter((item) => item.id !== issue.id)));
    track(issuesApi.remove(issue.id)).then(
      () => toast("Issue supprimée"),
      (failure) => {
        startTransition(() =>
          setIssues((current) => {
            const next = [...current];
            next.splice(Math.min(Math.max(index, 0), next.length), 0, issue);
            return next;
          }),
        );
        toast(messageOf(failure), "error");
      },
    );
  }

  const moveIssue = (issue: Issue, status: IssueStatus) => updateIssue(issue, { status });

  // ---------- Effets ----------

  // L'entrée en cascade ne concerne que le premier affichage.
  useEffect(() => {
    const timer = setTimeout(() => setIntro(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Raccourcis : « / » pour chercher, « N » pour créer.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        openEditor();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openEditor]);

  // Resynchronise en revenant sur l'onglet (données modifiées ailleurs).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible" || document.querySelector("dialog[open]")) return;
      track(issuesApi.list()).then(
        (fresh) => {
          setError(null);
          startTransition(() =>
            setIssues((current) => (sameIssues(current, fresh) ? current : fresh)),
          );
        },
        () => {
          // Le voyant de la barre du haut signale déjà l'échec.
        },
      );
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [track]);

  // ---------- Rendu ----------

  const visible = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return issues.filter(
      (issue) =>
        (priority === "all" || issue.priority === priority) &&
        (!needle ||
          `${issue.title}\n${issue.description}\n${issue.id}`.toLowerCase().includes(needle)),
    );
  }, [issues, deferredQuery, priority]);

  let content;
  if (loading) {
    content = <BoardSkeleton />;
  } else if (error && issues.length === 0) {
    content = <ErrorState message={error} onRetry={reload} />;
  } else if (issues.length === 0) {
    content = <EmptyState onCreate={() => openEditor()} />;
  } else if (visible.length === 0) {
    content = (
      <NoResults
        onReset={() => {
          setQuery("");
          startTransition(() => setPriority("all"));
        }}
      />
    );
  } else if (view === "list") {
    content = <IssueList issues={visible} intro={intro} onOpen={openEditor} />;
  } else {
    content = <Board issues={visible} intro={intro} onOpen={openEditor} onMove={moveIssue} />;
  }

  return (
    <>
      <Topbar
        query={query}
        onQueryChange={setQuery}
        searchRef={searchRef}
        api={api}
        view={view}
        onViewChange={(next) => startTransition(() => setView(next))}
        onCreate={() => openEditor()}
      />

      <main className={MAIN_CLASS}>
        <Overview
          issues={issues}
          priority={priority}
          onPriorityChange={(next) => startTransition(() => setPriority(next))}
        />
        {content}
      </main>

      <IssueEditor
        open={editor.open}
        session={editor.session}
        issue={editor.issue}
        onClose={closeEditor}
        onCreate={createIssue}
        onUpdate={updateIssue}
        onDelete={deleteIssue}
      />

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "animate-toast-in rounded-xl px-4 py-2.5 text-sm font-medium shadow-lift",
              item.tone === "error" ? "bg-danger text-white" : "bg-fg text-canvas",
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </>
  );
}
