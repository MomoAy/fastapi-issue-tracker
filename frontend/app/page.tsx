import { Suspense } from "react";
import { IssueTracker } from "@/components/issue-tracker";
import { TrackerSkeleton } from "@/components/states";
import { issuesApi } from "@/lib/api";

export default function Page() {
  return (
    <Suspense fallback={<TrackerSkeleton />}>
      <InitialIssues />
    </Suspense>
  );
}

/**
 * Charge les issues côté serveur pour que la page arrive déjà remplie.
 * Si l'API ne répond pas, l'interface s'affiche quand même et propose de réessayer.
 */
async function InitialIssues() {
  const initial = await issuesApi.list().then(
    ({ data, processMs }) => ({ issues: data, processMs, error: null }),
    (failure: unknown) => ({
      issues: [],
      processMs: null,
      error: failure instanceof Error ? failure.message : "Chargement impossible.",
    }),
  );

  return (
    <IssueTracker
      initialIssues={initial.issues}
      initialError={initial.error}
      initialProcessMs={initial.processMs}
    />
  );
}
