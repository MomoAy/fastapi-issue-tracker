import type { ReactNode } from "react";
import {
  AlertIcon,
  Brand,
  Button,
  cn,
  HEADER_CLASS,
  InboxIcon,
  MAIN_CLASS,
  SearchIcon,
} from "./ui";

const SHIMMER =
  "animate-shimmer rounded-card bg-[linear-gradient(100deg,var(--surface)_30%,var(--surface-2)_50%,var(--surface)_70%)] bg-size-[300%_100%]";

function StatePanel({
  icon,
  title,
  children,
  action,
  tone = "accent",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action: ReactNode;
  tone?: "accent" | "danger";
}) {
  return (
    <div className="grid place-items-center gap-1.5 rounded-[22px] border-[1.5px] border-dashed border-line px-5 py-18 text-center">
      <div
        className={cn(
          "mb-2.5 grid size-14 place-items-center rounded-[18px]",
          tone === "danger" ? "bg-danger/10 text-danger" : "bg-accent/15 text-accent",
        )}
      >
        {icon}
      </div>
      <h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>
      <p className="mb-3.5 max-w-105 text-muted">{children}</p>
      {action}
    </div>
  );
}

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <StatePanel
      icon={<InboxIcon size={26} />}
      title="Aucune issue pour le moment"
      action={
        <Button variant="primary" onClick={onCreate}>
          Créer une issue
        </Button>
      }
    >
      Créez la première pour commencer à suivre votre travail.
    </StatePanel>
  );
}

export function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <StatePanel
      icon={<SearchIcon size={26} />}
      title="Aucun résultat"
      action={<Button onClick={onReset}>Réinitialiser les filtres</Button>}
    >
      Aucune issue ne correspond à la recherche ou au filtre.
    </StatePanel>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <StatePanel
      tone="danger"
      icon={<AlertIcon size={26} />}
      title="Impossible de charger les issues"
      action={<Button onClick={onRetry}>Réessayer</Button>}
    >
      {message} Lancez-le avec{" "}
      <code className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-fg">
        fastapi dev main.py
      </code>{" "}
      puis réessayez.
    </StatePanel>
  );
}

export function BoardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="grid grid-cols-3 items-start gap-4 max-md:grid-cols-1">
      {[3, 2, 2].map((cards, column) => (
        <div key={column} className="flex flex-col gap-2.5 rounded-[18px] bg-column p-3">
          {Array.from({ length: cards }, (_, card) => (
            <div key={card} className={cn(SHIMMER, card % 2 ? "h-22" : "h-26")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Coquille affichée pendant que le serveur va chercher les issues. */
export function TrackerSkeleton() {
  return (
    <>
      <header className={HEADER_CLASS}>
        <Brand />
      </header>
      <main className={MAIN_CLASS}>
        <div className={cn(SHIMMER, "mb-6 h-22 max-w-130")} />
        <BoardSkeleton />
      </main>
    </>
  );
}
