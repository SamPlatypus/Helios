/** Physical constants shown in the info card.
 *  Distances and bulk properties: NASA Planetary Fact Sheet (metric), 18 March 2025.
 *  Moon counts are that sheet's snapshot (Saturn 274, Jupiter 95). */

export type BodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export type Kind = "Star" | "Planet" | "Satellite" | "Dwarf planet";

export type FactBody = {
  id: BodyId;
  name: string;
  kind: Kind;
  /** Trail / orbit tint. Scene colour, not interface chrome. */
  tint: string;
  summary: string;
  diameterKm: number;
  massLabel: string;
  gravityMs2: string;
  solarDay: string;
  siderealSpin: string;
  /** Hours. Negative = retrograde. Sun uses equatorial sidereal period. */
  spinHours: number;
  obliquityDeg: number;
  moons: string;
  rings: boolean;
  meanMillionKm: number | null;
  periMillionKm: number | null;
  aphMillionKm: number | null;
  periodDays: number | null;
  eccentricity: string | null;
  inclinationDeg: string | null;
  temperature: string;
  pressure: string | null;
};

export const WORLD_ORDER: BodyId[] = [
  "sun",
  "mercury",
  "venus",
  "earth",
  "moon",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];

export const BODIES: Record<BodyId, FactBody> = {
  sun: {
    id: "sun",
    name: "Sun",
    kind: "Star",
    tint: "#f3e2c0",
    summary:
      "A G2V star. Planets are drawn on a compressed distance scale so the inner worlds stay visible; the numbers here stay physical.",
    diameterKm: 1_391_400,
    massLabel: "1.9885 × 10³⁰ kg",
    gravityMs2: "274",
    solarDay: "—",
    siderealSpin: "About 25 Earth days at the equator",
    spinHours: 609,
    obliquityDeg: 7.25,
    moons: "—",
    rings: false,
    meanMillionKm: null,
    periMillionKm: null,
    aphMillionKm: null,
    periodDays: null,
    eccentricity: null,
    inclinationDeg: null,
    temperature: "5,772 K effective",
    pressure: null,
  },
  mercury: {
    id: "mercury",
    name: "Mercury",
    kind: "Planet",
    tint: "#b7b1a8",
    summary: "Airless and cratered. A 3:2 spin-orbit resonance stretches one solar day to 176 Earth days.",
    diameterKm: 4879,
    massLabel: "0.330 × 10²⁴ kg",
    gravityMs2: "3.7",
    solarDay: "4222.6 hours",
    siderealSpin: "1407.6 hours",
    spinHours: 1407.6,
    obliquityDeg: 0.034,
    moons: "0",
    rings: false,
    meanMillionKm: 57.9,
    periMillionKm: 46.0,
    aphMillionKm: 69.8,
    periodDays: 88.0,
    eccentricity: "0.206",
    inclinationDeg: "7.0°",
    temperature: "167 °C mean",
    pressure: "0 bar",
  },
  venus: {
    id: "venus",
    name: "Venus",
    kind: "Planet",
    tint: "#e4d2a4",
    summary: "A dense carbon-dioxide atmosphere over a volcanic surface. The spin is retrograde and slower than the year.",
    diameterKm: 12104,
    massLabel: "4.87 × 10²⁴ kg",
    gravityMs2: "8.9",
    solarDay: "2802.0 hours",
    siderealSpin: "Retrograde, 5832.5 hours",
    spinHours: 5832.5,
    obliquityDeg: 177.4,
    moons: "0",
    rings: false,
    meanMillionKm: 108.2,
    periMillionKm: 107.5,
    aphMillionKm: 108.9,
    periodDays: 224.7,
    eccentricity: "0.007",
    inclinationDeg: "3.4°",
    temperature: "464 °C mean",
    pressure: "92 bars",
  },
  earth: {
    id: "earth",
    name: "Earth",
    kind: "Planet",
    tint: "#6ea0d0",
    summary: "Liquid water, a nitrogen atmosphere, and one large moon. The orbit drawn is the Earth–Moon barycenter.",
    diameterKm: 12756,
    massLabel: "5.97 × 10²⁴ kg",
    gravityMs2: "9.8",
    solarDay: "24.0 hours",
    siderealSpin: "23.9 hours",
    spinHours: 23.9,
    obliquityDeg: 23.4,
    moons: "1",
    rings: false,
    meanMillionKm: 149.6,
    periMillionKm: 147.1,
    aphMillionKm: 152.1,
    periodDays: 365.2,
    eccentricity: "0.017",
    inclinationDeg: "0.0°",
    temperature: "15 °C mean",
    pressure: "1 bar",
  },
  moon: {
    id: "moon",
    name: "Moon",
    kind: "Satellite",
    tint: "#c8c5be",
    summary:
      "Tidally locked to Earth. The globe is placed on a widened orbit so it does not sit inside Earth; distances below are the true geocentric range.",
    diameterKm: 3475,
    massLabel: "0.073 × 10²⁴ kg",
    gravityMs2: "1.6",
    solarDay: "708.7 hours",
    siderealSpin: "655.7 hours",
    spinHours: 655.7,
    obliquityDeg: 6.7,
    moons: "0",
    rings: false,
    meanMillionKm: 0.384,
    periMillionKm: 0.363,
    aphMillionKm: 0.406,
    periodDays: 27.3,
    eccentricity: "0.055",
    inclinationDeg: "5.1°",
    temperature: "−20 °C mean",
    pressure: "0 bar",
  },
  mars: {
    id: "mars",
    name: "Mars",
    kind: "Planet",
    tint: "#c4653d",
    summary: "A cold desert with a thin carbon-dioxide atmosphere, polar caps, and two small moons.",
    diameterKm: 6792,
    massLabel: "0.642 × 10²⁴ kg",
    gravityMs2: "3.7",
    solarDay: "24.7 hours",
    siderealSpin: "24.6 hours",
    spinHours: 24.6,
    obliquityDeg: 25.2,
    moons: "2",
    rings: false,
    meanMillionKm: 228.0,
    periMillionKm: 206.7,
    aphMillionKm: 249.3,
    periodDays: 687.0,
    eccentricity: "0.094",
    inclinationDeg: "1.8°",
    temperature: "−65 °C mean",
    pressure: "0.01 bar",
  },
  jupiter: {
    id: "jupiter",
    name: "Jupiter",
    kind: "Planet",
    tint: "#d2b48c",
    summary: "The most massive planet, mostly hydrogen and helium, with a strong magnetic field and a faint ring.",
    diameterKm: 142984,
    massLabel: "1898 × 10²⁴ kg",
    gravityMs2: "23.1",
    solarDay: "9.9 hours",
    siderealSpin: "9.9 hours",
    spinHours: 9.9,
    obliquityDeg: 3.1,
    moons: "95",
    rings: true,
    meanMillionKm: 778.5,
    periMillionKm: 740.6,
    aphMillionKm: 816.4,
    periodDays: 4331,
    eccentricity: "0.049",
    inclinationDeg: "1.3°",
    temperature: "−110 °C mean",
    pressure: null,
  },
  saturn: {
    id: "saturn",
    name: "Saturn",
    kind: "Planet",
    tint: "#e6d7b0",
    summary: "A hydrogen giant with the brightest ring system. The rings are equatorial, so they share the planet’s tilt.",
    diameterKm: 120536,
    massLabel: "568 × 10²⁴ kg",
    gravityMs2: "9.0",
    solarDay: "10.7 hours",
    siderealSpin: "10.7 hours",
    spinHours: 10.7,
    obliquityDeg: 26.7,
    moons: "274",
    rings: true,
    meanMillionKm: 1432.0,
    periMillionKm: 1357.6,
    aphMillionKm: 1506.5,
    periodDays: 10747,
    eccentricity: "0.052",
    inclinationDeg: "2.5°",
    temperature: "−140 °C mean",
    pressure: null,
  },
  uranus: {
    id: "uranus",
    name: "Uranus",
    kind: "Planet",
    tint: "#b7ddd8",
    summary: "An ice giant tipped on its side. The spin is retrograde and the faint rings follow that tilt.",
    diameterKm: 51118,
    massLabel: "86.8 × 10²⁴ kg",
    gravityMs2: "8.7",
    solarDay: "17.2 hours",
    siderealSpin: "Retrograde, 17.2 hours",
    spinHours: 17.2,
    obliquityDeg: 97.8,
    moons: "28",
    rings: true,
    meanMillionKm: 2867.0,
    periMillionKm: 2732.7,
    aphMillionKm: 3001.4,
    periodDays: 30589,
    eccentricity: "0.047",
    inclinationDeg: "0.8°",
    temperature: "−195 °C mean",
    pressure: null,
  },
  neptune: {
    id: "neptune",
    name: "Neptune",
    kind: "Planet",
    tint: "#3f62b5",
    summary: "The outer ice giant. Methane in the atmosphere gives the deep blue colour. Faint rings and strong winds.",
    diameterKm: 49528,
    massLabel: "102 × 10²⁴ kg",
    gravityMs2: "11.0",
    solarDay: "16.1 hours",
    siderealSpin: "16.1 hours",
    spinHours: 16.1,
    obliquityDeg: 28.3,
    moons: "16",
    rings: true,
    meanMillionKm: 4515.0,
    periMillionKm: 4471.1,
    aphMillionKm: 4558.9,
    periodDays: 59800,
    eccentricity: "0.010",
    inclinationDeg: "1.8°",
    temperature: "−200 °C mean",
    pressure: null,
  },
  pluto: {
    id: "pluto",
    name: "Pluto",
    kind: "Dwarf planet",
    tint: "#cbb8a0",
    summary:
      "A Kuiper-belt dwarf planet on an inclined, eccentric orbit that crosses Neptune’s. Shown from a separate J2000 element fit.",
    diameterKm: 2376,
    massLabel: "0.0130 × 10²⁴ kg",
    gravityMs2: "0.7",
    solarDay: "153.3 hours",
    siderealSpin: "Retrograde, 153.3 hours",
    spinHours: 153.3,
    obliquityDeg: 119.5,
    moons: "5",
    rings: false,
    meanMillionKm: 5906.4,
    periMillionKm: 4436.8,
    aphMillionKm: 7375.9,
    periodDays: 90560,
    eccentricity: "0.244",
    inclinationDeg: "17.2°",
    temperature: "−225 °C mean",
    pressure: "10⁻⁵ bar",
  },
};

/** Viewing scale. Radial only, so inclination and the shape of each ellipse survive.
 *  Exponent 0.4 keeps Neptune inside a phone-width frame once the camera is pulled back,
 *  without letting the Sun swallow Mercury. */
export function auToWorld(au: number): number {
  if (!(au > 0)) return 0;
  return Math.pow(au, 0.4) * 14;
}

export function visualRadius(id: BodyId, bodyScale: number): number {
  if (id === "sun") return 3.15 * bodyScale;
  const ratio = BODIES[id].diameterKm / BODIES.earth.diameterKm;
  return Math.max(0.72, 1.35 * Math.pow(ratio, 0.38)) * bodyScale;
}

export type RingSpec = { inner: number; outer: number; opacity: number };

export function ringSpec(id: BodyId): RingSpec | null {
  if (id === "saturn") return { inner: 1.22, outer: 2.32, opacity: 0.95 };
  if (id === "jupiter") return { inner: 1.48, outer: 1.82, opacity: 0.2 };
  if (id === "uranus") return { inner: 1.5, outer: 2.05, opacity: 0.45 };
  if (id === "neptune") return { inner: 1.55, outer: 1.92, opacity: 0.22 };
  return null;
}

const KM_PER_AU = 149.6;

export function millionKmLabel(millionKm: number): string {
  if (millionKm < 1) {
    const km = millionKm * 1_000_000;
    return `${Math.round(km).toLocaleString("en-US")} km`;
  }
  const au = millionKm / KM_PER_AU;
  return `${millionKm.toLocaleString("en-US", { maximumFractionDigits: 1 })} million km · ${au.toFixed(3)} AU`;
}

export function periodLabel(days: number): string {
  if (days < 400) return `${days.toLocaleString("en-US")} Earth days`;
  const years = days / 365.2;
  return `${days.toLocaleString("en-US")} Earth days · ${years.toFixed(years < 20 ? 2 : 1)} years`;
}

export type FactRow = { label: string; value: string };

export function staticFacts(id: BodyId): FactRow[] {
  const b = BODIES[id];
  const rows: FactRow[] = [{ label: "Kind", value: b.kind }];
  if (b.meanMillionKm != null) {
    rows.push({
      label: id === "moon" ? "Mean distance from Earth" : "Mean distance",
      value: millionKmLabel(b.meanMillionKm),
    });
  }
  if (b.periMillionKm != null) {
    rows.push({
      label: id === "moon" ? "Perigee" : "Perihelion",
      value: millionKmLabel(b.periMillionKm),
    });
  }
  if (b.aphMillionKm != null) {
    rows.push({
      label: id === "moon" ? "Apogee" : "Aphelion",
      value: millionKmLabel(b.aphMillionKm),
    });
  }
  if (b.periodDays != null) {
    rows.push({
      label: id === "moon" ? "Sidereal month" : "Orbital period",
      value: periodLabel(b.periodDays),
    });
  }
  if (b.eccentricity) rows.push({ label: "Eccentricity", value: b.eccentricity });
  if (b.inclinationDeg) rows.push({ label: "Inclination", value: b.inclinationDeg });
  rows.push(
    { label: "Equatorial diameter", value: `${b.diameterKm.toLocaleString("en-US")} km` },
    { label: "Mass", value: b.massLabel },
    { label: "Surface gravity", value: `${b.gravityMs2} m/s²` },
    { label: "Solar day", value: b.solarDay },
    { label: "Sidereal rotation", value: b.siderealSpin },
    { label: "Axial tilt", value: `${b.obliquityDeg}°` },
    { label: "Known moons", value: b.moons },
    { label: "Rings", value: b.rings ? "Yes" : "No" },
    { label: "Temperature", value: b.temperature },
  );
  if (b.pressure) rows.push({ label: "Surface pressure", value: b.pressure });
  if (!b.pressure && (id === "jupiter" || id === "saturn" || id === "uranus" || id === "neptune")) {
    rows.push({ label: "Surface", value: "No solid surface" });
  }
  return rows;
}
