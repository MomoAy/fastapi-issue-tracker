import { PRIORITIES, STATUSES, type Issue, type IssuePriority, type StatusSlug } from "@/lib/issues";
import { cn, PriorityGlyph, StatusDot } from "./ui";

export type PriorityFilter = IssuePriority | "all";

const METER_COLORS: Record<StatusSlug, string> = {
  open: "bg-open",
  progress: "bg-progress",
  closed: "bg-closed",
};

const FILTERS: PriorityFilter[] = ["all", "high", "medium", "low"];

interface OverviewProps {
  issues: Issue[];
  priority: PriorityFilter;
  onPriorityChange: (priority: PriorityFilter) => void;
}

export function Overview({ issues, priority, onPriorityChange }: OverviewProps) {
  const total = issues.length;
  const counts = STATUSES.map((status) => ({
    ...status,
    count: issues.filter((issue) => issue.status === status.key).length,
  }));
  const done = counts.find((status) => status.key === "closed")?.count ?? 0;

  return (
    <section
      aria-label="Vue d'ensemble"
      className="mb-6 flex flex-wrap items-end justify-between gap-6"
    >
      <div className="max-w-130 min-w-65 flex-1">
        <div className="mb-2.5 flex items-baseline justify-between">
          <span>
            <strong className="text-[28px] font-bold tracking-tight tabular-nums">{total}</strong>{" "}
            {total > 1 ? "issues" : "issue"}
          </span>
          {total > 0 && (
            <span className="text-sm text-muted">{Math.round((done / total) * 100)} % terminé</span>
          )}
        </div>

        <div aria-hidden="true" className="flex h-2 gap-0.75 overflow-hidden rounded-full bg-column">
          {counts.map((status) => (
            <span
              key={status.key}
              style={{ flexGrow: status.count }}
              className={cn(
                "min-w-0 rounded-full transition-[flex-grow] duration-500 ease-spring",
                METER_COLORS[status.slug],
                status.count === 0 && "hidden",
              )}
            />
          ))}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-4 text-[13px] text-muted">
          {counts.map((status) => (
            <span key={status.key} className="inline-flex items-center gap-1.5">
              <StatusDot slug={status.slug} />
              <b className="font-semibold text-fg tabular-nums">{status.count}</b> {status.plural}
            </span>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Filtrer par priorité" className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={priority === filter}
            onClick={() => onPriorityChange(filter)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150",
              priority === filter
                ? "border-transparent bg-accent/15 text-accent"
                : "border-line text-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {filter === "all" ? (
              "Toutes"
            ) : (
              <>
                <PriorityGlyph priority={filter} />
                {PRIORITIES[filter].label}
              </>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
