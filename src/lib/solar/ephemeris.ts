/** Heliocentric ecliptic coordinates of date, J2000 mean ecliptic.
 *  Major planets: JPL approximate Keplerian elements, 3000 BC–3000 AD fit
 *  (ssd.jpl.nasa.gov/planets/approx_pos.html), including Table 2b terms for
 *  Jupiter–Neptune. The eccentricity column is dimensionless (the sheet marks
 *  it "rad" because the series treats e as a small angle).
 *  Moon: truncated Meeus low-precision series (Astronomical Algorithms, ch. 47).
 *  Pluto: separate J2000 mean elements in the same angle convention; not on the JPL planet sheet.
 */

import type { BodyId } from "./catalog";

const DEG = Math.PI / 180;
const J2000 = 2451545.0;

export type Ecliptic = { x: number; y: number; z: number; r: number };

type Elem = {
  a0: number;
  ad: number;
  e0: number;
  ed: number;
  I0: number;
  Id: number;
  L0: number;
  Ld: number;
  w0: number;
  wd: number;
  O0: number;
  Od: number;
  /** Extra mean-anomaly terms: b T² + c cos(fT) + s sin(fT), degrees. */
  b?: number;
  c?: number;
  s?: number;
  f?: number;
};

const PLANETS: Record<Exclude<BodyId, "sun" | "moon">, Elem> = {
  mercury: {
    a0: 0.38709843,
    ad: 0,
    e0: 0.20563661,
    ed: 0.00002123,
    I0: 7.00559432,
    Id: -0.00590158,
    L0: 252.25166724,
    Ld: 149472.67486623,
    w0: 77.45771895,
    wd: 0.15940013,
    O0: 48.33961819,
    Od: -0.12214182,
  },
  venus: {
    a0: 0.72332102,
    ad: -0.00000026,
    e0: 0.00676399,
    ed: -0.00005107,
    I0: 3.39777545,
    Id: 0.00043494,
    L0: 181.9797085,
    Ld: 58517.8156026,
    w0: 131.76755713,
    wd: 0.05679648,
    O0: 76.67261496,
    Od: -0.27274174,
  },
  earth: {
    a0: 1.00000018,
    ad: -0.00000003,
    e0: 0.01673163,
    ed: -0.00003661,
    I0: -0.00054346,
    Id: -0.01337178,
    L0: 100.46691572,
    Ld: 35999.37306329,
    w0: 102.93005885,
    wd: 0.3179526,
    O0: -5.11260389,
    Od: -0.24123856,
  },
  mars: {
    a0: 1.52371243,
    ad: 0.00000097,
    e0: 0.09336511,
    ed: 0.00009149,
    I0: 1.85181869,
    Id: -0.00724757,
    L0: -4.56813164,
    Ld: 19140.29934243,
    w0: -23.91744784,
    wd: 0.45223625,
    O0: 49.71320984,
    Od: -0.26852431,
  },
  jupiter: {
    a0: 5.20248019,
    ad: -0.00002864,
    e0: 0.0485359,
    ed: 0.00018026,
    I0: 1.29861416,
    Id: -0.00322699,
    L0: 34.33479152,
    Ld: 3034.90371757,
    w0: 14.27495244,
    wd: 0.18199196,
    O0: 100.29282654,
    Od: 0.13024619,
    b: -0.00012452,
    c: 0.0606406,
    s: -0.35635438,
    f: 38.35125,
  },
  saturn: {
    a0: 9.54149883,
    ad: -0.00003065,
    e0: 0.05550825,
    ed: -0.00032044,
    I0: 2.49424102,
    Id: 0.00451969,
    L0: 50.07571329,
    Ld: 1222.11494724,
    w0: 92.86136063,
    wd: 0.54179478,
    O0: 113.63998702,
    Od: -0.25015002,
    b: 0.00025899,
    c: -0.13434469,
    s: 0.87320147,
    f: 38.35125,
  },
  uranus: {
    a0: 19.18797948,
    ad: -0.00020455,
    e0: 0.0468574,
    ed: -0.0000155,
    I0: 0.77298127,
    Id: -0.00180155,
    L0: 314.20276625,
    Ld: 428.49512595,
    w0: 172.43404441,
    wd: 0.09266985,
    O0: 73.96250215,
    Od: 0.05739699,
    b: 0.00058331,
    c: -0.97731848,
    s: 0.17689245,
    f: 7.67025,
  },
  neptune: {
    a0: 30.06952752,
    ad: 0.00006447,
    e0: 0.00895439,
    ed: 0.00000818,
    I0: 1.7700552,
    Id: 0.000224,
    L0: 304.22289287,
    Ld: 218.46515314,
    w0: 46.68158724,
    wd: 0.01009938,
    O0: 131.78635853,
    Od: -0.00606302,
    b: -0.00041348,
    c: 0.68346318,
    s: -0.10162547,
    f: 7.67025,
  },
  pluto: {
    a0: 39.48211675,
    ad: -0.00031596,
    e0: 0.2488273,
    ed: 0.0000517,
    I0: 17.14001206,
    Id: 0.00004818,
    L0: 238.92903833,
    Ld: 145.20780515,
    w0: 224.06891629,
    wd: -0.04062942,
    O0: 110.30393684,
    Od: -0.01183482,
  },
};

function wrap360(deg: number): number {
  const w = deg % 360;
  return w < 0 ? w + 360 : w;
}

function solveKepler(M: number, e: number): number {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 12; i++) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const d = f / fp;
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

/** Ecliptic heliocentric position in AU for a Keplerian ellipse at Julian date. */
export function keplerEcliptic(el: Elem, jd: number): Ecliptic & { a: number } {
  const T = (jd - J2000) / 36525;
  const a = el.a0 + el.ad * T;
  let e = el.e0 + el.ed * T;
  if (e < 0) e = 0;
  if (e > 0.99) e = 0.99;
  const I = (el.I0 + el.Id * T) * DEG;
  const p = (el.w0 + el.wd * T) * DEG;
  const O = (el.O0 + el.Od * T) * DEG;
  let Mdeg = el.L0 + el.Ld * T - (el.w0 + el.wd * T);
  if (el.f != null && el.b != null && el.c != null && el.s != null) {
    const ft = el.f * T * DEG;
    Mdeg += el.b * T * T + el.c * Math.cos(ft) + el.s * Math.sin(ft);
  }
  const M = wrap360(Mdeg) * DEG;
  const E = solveKepler(M, e);
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const xp = a * (cosE - e);
  const yp = a * Math.sqrt(1 - e * e) * sinE;
  const w = p - O;
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosO = Math.cos(O);
  const sinO = Math.sin(O);
  const cosI = Math.cos(I);
  const sinI = Math.sin(I);
  const x = (cosW * cosO - sinW * sinO * cosI) * xp + (-sinW * cosO - cosW * sinO * cosI) * yp;
  const y = (cosW * sinO + sinW * cosO * cosI) * xp + (-sinW * sinO + cosW * cosO * cosI) * yp;
  const z = sinW * sinI * xp + cosW * sinI * yp;
  return { x, y, z, r: Math.hypot(x, y, z), a };
}

/** Sample one orbit at the elements of `jd` (mean anomaly stepped, other elements fixed). */
export function sampleOrbit(id: Exclude<BodyId, "sun" | "moon">, jd: number, steps: number): Ecliptic[] {
  const el = PLANETS[id];
  const T = (jd - J2000) / 36525;
  const a = el.a0 + el.ad * T;
  let e = el.e0 + el.ed * T;
  if (e < 0) e = 0;
  const I = (el.I0 + el.Id * T) * DEG;
  const p = (el.w0 + el.wd * T) * DEG;
  const O = (el.O0 + el.Od * T) * DEG;
  const w = p - O;
  const cosW = Math.cos(w);
  const sinW = Math.sin(w);
  const cosO = Math.cos(O);
  const sinO = Math.sin(O);
  const cosI = Math.cos(I);
  const sinI = Math.sin(I);
  const out: Ecliptic[] = [];
  for (let i = 0; i < steps; i++) {
    const E = (i / steps) * Math.PI * 2;
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const x = (cosW * cosO - sinW * sinO * cosI) * xp + (-sinW * cosO - cosW * sinO * cosI) * yp;
    const y = (cosW * sinO + sinW * cosO * cosI) * xp + (-sinW * sinO + cosW * cosO * cosI) * yp;
    const z = sinW * sinI * xp + cosW * sinI * yp;
    out.push({ x, y, z, r: Math.hypot(x, y, z) });
  }
  return out;
}

export function planetEcliptic(id: Exclude<BodyId, "sun" | "moon">, jd: number): Ecliptic & { a: number } {
  return keplerEcliptic(PLANETS[id], jd);
}

/** Low-precision geocentric ecliptic position of the Moon. Distance in kilometres. */
export function moonGeocentric(jd: number): Ecliptic & { distKm: number } {
  const T = (jd - J2000) / 36525;
  const rad = (deg: number) => wrap360(deg) * DEG;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
  let lon =
    Lp +
    6.288774 * Math.sin(rad(Mp)) +
    1.274027 * Math.sin(rad(2 * D - Mp)) +
    0.658314 * Math.sin(rad(2 * D)) +
    0.213618 * Math.sin(rad(2 * Mp)) -
    0.185116 * Math.sin(rad(M)) -
    0.114332 * Math.sin(rad(2 * F)) +
    0.058793 * Math.sin(rad(2 * D - 2 * Mp)) +
    0.057066 * Math.sin(rad(2 * D - M - Mp)) +
    0.053322 * Math.sin(rad(2 * D + Mp)) +
    0.045758 * Math.sin(rad(2 * D - M));
  const lat =
    5.128122 * Math.sin(rad(F)) +
    0.280602 * Math.sin(rad(Mp + F)) +
    0.277693 * Math.sin(rad(Mp - F)) +
    0.173237 * Math.sin(rad(2 * D - F)) +
    0.055413 * Math.sin(rad(2 * D - Mp + F)) +
    0.046271 * Math.sin(rad(2 * D - Mp - F));
  const distKm =
    385000.56 -
    20905.355 * Math.cos(rad(Mp)) -
    3699.111 * Math.cos(rad(2 * D - Mp)) -
    2955.968 * Math.cos(rad(2 * D)) -
    569.925 * Math.cos(rad(2 * Mp));
  const lam = rad(lon);
  const bet = lat * DEG;
  const au = distKm / 149597870.7;
  const cb = Math.cos(bet);
  const x = au * cb * Math.cos(lam);
  const y = au * cb * Math.sin(lam);
  const z = au * Math.sin(bet);
  return { x, y, z, r: au, distKm };
}

/** Moon's share of the Earth–Moon mass, from the NASA mass ratios. */
const MOON_MASS_FRACTION = 0.0123 / 1.0123;

export type SystemSample = {
  /** Ecliptic AU, heliocentric. Sun is the origin. */
  ecl: Record<BodyId, Ecliptic>;
  /** Semi-major axis in AU where it applies. */
  aAu: Partial<Record<BodyId, number>>;
  moonKm: number;
};

export function sampleSystem(jd: number): SystemSample {
  const ecl = {} as Record<BodyId, Ecliptic>;
  const aAu: Partial<Record<BodyId, number>> = {};
  ecl.sun = { x: 0, y: 0, z: 0, r: 0 };
  (Object.keys(PLANETS) as (keyof typeof PLANETS)[]).forEach((id) => {
    const p = planetEcliptic(id, jd);
    ecl[id] = p;
    aAu[id] = p.a;
  });
  const moon = moonGeocentric(jd);
  const emb = ecl.earth;
  // Shift Earth off the barycenter and place the Moon on the far side.
  ecl.earth = {
    x: emb.x - moon.x * MOON_MASS_FRACTION,
    y: emb.y - moon.y * MOON_MASS_FRACTION,
    z: emb.z - moon.z * MOON_MASS_FRACTION,
    r: 0,
  };
  ecl.earth.r = Math.hypot(ecl.earth.x, ecl.earth.y, ecl.earth.z);
  ecl.moon = {
    x: ecl.earth.x + moon.x,
    y: ecl.earth.y + moon.y,
    z: ecl.earth.z + moon.z,
    r: 0,
  };
  ecl.moon.r = Math.hypot(ecl.moon.x, ecl.moon.y, ecl.moon.z);
  aAu.moon = 384400 / 149597870.7;
  return { ecl, aAu, moonKm: moon.distKm };
}

/** Circular-ish belt rock in ecliptic AU. `angle` is mean longitude in radians. */
export function beltEcliptic(a: number, iDeg: number, angle: number, node: number): Ecliptic {
  const i = iDeg * DEG;
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);
  const u = angle;
  const xp = a * Math.cos(u);
  const yp = a * Math.sin(u);
  const cosO = Math.cos(node);
  const sinO = Math.sin(node);
  const x = cosO * xp - sinO * cosI * yp;
  const y = sinO * xp + cosO * cosI * yp;
  const z = sinI * yp;
  return { x, y, z, r: Math.hypot(x, y, z) };
}

/** Vis-viva speed around the Sun, km/s. Earth-circular calibration 29.78 km/s. */
export function solarSpeedKms(rAu: number, aAu: number): number {
  if (!(rAu > 0) || !(aAu > 0)) return 0;
  const term = 2 / rAu - 1 / aAu;
  if (term <= 0) return 0;
  return 29.7846917 * Math.sqrt(term);
}

/** Speed of the Moon about Earth, km/s. */
export function moonSpeedKms(distKm: number): number {
  const r = distKm * 1000;
  const A = 384400 * 1000;
  const GM = 3.986004418e14;
  const term = 2 / r - 1 / A;
  if (term <= 0) return 0;
  return Math.sqrt(GM * term) / 1000;
}
