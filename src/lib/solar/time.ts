const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Civil UTC date from a Julian Date. Valid across the Gregorian reform. */
export function formatJulian(jd: number): string {
  if (!Number.isFinite(jd)) return "—";
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const dayFloat = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  if (!Number.isFinite(year) || Math.abs(year) > 999999) {
    return `JD ${jd.toFixed(1)}`;
  }
  let day = Math.floor(dayFloat);
  let minutes = Math.round((dayFloat - day) * 1440);
  if (minutes >= 1440) {
    minutes = 0;
    day += 1;
  }
  if (minutes < 0) minutes = 0;
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${day} ${MONTHS[month - 1] ?? "?"} ${year}  ${pad(hh)}:${pad(mm)} UTC`;
}

export function unixToJd(ms: number): number {
  return ms / 86400000 + 2440587.5;
}

export function formatMultiplier(daysPerSecond: number): string {
  if (!Number.isFinite(daysPerSecond) || daysPerSecond <= 0) return "0×";
  if (daysPerSecond < 10) {
    const digits = daysPerSecond < 1 ? 2 : 1;
    return `${daysPerSecond.toFixed(digits)}×`;
  }
  return `${Math.round(daysPerSecond)}×`;
}

export const SPEED_STEPS = [1, 2, 5, 10, 20, 50, 100, 250, 500];

export function stepRate(current: number, direction: -1 | 1): number {
  if (direction > 0) {
    return SPEED_STEPS.find((step) => step > current + 0.05) ?? SPEED_STEPS[SPEED_STEPS.length - 1];
  }
  return [...SPEED_STEPS].reverse().find((step) => step < current - 0.05) ?? SPEED_STEPS[0];
}

export function formatRate(daysPerSecond: number): string {
  if (daysPerSecond < 1) {
    return `${(daysPerSecond * 24).toFixed(1)} hours / sec`;
  }
  if (daysPerSecond < 365.25) {
    const n = daysPerSecond < 10 ? daysPerSecond.toFixed(1) : Math.round(daysPerSecond).toString();
    return `${n} days / sec`;
  }
  const years = daysPerSecond / 365.25;
  if (years < 10) return `${years.toFixed(1)} years / sec`;
  return `${Math.round(years)} years / sec`;
}

const RATE_MIN = Math.log(1);
const RATE_MAX = Math.log(500);

export function rateToSlider(daysPerSecond: number): number {
  const t = (Math.log(Math.min(Math.max(daysPerSecond, 1), 500)) - RATE_MIN) / (RATE_MAX - RATE_MIN);
  return Math.round(t * 1000);
}

export function sliderToRate(slider: number): number {
  const t = Math.min(1, Math.max(0, slider / 1000));
  return Math.exp(RATE_MIN + (RATE_MAX - RATE_MIN) * t);
}
