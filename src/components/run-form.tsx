import { Minus, Plus } from "lucide-preact";
import { useEffect, useState } from "preact/hooks";
import { type ParseOptions, parseNumber, round2, signed } from "../format";
import {
  type Metric,
  type Run,
  type RunValue,
  WEAPONS,
  type Weapon,
} from "../runs";

interface NumberInputProps {
  label: string;
  value: string;
  onValue: (input: string) => void;
  options?: ParseOptions;
  step?: number;
}

interface FieldProps {
  key: Metric;
  label: string;
  options: ParseOptions;
  step?: number;
}

type Fields = Record<Metric, string>;

interface RunFormProps {
  editing: Run | null;
  previous: Run | null;
  onClose: () => void;
  onSave: (values: RunValue) => void;
}

const FIELDS: FieldProps[] = [
  { key: "g", label: "Total gralats (G$)", options: { negative: true } },
  { key: "k", label: "Total kills", options: {} },
  { key: "kd", label: "K/D", options: { decimal: true }, step: 0.1 },
  { key: "score", label: "Total score", options: { negative: true } },
];

const fieldsFrom = (run: Run | null) =>
  Object.fromEntries(
    FIELDS.map(({ key }) => [key, run ? String(run[key]) : ""]),
  ) as Fields;

function NumberInput({
  label,
  value,
  onValue,
  options = {},
  step = 1,
}: NumberInputProps) {
  const parsed = parseNumber(value, options);
  const current = Number.isNaN(parsed) ? 0 : parsed;
  const set = (next: number) =>
    onValue(
      String(options.negative ? round2(next) : Math.max(0, round2(next))),
    );

  return (
    <div className="flex flex-col gap-1.5">
      <span>{label}</span>
      <div className="flex w-full items-center rounded-full bg-base-300 p-0.5">
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-md"
          aria-label={`Decrease ${label}`}
          tabIndex={-1}
          onClick={() => set(current - step)}
        >
          <Minus className="size-5" />
        </button>
        <input
          type="text"
          inputMode={
            options.negative ? "text" : options.decimal ? "decimal" : "numeric"
          }
          aria-label={label}
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent text-center text-lg font-semibold tabular-nums outline-none"
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          onInput={(e) => onValue(e.currentTarget.value)}
        />
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-md"
          aria-label={`Increase ${label}`}
          tabIndex={-1}
          onClick={() => set(current + step)}
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  );
}

export function RunForm({ editing, previous, onClose, onSave }: RunFormProps) {
  const seed = editing ?? previous;
  const [fields, setFields] = useState<Fields>(() => fieldsFrom(seed));
  const [weapon, setWeapon] = useState<Weapon | "">(seed?.w ?? "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const parsed = Object.fromEntries(
    FIELDS.map(({ key, options }) => [key, parseNumber(fields[key], options)]),
  ) as Record<Metric, number>;

  const required = previous !== null;
  const valid =
    (!required || weapon !== "") &&
    FIELDS.every(
      ({ key }) => fields[key].trim() !== "" && !Number.isNaN(parsed[key]),
    );

  function submit() {
    if (!valid) return;

    onSave({ ...parsed, w: weapon === "" ? undefined : weapon });
    onClose();
  }

  const title = editing ? "Edit run" : "Log run";

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal-box flex max-h-[90dvh] flex-col gap-5 overflow-y-auto text-lg">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-medium">{title}</h2>
          <p className="text-sm opacity-60">
            Enter your new totals, not what you gained in this run.
          </p>
        </div>

        {FIELDS.map(({ key, label, options, step }) => (
          <NumberInput
            key={key}
            label={label}
            value={fields[key]}
            options={options}
            step={step}
            onValue={(text) => setFields((f) => ({ ...f, [key]: text }))}
          />
        ))}

        <label className="flex flex-col gap-1.5">
          <span>Weapon{!required && " (optional)"}</span>
          <select
            className="select appearance-none select-lg w-full"
            value={weapon}
            onChange={(e) => setWeapon(e.currentTarget.value as Weapon | "")}
          >
            <option value="" disabled={required}>
              {required ? "Choose a weapon" : "No weapon"}
            </option>

            {WEAPONS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>

        {previous && valid && (
          <p className="text-sm tabular-nums opacity-60">
            This run: {signed(parsed.g - previous.g)} G$ ·{" "}
            {signed(parsed.k - previous.k)} kills ·{" "}
            {signed(parsed.score - previous.score)} score · K/D{" "}
            {signed(round2(parsed.kd - previous.kd))}
          </p>
        )}

        <div className="modal-action mt-0">
          <button
            type="button"
            className="btn btn-ghost btn-md"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-md"
            disabled={!valid}
            onClick={submit}
          >
            {editing ? "Save changes" : "Save run"}
          </button>
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
    </div>
  );
}
