import clsx from "clsx";
import {
  ChartLine,
  List,
  type LucideIcon,
  PanelLeftOpen,
  Plus,
  Settings2,
} from "lucide-preact";
import { useEffect, useState } from "preact/hooks";
import { Dashboard } from "./components/dashboard";
import { RunForm } from "./components/run-form";
import { Runs } from "./components/runs";
import { Settings } from "./components/settings";
import { byTime, generateID, type Run, type RunValue, runKey } from "./runs";
import { decode, readHash } from "./share";
import { useStored } from "./storage";

type Tab = "dashboard" | "runs" | "settings";

interface TabProps {
  id: Tab;
  label: string;
  Icon: LucideIcon;
}

interface FormState {
  run: Run | null;
}

const TABS: TabProps[] = [
  { id: "dashboard", label: "Dashboard", Icon: ChartLine },
  { id: "runs", label: "Runs", Icon: List },
  { id: "settings", label: "Settings", Icon: Settings2 },
];

export function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [mine, setMine] = useStored<Run[]>("runs", []);
  const [shared, setShared] = useState<Run[] | null>(null);
  const [badLink, setBadLink] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    async function load() {
      const payload = readHash();
      const runs = payload === null ? null : await decode(payload);

      setShared(runs);
      setBadLink(payload !== null && runs === null);

      if (payload !== null) setTab("dashboard");
    }

    load();
    window.addEventListener("hashchange", load);

    return () => window.removeEventListener("hashchange", load);
  }, []);

  const viewing = shared !== null;
  const sorted = [...mine].sort(byTime);
  const runs = viewing ? shared : sorted;
  const label = TABS.find(({ id }) => id === tab)?.label ?? "";

  function closeShared() {
    history.replaceState(null, "", location.pathname + location.search);

    setShared(null);
    setBadLink(false);
  }

  function importShared() {
    if (!shared) return;

    setMine((prev) => {
      const seen = new Set(prev.map(runKey));
      const extra = shared
        .filter((r) => !seen.has(runKey(r)))
        .map((r) => ({ ...r, id: generateID() }));

      return [...prev, ...extra];
    });

    closeShared();
  }

  const editing = form?.run ?? null;
  const previous = editing
    ? (sorted[sorted.findIndex((r) => r.id === editing.id) - 1] ?? null)
    : (sorted.at(-1) ?? null);

  const save = (values: RunValue) =>
    setMine((prev) =>
      editing
        ? prev.map((r) => (r.id === editing.id ? { ...r, ...values } : r))
        : [...prev, { id: generateID(), t: Date.now(), ...values }],
    );

  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex h-dvh flex-col">
        <nav className="navbar min-h-18 w-full bg-base-300 px-3">
          <label
            htmlFor="sidebar"
            aria-label="Toggle sidebar"
            className="btn btn-square btn-ghost btn-lg drawer-button"
          >
            <PanelLeftOpen className="my-1.5 inline-block size-5" />
          </label>

          {!viewing && (
            <button
              type="button"
              aria-label="Log run"
              className="btn btn-square btn-ghost btn-lg"
              onClick={() => setForm({ run: null })}
            >
              <Plus className="my-1.5 inline-block size-5" />
            </button>
          )}
          <h1 className="flex-1 px-3 text-xl font-medium">{label}</h1>
        </nav>

        <main className="flex-1 overflow-y-auto bg-base-100">
          {(viewing || badLink) && (
            <div role="alert" className="alert m-5 mb-0 flex-wrap">
              <span className="flex-1">
                {badLink
                  ? "This share link is invalid or corrupted."
                  : `Viewing shared stats (${runs.length} runs, read-only).`}
              </span>

              {viewing && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={importShared}
                >
                  Import into mine
                </button>
              )}

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={closeShared}
              >
                {badLink ? "Dismiss" : "Back to mine"}
              </button>
            </div>
          )}

          {tab === "dashboard" && <Dashboard runs={runs} />}
          {tab === "runs" && (
            <Runs
              runs={runs}
              readOnly={viewing}
              onEdit={(run) => setForm({ run })}
              onDelete={(id) =>
                setMine((prev) => prev.filter((r) => r.id !== id))
              }
            />
          )}
          {tab === "settings" && (
            <Settings runs={mine} onClear={() => setMine([])} />
          )}
        </main>
      </div>

      <div className="drawer-side is-drawer-close:overflow-visible">
        <label
          htmlFor="sidebar"
          aria-label="Close sidebar"
          className="drawer-overlay"
        />

        <div className="flex min-h-full flex-col items-start bg-base-200 transition-[width] duration-200 is-drawer-close:w-18 is-drawer-open:w-72">
          <ul className="menu menu-lg w-full grow gap-2 whitespace-nowrap">
            {TABS.map(({ id, label: name, Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  className={clsx(
                    "is-drawer-close:tooltip is-drawer-close:tooltip-right h-14 content-center px-4.5",
                    id === tab && "menu-active",
                  )}
                  data-tip={name}
                  aria-current={id === tab ? "page" : undefined}
                  onClick={() => setTab(id)}
                >
                  <Icon className="my-1.5 inline-block size-5" />
                  <span className="is-drawer-close:hidden">{name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {form && (
        <RunForm
          key={editing?.id ?? "new"}
          editing={editing}
          previous={previous}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
