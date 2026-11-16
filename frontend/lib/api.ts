import type { Issue, IssueChanges, IssueDraft } from "./issues";

// Utilisé côté serveur (premier rendu) comme côté navigateur (mutations).
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const ISSUES_URL = `${API_URL}/api/v1/issues`;

export class ApiError extends Error {
  /** `status` vaut null quand l'API n'a pas répondu du tout. */
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResult<T> {
  data: T;
  /** Temps de traitement annoncé par l'en-tête X-Process-Time, en millisecondes. */
  processMs: number | null;
}

async function request<T>(path: string, method = "GET", body?: unknown): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(ISSUES_URL + path, {
      method,
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("API injoignable. Le serveur FastAPI est-il lancé ?", null);
  }

  if (!response.ok) {
    throw new ApiError(await errorMessage(response), response.status);
  }

  const seconds = parseFloat(response.headers.get("X-Process-Time") ?? "");
  return {
    data: response.status === 204 ? (null as T) : ((await response.json()) as T),
    processMs: Number.isFinite(seconds) ? seconds * 1000 : null,
  };
}

/** FastAPI renvoie `detail` en chaîne (404) ou en liste d'erreurs de validation (422). */
async function errorMessage(response: Response) {
  try {
    const { detail } = await response.json();
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg).join(" · ");
  } catch {
    // Réponse sans JSON : on retombe sur le code HTTP.
  }
  return `Erreur ${response.status}`;
}

export const issuesApi = {
  list: () => request<Issue[]>("/"),
  create: (draft: IssueDraft) => request<Issue>("/", "POST", draft),
  update: (id: string, changes: IssueChanges) => request<Issue>(`/${id}`, "PUT", changes),
  remove: (id: string) => request<null>(`/${id}`, "DELETE"),
};
