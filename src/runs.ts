// NOTE: Names are short for size reasons
export interface Run {
  id: string;

  /**
   * Timestamp in milliseconds
   */
  t: number;

  /**
   * Total amount of gralats
   */
  g: number;

  /**
   * Total amount of kills
   */
  k: number;

  /**
   * Kill/death ratio
   */
  kd: number;

  score: number;

  /**
   * Weapon used for the run
   */
  w?: Weapon;
}

export type RunValue = Pick<Run, "g" | "k" | "kd" | "score" | "w">;

export type Weapon = (typeof WEAPONS)[number];

export type Metric = keyof typeof METRICS;

export const WEAPONS = [
  "Antimatter SMG",
  "Antimatter Prototype",
  "Soulhunter",
  "Photon Rifle",
  "Magma Coffin",
] as const;

export const METRICS = {
  g: "Gralats",
  k: "Kills",
  kd: "K/D",
  score: "Score",
} as const;

export const byTime = (a: Run, b: Run) => a.t - b.t;

export const generateID = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const runKey = (r: Run) =>
  `${Math.round(r.t / 60000)}:${r.g}:${r.k}:${r.kd}:${r.score}:${r.w ?? ""}`;
