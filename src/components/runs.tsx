import { dateFormat, fmt, round2, signed } from "../format";
import type { Run } from "../runs";

interface RunsProps {
  runs: Run[];
  readOnly: boolean;
  onEdit: (run: Run) => void;
  onDelete: (id: string) => void;
}

export function Runs({ runs, readOnly, onEdit, onDelete }: RunsProps) {
  if (runs.length === 0)
    return <p className="p-5 text-lg opacity-60">No runs yet.</p>;

  return (
    <div className="grid max-w-3xl gap-3 p-5">
      {runs
        .map((run, i) => ({ run, prev: runs[i - 1] ?? null }))
        .reverse()
        .map(({ run, prev }) => (
          <div key={run.id} className="card border border-base-300 bg-base-200">
            <div className="card-body flex-row items-center justify-between gap-3 p-4">
              <div className="min-w-0 tabular-nums">
                <p className="text-sm opacity-60">
                  {dateFormat.format(run.t)}
                  {run.w && ` · ${run.w}`}
                </p>
                <p className="text-lg font-semibold">
                  {prev
                    ? `${signed(run.g - prev.g)} G$`
                    : `${fmt(run.g)} G$ (start)`}
                </p>
                <p className="text-sm opacity-60">
                  {prev
                    ? `${signed(run.k - prev.k)} kills · ${signed(
                        run.score - prev.score,
                      )} score · K/D ${fmt(run.kd)} (${signed(
                        round2(run.kd - prev.kd),
                      )})`
                    : `${fmt(run.k)} kills · ${fmt(run.score)} score · K/D ${fmt(
                        run.kd,
                      )}`}
                </p>
                <p className="text-sm opacity-60">
                  {fmt(run.g)} G$ · {fmt(run.k)} kills · {fmt(run.score)} score
                </p>
              </div>
              {!readOnly && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-soft btn-md"
                    aria-label="Edit run"
                    onClick={() => onEdit(run)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-error btn-soft btn-md"
                    aria-label="Delete run"
                    onClick={() => onDelete(run.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
