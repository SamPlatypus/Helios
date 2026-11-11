import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Pause, Play } from "lucide-react";
import { BODIES, WORLD_ORDER, staticFacts, type BodyId } from "@/lib/solar/catalog";
import { sim, bootSim } from "@/lib/solar/sim";
import { loadSolarSettings, saveSolarSettings, useSolar } from "@/lib/solar/store";
import { formatJulian, formatMultiplier, formatRate, rateToSlider, sliderToRate, stepRate } from "@/lib/solar/time";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

function ToggleRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-1">
      <label htmlFor={id} className="text-base text-fg">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function SliderBlock({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onValueChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onValueChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-base text-fg">
          {label}
        </label>
      </div>
      <div className="px-5">
        <Slider
          id={id}
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(next) => onValueChange(next[0] ?? value)}
        />
      </div>
      <p className="text-sm text-muted tabular-nums">{display}</p>
    </div>
  );
}

function SkyLabels() {
  const showLabels = useSolar((s) => s.showLabels);
  const selectedId = useSolar((s) => s.selectedId);
  const showPluto = useSolar((s) => s.showPluto);
  const [marks, setMarks] = useState<Array<{ id: BodyId; x: number; y: number }>>([]);
  const lastKey = useRef("");

  useEffect(() => {
    if (!showLabels) {
      lastKey.current = "";
      setMarks([]);
      return;
    }
    let frame = 0;
    let last = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < 50) return;
      last = now;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const raw: Array<{ id: BodyId; x: number; y: number }> = [];
      WORLD_ORDER.forEach((id) => {
        if (id === "pluto" && !showPluto) return;
        const point = sim.screen[id];
        if (!point?.on) return;
        if (point.x < 16 || point.x > width - 16 || point.y < 88 || point.y > height - 112) return;
        raw.push({ id, x: point.x, y: point.y });
      });
      raw.sort((a, b) => {
        if (a.id === "sun") return -1;
        if (b.id === "sun") return 1;
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
        return a.y - b.y;
      });
      const placed: Array<{ id: BodyId; x: number; y: number }> = [];
      const overlaps = (x: number, y: number, id: BodyId) => {
        const w = Math.max(48, BODIES[id].name.length * 7.6);
        const h = 18;
        return placed.some((other) => {
          const ow = Math.max(48, BODIES[other.id].name.length * 7.6);
          const left = x - w / 2;
          const oleft = other.x - ow / 2;
          return left < oleft + ow + 10 && left + w + 10 > oleft && y - h / 2 < other.y + 8 && y + h / 2 + 8 > other.y - h / 2;
        });
      };
      raw.forEach((mark) => {
        const preferred =
          mark.id === "moon"
            ? [
                [22, 18],
                [0, 20],
                [34, 8],
                [-28, 18],
              ]
            : mark.id === "earth"
              ? [
                  [0, -18],
                  [-26, -16],
                  [26, -16],
                  [0, -34],
                ]
              : [
                  [0, -16],
                  [0, 18],
                  [32, -8],
                  [-32, -8],
                  [0, -34],
                  [28, 16],
                  [-28, 16],
                ];
        let chosen = preferred[0];
        for (const [ox, oy] of preferred) {
          const x = mark.x + ox;
          const y = mark.y + oy;
          if (x < 28 || x > width - 28 || y < 96 || y > height - 120) continue;
          if (!overlaps(x, y, mark.id)) {
            chosen = [ox, oy];
            break;
          }
        }
        const x = Math.min(width - 28, Math.max(28, mark.x + chosen[0]));
        const y = Math.min(height - 108, Math.max(96, mark.y + chosen[1]));
        placed.push({ id: mark.id, x, y });
      });
      const key = placed.map((mark) => `${mark.id}:${mark.x.toFixed(0)}:${mark.y.toFixed(0)}`).join("|");
      if (key !== lastKey.current) {
        lastKey.current = key;
        setMarks(placed);
      }
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [showLabels, selectedId, showPluto]);

  if (!showLabels || marks.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden" aria-hidden="true">
      {marks.map((mark) => (
        <p
          key={mark.id}
          className={`absolute text-sm leading-none ${mark.id === selectedId ? "text-fg" : "text-muted"}`}
          style={{ left: mark.x, top: mark.y, transform: "translate(-50%, -50%)" }}
        >
          {BODIES[mark.id].name}
        </p>
      ))}
    </div>
  );
}

export function Chrome() {
  const [open, setOpen] = useState(false);
  const paused = useSolar((s) => s.paused);
  const daysPerSecond = useSolar((s) => s.daysPerSecond);
  const showLabels = useSolar((s) => s.showLabels);
  const showTrails = useSolar((s) => s.showTrails);
  const showOrbits = useSolar((s) => s.showOrbits);
  const showBelt = useSolar((s) => s.showBelt);
  const showPluto = useSolar((s) => s.showPluto);
  const lowPower = useSolar((s) => s.lowPower);
  const bodyScale = useSolar((s) => s.bodyScale);
  const selectedId = useSolar((s) => s.selectedId);
  const dateLabel = useSolar((s) => s.dateLabel);
  const liveDistance = useSolar((s) => s.liveDistance);
  const liveSpeed = useSolar((s) => s.liveSpeed);

  useEffect(() => {
    loadSolarSettings();
    bootSim();
    useSolar.getState().patchLive({
      dateLabel: formatJulian(sim.jd),
      liveDistance: useSolar.getState().liveDistance,
      liveSpeed: useSolar.getState().liveSpeed,
    });
  }, []);

  useEffect(() => {
    saveSolarSettings();
  }, [daysPerSecond, showLabels, showTrails, showOrbits, showBelt, showPluto, lowPower, bodyScale]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (useSolar.getState().selectedId) useSolar.getState().clearSelection();
        setOpen(false);
      }
      if (event.key === " " && event.target === document.body) {
        event.preventDefault();
        useSolar.getState().setPaused(!useSolar.getState().paused);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || !selectedId) return;
    document.getElementById("helios-facts")?.scrollIntoView({ block: "nearest" });
  }, [open, selectedId]);

  const selected = selectedId ? BODIES[selectedId] : null;
  const worlds = WORLD_ORDER.filter((id) => showPluto || id !== "pluto");

  return (
    <>
      <SkyLabels />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-4"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex max-w-full flex-col items-center gap-2">
          <div className="max-w-full min-w-0 rounded-lg border border-border bg-surface px-4 py-2 text-center">
            <p className="truncate font-display text-sm text-fg tabular-nums sm:text-base">
              {dateLabel}
              <span className="text-muted"> · {formatMultiplier(daysPerSecond)}</span>
            </p>
            <p className="text-sm text-muted">
              {paused && selected ? `Paused · ${selected.name}` : paused ? "Paused" : selected ? selected.name : "Tap a world"}
            </p>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-lg text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-label="Slower"
              onClick={() => useSolar.getState().setDaysPerSecond(stepRate(useSolar.getState().daysPerSecond, -1))}
            >
              −
            </button>
            <button
              type="button"
              className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-pressed={paused}
              aria-label={paused ? "Play simulation" : "Pause simulation"}
              onClick={() => useSolar.getState().setPaused(!paused)}
            >
              {paused ? <Play className="size-5" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="flex size-12 items-center justify-center rounded-full border border-border bg-surface text-lg text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              aria-label="Faster"
              onClick={() => useSolar.getState().setDaysPerSecond(stepRate(useSolar.getState().daysPerSecond, 1))}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-center px-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {open && (
          <section
            id="helios-menu"
            className="menu-panel menu-scroll pointer-events-auto mb-3 w-full max-w-md overflow-x-hidden overflow-y-auto rounded-xl border border-border bg-surface p-3"
            style={{ maxHeight: "min(72dvh, 40rem)" }}
            aria-label="Orrery menu"
          >
            <header className="px-2 pt-2 pb-4">
              <h1 className="font-display text-xl text-fg">Helios</h1>
              <p className="mt-1 text-sm leading-relaxed text-muted">The Solar System, on this device.</p>
            </header>

            <div className="flex flex-col px-2">
              <h2 className="pt-2 pb-1 text-sm text-subtle">Simulation</h2>
              <ToggleRow
                id="pause"
                label="Pause"
                checked={paused}
                onCheckedChange={(value) => useSolar.getState().setPaused(value)}
              />
              <SliderBlock
                id="speed"
                label="Speed"
                min={0}
                max={1000}
                step={1}
                value={rateToSlider(daysPerSecond)}
                display={`${formatMultiplier(daysPerSecond)} · ${formatRate(daysPerSecond)}`}
                onValueChange={(value) => useSolar.getState().setDaysPerSecond(sliderToRate(value))}
              />
              <SliderBlock
                id="globe-size"
                label="Globe size"
                min={0.7}
                max={1.8}
                step={0.01}
                value={bodyScale}
                display={`${bodyScale.toFixed(2)}× viewing scale`}
                onValueChange={(value) => useSolar.getState().setBodyScale(value)}
              />
              <button
                type="button"
                className="mt-2 min-h-11 rounded-sm border border-border bg-surface-2 px-3 text-base text-fg"
                onClick={() => useSolar.getState().goToToday()}
              >
                Set to today
              </button>
            </div>

            <article id="helios-facts" className="mt-5 rounded-lg bg-surface-2 p-4">
              {selected ? (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <h2 className="font-display text-xl text-fg">{selected.name}</h2>
                    <p className="text-base leading-relaxed text-muted">{selected.summary}</p>
                  </div>
                  {liveDistance && (
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm text-muted">Right now</h3>
                      <p className="text-base leading-relaxed text-fg tabular-nums">{liveDistance}</p>
                      {liveSpeed && <p className="text-base leading-relaxed text-fg tabular-nums">{liveSpeed}</p>}
                    </div>
                  )}
                  <dl className="flex flex-col gap-5">
                    {staticFacts(selected.id).map((row) => (
                      <div key={row.label} className="flex flex-col gap-1">
                        <dt className="text-sm text-muted">{row.label}</dt>
                        <dd className="text-base leading-relaxed break-words text-fg">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    className="min-h-11 rounded-sm border border-border px-3 text-base text-fg"
                    onClick={() => useSolar.getState().clearSelection()}
                  >
                    Release camera
                  </button>
                </div>
              ) : (
                <p className="text-base leading-relaxed text-muted">
                  Tap a planet in the sky, or choose one below. The camera eases in and keeps following it.
                </p>
              )}
            </article>

            <div className="mt-5 flex flex-col px-2">
              <h2 className="pb-1 text-sm text-subtle">Display</h2>
              <ToggleRow
                id="labels"
                label="Labels"
                checked={showLabels}
                onCheckedChange={(value) => useSolar.getState().setShowLabels(value)}
              />
              <ToggleRow
                id="orbits"
                label="Orbit lines"
                checked={showOrbits}
                onCheckedChange={(value) => useSolar.getState().setShowOrbits(value)}
              />
              <ToggleRow
                id="trails"
                label="Trails"
                checked={showTrails}
                onCheckedChange={(value) => useSolar.getState().setShowTrails(value)}
              />
              <ToggleRow
                id="belt"
                label="Asteroid belt"
                checked={showBelt}
                onCheckedChange={(value) => useSolar.getState().setShowBelt(value)}
              />
              <ToggleRow
                id="pluto"
                label="Pluto"
                checked={showPluto}
                onCheckedChange={(value) => useSolar.getState().setShowPluto(value)}
              />
              <ToggleRow
                id="low-power"
                label="Low-power mode"
                checked={lowPower}
                onCheckedChange={(value) => useSolar.getState().setLowPower(value)}
              />
            </div>

            <div className="mt-6 px-2">
              <h2 className="pb-2 text-sm text-subtle">Worlds</h2>
              <ul className="flex flex-col">
                {worlds.map((id) => (
                  <li key={id}>
                    <WorldButton id={id} selected={selectedId === id} />
                  </li>
                ))}
              </ul>
            </div>

            <footer className="flex flex-col gap-3 px-2 pt-5 pb-2">
              <p className="text-sm leading-relaxed text-muted">
                Motion uses JPL Keplerian elements (3000 BCE–3000 CE) solved with Kepler’s equation, plus a
                low-precision lunar series. Physical figures are from the NASA Planetary Fact Sheet (18 March 2025).
                Distances and sizes on screen are compressed so the inner planets stay visible.
              </p>
              <p className="text-sm leading-relaxed text-muted">
                Nothing is sent off this device. After the first open, the orrery runs offline.
              </p>
              <Link to="/privacy" className="min-h-11 text-base text-fg underline-offset-4">
                Privacy
              </Link>
            </footer>
          </section>
        )}

        <button
          type="button"
          className="pointer-events-auto flex size-14 items-center justify-center rounded-full border border-border bg-surface text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          aria-expanded={open}
          aria-controls="helios-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <MoreHorizontal className="size-6" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

function WorldButton({ id, selected }: { id: BodyId; selected: boolean }) {
  const body = BODIES[id];
  return (
    <button
      type="button"
      data-planet={id}
      aria-pressed={selected}
      className={`flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-left ${selected ? "bg-bg" : ""}`}
      onClick={() => useSolar.getState().select(id)}
    >
      <span className="size-3 shrink-0 rounded-full" style={{ background: body.tint }} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-base text-fg">{body.name}</span>
      <span className="shrink-0 text-sm text-subtle">{body.kind}</span>
    </button>
  );
}
