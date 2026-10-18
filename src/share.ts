import { round2 } from "./format";
import { byTime, type Run, WEAPONS } from "./runs";

export const HASH_PREFIX = "#s=";
export const MAX_SHARED_RUNS = 5000;

const toBase64URL = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

function fromBase64URL(text: string) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));

  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const pipe = async (
  data: Uint8Array,
  stream: CompressionStream | DecompressionStream,
) =>
  new Uint8Array(
    await new Response(
      new Blob([data as BlobPart]).stream().pipeThrough(stream),
    ).arrayBuffer(),
  );

export async function encode(runs: Run[]) {
  const rows = [...runs]
    .sort(byTime)
    .map((r) => [
      Math.round(r.t / 60000),
      r.g,
      r.k,
      round2(r.kd),
      r.score,
      r.w ? WEAPONS.indexOf(r.w) : -1,
    ]);

  const bytes = new TextEncoder().encode(JSON.stringify(rows));
  return toBase64URL(await pipe(bytes, new CompressionStream("deflate-raw")));
}

export async function decode(payload: string): Promise<Run[] | null> {
  try {
    const bytes = await pipe(
      fromBase64URL(payload),
      new DecompressionStream("deflate-raw"),
    );

    const rows: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(rows)) return null;

    const runs: Run[] = [];
    for (const row of rows.slice(0, MAX_SHARED_RUNS)) {
      if (
        !Array.isArray(row) ||
        (row.length !== 5 && row.length !== 6) ||
        !row.every((n) => typeof n === "number" && Number.isFinite(n))
      )
        return null;

      const [m, g, k, kd, score, w] = row as number[];
      runs.push({
        id: `shared:${runs.length}`,
        t: m * 60000,
        g,
        k,
        kd,
        score,
        w: w === undefined ? undefined : WEAPONS[w],
      });
    }

    return runs.sort(byTime);
  } catch {
    return null;
  }
}

export const readHash = () =>
  location.hash.startsWith(HASH_PREFIX)
    ? location.hash.slice(HASH_PREFIX.length)
    : null;
