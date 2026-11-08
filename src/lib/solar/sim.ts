import type { BodyId } from "./catalog";
import { unixToJd } from "./time";

export type ScreenPoint = { x: number; y: number; on: boolean };

/** Mutable simulation clock. The render loop writes it; React reads snapshots. */
export const sim = {
  jd: 2451545.0,
  booted: false,
  trailEpoch: 0,
  au: {} as Partial<Record<BodyId, number>>,
  speed: {} as Partial<Record<BodyId, number>>,
  moonKm: 384400,
  screen: {} as Partial<Record<BodyId, ScreenPoint>>,
};

export function bootSim(now = Date.now()) {
  if (sim.booted) return;
  sim.jd = unixToJd(now);
  sim.booted = true;
}

export function jumpToToday() {
  sim.jd = unixToJd(Date.now());
  sim.trailEpoch += 1;
}
