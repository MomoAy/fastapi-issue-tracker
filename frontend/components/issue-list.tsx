"use client";

import { ViewTransition } from "react";
import { byPriority, PRIORITIES, shortId, statusOf, statusRank, type Issue } from "@/lib/issues";
import { cn, PriorityBadge, StatusDot } from "./ui";

interface IssueListProps {
  issues: Issue[];
  intro: boolean;
  onOpen: (issue: Issue) => void;
}

export function IssueList({ issues, intro, onOpen }: IssueListProps) {
  const sorted = [...issues].sort(
    (a, b) => statusRank(a.status) - statusRank(b.status) || byPriority(a, b),
  );

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((issue, index) => {
        const status = statusOf(issue.status);
        return (
          // Même nom que la carte du tableau : changer de vue fait glisser chaque issue.
          <ViewTransition
            key={issue.id}
            name={`issue-${issue.id}`}
            enter="card-enter"
            exit="card-exit"
          >
            <article
              role="button"
              tabIndex={0}
              aria-label={`${issue.title} — ${status.label}, priorité ${PRIORITIES[issue.priority].label}`}
              onClick={() => onOpen(issue)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(issue);
                }
              }}
              style={intro ? { animationDelay: `${index * 35}ms` } : undefined}
              className={cn(
                "grid grid-cols-[120px_minmax(0,1fr)_110px_80px] items-center gap-4 rounded-card border border-line bg-surface px-4 py-3 transition duration-200 ease-spring hover:translate-x-1 hover:border-line-strong max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-3 max-md:gap-y-2",
                intro && "animate-rise",
              )}
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-medium max-md:col-start-1 max-md:row-start-2">
                <StatusDot slug={status.slug} />
                {status.label}
              </span>
              <div className="min-w-0">
                <h3
                  className={cn(
                    "truncate text-[15px] font-semibold",
                    issue.status === "closed" && "text-muted line-through decoration-muted/50",
                  )}
                >
                  {issue.title}
                </h3>
                <p className="truncate text-[13.5px] text-muted">{issue.description}</p>
              </div>
              <PriorityBadge priority={issue.priority} className="justify-self-start" />
              <span className="text-right font-mono text-xs text-muted/80 max-md:hidden">
                {shortId(issue.id)}
              </span>
            </article>
          </ViewTransition>
        );
      })}
    </div>
  );
}
