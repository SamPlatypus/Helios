import { create } from "zustand";
import type { BodyId } from "./catalog";
import { jumpToToday } from "./sim";

export type SolarState = {
  paused: boolean;
  daysPerSecond: number;
  showLabels: boolean;
  showTrails: boolean;
  showOrbits: boolean;
  showBelt: boolean;
  showPluto: boolean;
  lowPower: boolean;
  bodyScale: number;
  selectedId: BodyId | null;
  factsOpen: boolean;
  dateLabel: string;
  liveDistance: string | null;
  liveSpeed: string | null;
  setPaused: (paused: boolean) => void;
  setDaysPerSecond: (daysPerSecond: number) => void;
  setShowLabels: (showLabels: boolean) => void;
  setShowTrails: (showTrails: boolean) => void;
  setShowOrbits: (showOrbits: boolean) => void;
  setShowBelt: (showBelt: boolean) => void;
  setShowPluto: (showPluto: boolean) => void;
  setLowPower: (lowPower: boolean) => void;
  setBodyScale: (bodyScale: number) => void;
  select: (id: BodyId) => void;
  setFactsOpen: (factsOpen: boolean) => void;
  clearSelection: () => void;
  goToToday: () => void;
  patchLive: (patch: { dateLabel: string; liveDistance: string | null; liveSpeed: string | null }) => void;
};

const STORAGE_KEY = "helios.settings.v2";

export const useSolar = create<SolarState>((set, get) => ({
  paused: false,
  daysPerSecond: 20,
  showLabels: true,
  showTrails: true,
  showOrbits: true,
  showBelt: true,
  showPluto: false,
  lowPower: false,
  bodyScale: 1,
  selectedId: null,
  factsOpen: false,
  dateLabel: "Setting the clock…",
  liveDistance: null,
  liveSpeed: null,
  setPaused: (paused) => set({ paused }),
  setDaysPerSecond: (daysPerSecond) => set({ daysPerSecond }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setShowTrails: (showTrails) => set({ showTrails }),
  setShowOrbits: (showOrbits) => set({ showOrbits }),
  setShowBelt: (showBelt) => set({ showBelt }),
  setShowPluto: (showPluto) => {
    const selectedId = get().selectedId;
    set({
      showPluto,
      selectedId: !showPluto && selectedId === "pluto" ? null : selectedId,
      factsOpen: !showPluto && selectedId === "pluto" ? false : get().factsOpen,
    });
  },
  setLowPower: (lowPower) => set({ lowPower }),
  setBodyScale: (bodyScale) => set({ bodyScale }),
  select: (id) => {
    const current = get();
    if (current.selectedId === id) {
      set({ factsOpen: !current.factsOpen });
      return;
    }
    set({ selectedId: id, factsOpen: true, liveDistance: null, liveSpeed: null });
  },
  setFactsOpen: (factsOpen) => set({ factsOpen }),
  clearSelection: () => set({ selectedId: null, factsOpen: false, liveDistance: null, liveSpeed: null }),
  goToToday: () => {
    jumpToToday();
  },
  patchLive: (patch) => set(patch),
}));

type Saved = Pick<
  SolarState,
  "daysPerSecond" | "showLabels" | "showTrails" | "showOrbits" | "showBelt" | "showPluto" | "lowPower" | "bodyScale"
>;

export function loadSolarSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<Saved> & { version?: number };
    const next: Partial<Saved> = {};
    if (typeof parsed.daysPerSecond === "number" && parsed.daysPerSecond >= 1 && parsed.daysPerSecond <= 80) {
      next.daysPerSecond = parsed.daysPerSecond;
    }
    if (typeof parsed.bodyScale === "number") next.bodyScale = Math.min(1.8, Math.max(0.7, parsed.bodyScale));
    (["showLabels", "showTrails", "showOrbits", "showBelt", "showPluto", "lowPower"] as const).forEach((key) => {
      if (typeof parsed[key] === "boolean") next[key] = parsed[key];
    });
    useSolar.setState(next);
  } catch {
    /* ignore broken local data */
  }
}

export function saveSolarSettings() {
  const s = useSolar.getState();
  const payload: Saved & { version: number } = {
    version: 2,
    daysPerSecond: s.daysPerSecond,
    showLabels: s.showLabels,
    showTrails: s.showTrails,
    showOrbits: s.showOrbits,
    showBelt: s.showBelt,
    showPluto: s.showPluto,
    lowPower: s.lowPower,
    bodyScale: s.bodyScale,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}
