"use client";

import type { RefObject } from "react";
import {
  BoardIcon,
  Brand,
  Button,
  cn,
  HEADER_CLASS,
  IconButton,
  Kbd,
  ListIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
} from "./ui";

export type View = "board" | "list";

export interface ApiStatus {
  ok: boolean;
  ms: number | null;
  /** Incrémenté à chaque réponse pour rejouer l'animation du voyant. */
  tick: number;
}

interface TopbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  api: ApiStatus;
  view: View;
  onViewChange: (view: View) => void;
  onCreate: () => void;
}

const VIEWS = [
  { key: "board", label: "Vue tableau", Icon: BoardIcon },
  { key: "list", label: "Vue liste", Icon: ListIcon },
] as const;

function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Stockage indisponible : le thème ne sera simplement pas mémorisé.
  }
}

export function Topbar({
  query,
  onQueryChange,
  searchRef,
  api,
  view,
  onViewChange,
  onCreate,
}: TopbarProps) {
  return (
    <header className={HEADER_CLASS}>
      <Brand />

      <label className="group mx-auto flex h-9.5 max-w-110 min-w-0 flex-1 items-center gap-2 rounded-[11px] border border-line bg-surface pr-2.5 pl-3 text-muted transition duration-150 focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15">
        <SearchIcon />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onQueryChange("");
              event.currentTarget.blur();
            }
          }}
          placeholder="Rechercher une issue…"
          aria-label="Rechercher une issue"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        <Kbd className="border border-line-strong bg-surface-2 text-muted group-focus-within:invisible max-md:hidden">
          /
        </Kbd>
      </label>

      <div className="flex shrink-0 items-center gap-2.5">
        <span
          title="Temps de traitement renvoyé par l'API (en-tête X-Process-Time)"
          className={cn(
            "inline-flex h-7.5 items-center gap-1.5 rounded-full border px-2.5 font-mono text-xs tabular-nums max-lg:hidden",
            api.ok ? "border-line text-muted" : "border-danger/40 text-danger",
          )}
        >
          <i
            key={api.tick}
            className={cn(
              "size-1.75 rounded-full",
              api.ok ? "animate-ping-once bg-closed ring-3 ring-closed/20" : "bg-danger",
            )}
          />
          {!api.ok ? "API injoignable" : api.ms === null ? "API" : `API · ${api.ms.toFixed(1)} ms`}
        </span>

        <div
          role="group"
          aria-label="Affichage"
          className="flex gap-0.5 rounded-[11px] border border-line bg-surface p-0.75"
        >
          {VIEWS.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={view === key}
              onClick={() => onViewChange(key)}
              className={cn(
                "grid h-7.5 w-8 place-items-center rounded-lg transition-colors duration-150",
                view === key ? "bg-accent/15 text-accent" : "text-muted hover:text-fg",
              )}
            >
              <Icon />
            </button>
          ))}
        </div>

        <IconButton onClick={toggleTheme} aria-label="Changer de thème" title="Changer de thème">
          <SunIcon size={17} className="hidden dark:block" />
          <MoonIcon size={17} className="dark:hidden" />
        </IconButton>

        <Button variant="primary" onClick={onCreate} className="max-sm:w-9.5 max-sm:px-0">
          <PlusIcon />
          <span className="max-sm:hidden">Nouvelle issue</span>
          <Kbd className="bg-white/15 text-white max-md:hidden">N</Kbd>
        </Button>
      </div>
    </header>
  );
}
