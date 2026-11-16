"use client";

import { startTransition, useRef, useState, ViewTransition } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  byPriority,
  PRIORITIES,
  shortId,
  statusOf,
  STATUSES,
  type Issue,
  type IssueStatus,
} from "@/lib/issues";
import { cn, PriorityBadge, StatusDot } from "./ui";

interface BoardProps {
  issues: Issue[];
  /** Vrai pendant l'entrée en cascade du premier affichage. */
  intro: boolean;
  onOpen: (issue: Issue) => void;
  onMove: (issue: Issue, status: IssueStatus) => void;
}

interface DragState {
  id: string;
  from: IssueStatus;
  over: IssueStatus | null;
}

const DRAG_THRESHOLD = 6;

export function Board({ issues, intro, onOpen, onMove }: BoardProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  // Un glisser se termine par un « click » : on l'ignore pour ne pas ouvrir l'éditeur.
  const suppressClick = useRef(false);

  // Glisser-déposer à la souris ou au stylet. Au tactile on laisse le défilement
  // natif : le statut se change alors depuis l'éditeur.
  function startDrag(event: ReactPointerEvent<HTMLElement>, issue: Issue) {
    if (event.button !== 0 || event.pointerType === "touch") return;
    const card = event.currentTarget;
    const origin = { x: event.clientX, y: event.clientY };
    let active = false;
    let over: IssueStatus | null = null;

    const move = (e: PointerEvent) => {
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      if (!active) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        active = true;
        card.style.transition = "none";
        document.body.classList.add("is-dragging");
        setDrag({ id: issue.id, from: issue.status, over: null });
      }
      // La position suit le pointeur hors de React pour rester à 60 i/s.
      const tilt = Math.max(-4, Math.min(4, dx / 40));
      card.style.transform = `translate(${dx}px, ${dy}px) rotate(${tilt}deg)`;

      const column = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-column]");
      const next = (column?.dataset.column as IssueStatus | undefined) ?? null;
      if (next !== over) {
        over = next;
        setDrag({ id: issue.id, from: issue.status, over });
      }
    };

    const finish = (e: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (!active) return;

      document.body.classList.remove("is-dragging");
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false));

      const target = e.type === "pointerup" ? over : null;
      if (target && target !== issue.status) {
        // La carte reste où elle a été lâchée ; la transition la fait glisser
        // jusqu'à sa place dans la nouvelle colonne.
        setDrag({ id: issue.id, from: issue.status, over: null });
        startTransition(() => setDrag(null));
        onMove(issue, target);
      } else {
        card.style.transition = "";
        card.style.transform = "";
        setDrag(null);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  }

  return (
    <div className="grid grid-cols-3 items-start gap-4 max-md:mx-[calc(var(--gutter)*-1)] max-md:snap-x max-md:snap-mandatory max-md:scroll-px-(--gutter) max-md:grid-cols-[repeat(3,minmax(280px,86vw))] max-md:overflow-x-auto max-md:px-(--gutter) max-md:pb-3">
      {STATUSES.map((status, columnIndex) => {
        const cards = issues.filter((issue) => issue.status === status.key).sort(byPriority);
        const isDropTarget = drag?.over === status.key && drag.from !== status.key;

        return (
          <section
            key={status.key}
            data-column={status.key}
            aria-label={status.label}
            className={cn(
              "flex min-h-56 flex-col gap-2.5 rounded-[18px] border p-3 transition-colors duration-200 max-md:snap-start",
              isDropTarget ? "border-accent bg-accent/15" : "border-transparent bg-column",
            )}
          >
            <header className="flex items-center gap-2 px-1.5 pt-1 pb-1.5 font-semibold">
              <StatusDot slug={status.slug} />
              {status.label}
              <span className="ml-auto min-w-6 rounded-full bg-surface-2 px-2 py-px text-center text-xs font-medium text-muted tabular-nums">
                {cards.length}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-2.5">
              {cards.length === 0 && (
                <div
                  className={cn(
                    "grid min-h-28 flex-1 place-items-center rounded-card border-[1.5px] border-dashed p-4 text-center text-[13px]",
                    isDropTarget ? "border-accent text-accent" : "border-line text-muted",
                  )}
                >
                  Glissez une issue ici
                </div>
              )}
              {cards.map((issue, rowIndex) => (
                <ViewTransition
                  key={issue.id}
                  name={`issue-${issue.id}`}
                  enter="card-enter"
                  exit="card-exit"
                >
                  <IssueCard
                    issue={issue}
                    dragging={drag?.id === issue.id}
                    introDelay={intro ? (columnIndex * 2 + rowIndex) * 45 : null}
                    onOpen={() => {
                      if (!suppressClick.current) onOpen(issue);
                    }}
                    onPointerDown={(event) => startDrag(event, issue)}
                  />
                </ViewTransition>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface IssueCardProps {
  issue: Issue;
  dragging: boolean;
  introDelay: number | null;
  onOpen: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}

function IssueCard({ issue, dragging, introDelay, onOpen, onPointerDown }: IssueCardProps) {
  const closed = issue.status === "closed";

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`${issue.title} — ${statusOf(issue.status).label}, priorité ${PRIORITIES[issue.priority].label}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
      style={introDelay === null ? undefined : { animationDelay: `${introDelay}ms` }}
      className={cn(
        "relative rounded-card border bg-surface p-3.5 pb-3 transition duration-200 ease-spring select-none",
        introDelay !== null && "animate-rise",
        dragging
          ? "pointer-events-none z-50 border-accent shadow-lift"
          : "border-line shadow-card hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
      )}
    >
      <h3
        className={cn(
          "mb-1 text-[15px] font-semibold wrap-anywhere",
          closed && "text-muted line-through decoration-muted/50",
        )}
      >
        {issue.title}
      </h3>
      <p className="line-clamp-2 text-[13.5px] wrap-anywhere text-muted">{issue.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <PriorityBadge priority={issue.priority} />
        <span className="font-mono text-xs text-muted/80">{shortId(issue.id)}</span>
      </div>
    </article>
  );
}
