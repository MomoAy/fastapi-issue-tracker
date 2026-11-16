// Types et constantes du domaine — miroir de app/schemas.py côté API.

export type IssueStatus = "open" | "In progress" | "closed";
export type IssuePriority = "low" | "medium" | "high";
export type StatusSlug = "open" | "progress" | "closed";

export interface Issue {
  id: string;
  title: string;
  description: string;
  priority: IssuePriority;
  status: IssueStatus;
}

export type IssueDraft = Pick<Issue, "title" | "description" | "priority">;
export type IssueChanges = Partial<Omit<Issue, "id">>;

export const STATUSES: readonly {
  key: IssueStatus;
  slug: StatusSlug;
  label: string;
  plural: string;
}[] = [
  { key: "open", slug: "open", label: "Ouvert", plural: "ouvertes" },
  { key: "In progress", slug: "progress", label: "En cours", plural: "en cours" },
  { key: "closed", slug: "closed", label: "Terminé", plural: "terminées" },
];

export const PRIORITIES: Record<IssuePriority, { label: string; rank: number }> = {
  high: { label: "Haute", rank: 0 },
  medium: { label: "Moyenne", rank: 1 },
  low: { label: "Basse", rank: 2 },
};

/** Mêmes bornes que IssueCreate, pour valider avant d'appeler l'API. */
export const LIMITS = {
  title: { min: 3, max: 100 },
  description: { min: 5, max: 1000 },
} as const;

export const statusOf = (key: IssueStatus) =>
  STATUSES.find((status) => status.key === key) ?? STATUSES[0];

export const statusRank = (key: IssueStatus) =>
  STATUSES.findIndex((status) => status.key === key);

export const shortId = (id: string) => `#${id.slice(0, 6)}`;

export const byPriority = (a: Issue, b: Issue) =>
  PRIORITIES[a.priority].rank - PRIORITIES[b.priority].rank;
