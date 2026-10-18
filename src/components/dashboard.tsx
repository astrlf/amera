import clsx from "clsx";
import { useState } from "preact/hooks";
import { ticks } from "../chart";
import { dateFormat, fmt, shortDateFormat, signed } from "../format";
import { METRICS, type Metric, type Run, WEAPONS, type Weapon } from "../runs";

type GainKey = "g" | "k" | "score";

type View = Metric | "weapon";

interface StatProps {
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
}

interface StatItem {
  label: string;
  value: string;
}

interface Point {
  run: Run;
  value: number;
}

interface ChartProps {
  points: Point[];
  metric: Metric;
}

interface Gain {
  run: Run;

  g: number;
  k: number;
  kd: number;
  score: number;
}

interface GainStat {
  label: string;
  key: GainKey;
  unit: string;
}

interface WeaponsProps {
  list: Gain[];
}

interface DashboardProps {
  runs: Run[];
}

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4";
const CARD = "card border border-base-300 bg-base-200";

const AXIS_TEXT = {
  fontSize: 11,
  fill: "currentColor",
  fillOpacity: 0.6,
  className: "text-base-content",
};

const GAIN_STATS: GainStat[] = [
  { label: "Gralats gained", key: "g", unit: " G$" },
  { label: "Kills gained", key: "k", unit: "" },
  { label: "Score gained", key: "score", unit: "" },
];

const VIEWS: View[] = ["g", "k", "kd", "score", "weapon"];

const gains = (runs: Run[]): Gain[] =>
  runs.slice(1).map((run, i) => ({
    run,
    g: run.g - runs[i].g,
    k: run.k - runs[i].k,
    kd: run.kd - runs[i].kd,
    score: run.score - runs[i].score,
  }));

function byWeapon(list: Gain[]) {
  const totals = new Map<Weapon, number>(WEAPONS.map((w) => [w, 0]));

  for (const { run, k } of list)
    if (run.w && k > 0) totals.set(run.w, (totals.get(run.w) ?? 0) + k);

  return [...totals.entries()]
    .map(([weapon, kills]) => ({ weapon, kills }))
    .sort((a, b) => b.kills - a.kills);
}

const viewLabel = (v: View) => (v === "weapon" ? "Weapon" : METRICS[v]);

const Stat = ({ label, value, delta, hint }: StatProps) => (
  <div className={CARD}>
    <div className="card-body gap-1 p-4">
      <p className="text-sm opacity-60">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {delta != null && (
        <p
          className={clsx(
            "text-sm font-medium tabular-nums",
            delta > 0
              ? "text-success"
              : delta < 0
                ? "text-error"
                : "opacity-60",
          )}
        >
          {signed(delta)}
          {hint && <span className="font-normal opacity-60"> {hint}</span>}
        </p>
      )}
    </div>
  </div>
);

function Chart({ points, metric }: ChartProps) {
  const values = points.map((p) => p.value);

  if (values.length < 2)
    return (
      <p className="py-10 text-center text-sm opacity-60">
        Not enough runs yet to draw a trend.
      </p>
    );

  const marks = ticks(
    Math.min(0, ...values),
    Math.max(0, ...values),
    metric === "kd" ? 0.01 : 1,
  );

  const lo = marks[0];
  const hi = marks[marks.length - 1];
  const widest = Math.max(...marks.map((t) => fmt(t).length));

  const W = 640;
  const H = 260;
  const pad = { l: widest * 6.5 + 16, r: 28, t: 16, b: 30 };

  const x = (i: number) =>
    pad.l + (i / (values.length - 1)) * (W - pad.l - pad.r);

  const y = (v: number) =>
    pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);

  const line = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${x(0)},${y(0)} ${line} ${x(values.length - 1)},${y(0)}`;

  return (
    <div className="text-primary">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${METRICS[metric]} over time`}
      >
        {marks.map((t) => (
          <line
            key={t}
            x1={pad.l}
            x2={W - pad.r}
            y1={y(t)}
            y2={y(t)}
            stroke="currentColor"
            strokeOpacity={t === 0 ? 0.35 : 0.12}
          />
        ))}

        <polygon points={area} fill="currentColor" fillOpacity="0.1" />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {values.map((v, i) => (
          <circle
            key={points[i].run.id}
            cx={x(i)}
            cy={y(v)}
            r={values.length > 60 ? 2 : 4}
            fill="currentColor"
          >
            <title>{`${dateFormat.format(points[i].run.t)}: ${fmt(v)}`}</title>
          </circle>
        ))}

        {marks.map((t) => (
          <text
            key={t}
            x={pad.l - 8}
            y={y(t) + 4}
            style={{ textAnchor: "end" }}
            {...AXIS_TEXT}
          >
            {fmt(t)}
          </text>
        ))}

        <text x={pad.l} y={H - 8} {...AXIS_TEXT}>
          {shortDateFormat.format(points[0].run.t)}
        </text>
        <text
          x={W - pad.r}
          y={H - 8}
          style={{ textAnchor: "end" }}
          {...AXIS_TEXT}
        >
          {shortDateFormat.format(points[points.length - 1].run.t)}
        </text>
      </svg>
    </div>
  );
}

function Weapons({ list }: WeaponsProps) {
  const rows = byWeapon(list);
  const max = rows[0].kills;

  if (max === 0)
    return (
      <p className="py-10 text-center text-sm opacity-60">
        No weapon data yet. Log runs with a weapon to see your kills per weapon.
      </p>
    );

  return (
    <div className="flex flex-col gap-4 py-2">
      {rows.map(({ weapon, kills }, i) => (
        <div key={weapon} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className={i === 0 ? "font-semibold" : ""}>{weapon}</span>
            <span className="text-sm tabular-nums opacity-60">
              {fmt(kills)} kills
            </span>
          </div>
          <progress
            className={clsx(
              "progress h-3 w-full",
              i === 0 ? "progress-primary" : "progress-neutral",
            )}
            value={kills}
            max={max}
            aria-label={`${weapon} kills`}
          />
        </div>
      ))}
    </div>
  );
}

export function Dashboard({ runs }: DashboardProps) {
  const [view, setView] = useState<View>("g");

  if (runs.length === 0) {
    return (
      <p className="p-5 text-lg opacity-60">
        No runs yet. Use the + button in the top bar to log your first one.
      </p>
    );
  }

  const last = runs[runs.length - 1];
  const list = gains(runs);
  const lastGain = list.at(-1) ?? null;
  const prevGain = list.at(-2) ?? null;

  const avg = (key: GainKey) =>
    list.length ? list.reduce((sum, x) => sum + x[key], 0) / list.length : null;
  const avgG = avg("g");
  const avgGWhole = Math.trunc(avgG ?? 0);
  const bestG = list.length ? Math.max(...list.map((x) => x.g)) : null;

  const orDash = (n: number | null, unit = "") =>
    n === null ? "—" : `${fmt(n)}${unit}`;

  const overall: StatItem[] = [
    { label: "Runs", value: fmt(runs.length) },
    { label: "Total gralats", value: `${fmt(last.g)} G$` },
    { label: "Total kills", value: fmt(last.k) },
    { label: "K/D", value: fmt(last.kd) },
    { label: "Total score", value: fmt(last.score) },
    {
      label: "Avg G$ per run",
      value: orDash(avgG === null ? null : avgGWhole, " G$"),
    },
    { label: "Avg kills per run", value: orDash(avg("k")) },
    { label: "Avg score per run", value: orDash(avg("score")) },
    { label: "Best run", value: orDash(bestG, " G$") },
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-6 p-5">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Last run</h2>
        {lastGain ? (
          <div className={GRID}>
            {GAIN_STATS.map(({ label, key, unit }) => (
              <Stat
                key={key}
                label={label}
                value={`${signed(lastGain[key])}${unit}`}
                delta={prevGain ? lastGain[key] - prevGain[key] : null}
                hint="vs previous run"
              />
            ))}
            <Stat
              label="K/D"
              value={fmt(last.kd)}
              delta={lastGain.kd}
              hint="this run"
            />
            {avgG !== null && list.length > 1 && (
              <Stat
                label="Gralats vs average"
                value={`${signed(avgGWhole)} G$ avg`}
                delta={lastGain.g - avgG}
                hint="G$"
              />
            )}
          </div>
        ) : (
          <p className="text-sm opacity-60">
            Log one more run to see what you gained.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Overall</h2>
        <div className={GRID}>
          {overall.map(({ label, value }) => (
            <Stat key={label} label={label} value={value} />
          ))}
        </div>
      </section>

      <section className={CARD}>
        <div className="card-body gap-3 p-4">
          <div role="tablist" className="tabs tabs-box self-start">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                className={clsx("tab", v === view && "tab-active")}
                onClick={() => setView(v)}
              >
                {viewLabel(v)}
              </button>
            ))}
          </div>

          {view === "weapon" ? (
            <Weapons list={list} />
          ) : (
            <Chart
              points={runs.map((run) => ({ run, value: run[view] }))}
              metric={view}
            />
          )}
        </div>
      </section>
    </div>
  );
}
