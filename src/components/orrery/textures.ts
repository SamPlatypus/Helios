import * as THREE from "three";
import type { BodyId } from "@/lib/solar/catalog";

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number): number {
  let t = 0;
  let a = 0.5;
  for (let i = 0; i < 5; i++) {
    t += a * vnoise(x, y);
    x *= 2.05;
    y *= 2.05;
    a *= 0.5;
  }
  return t;
}

function canvas(size = 512): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size / 2;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  return { canvas: c, ctx };
}

function textureFrom(c: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function shade(ctx: CanvasRenderingContext2D, w: number, h: number, paint: (x: number, y: number, lon: number, lat: number) => string) {
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const lat = 90 - (y / (h - 1)) * 180;
    for (let x = 0; x < w; x++) {
      const lon = -180 + (x / (w - 1)) * 360;
      const hex = paint(x, y, lon, lat);
      const n = (y * w + x) * 4;
      img.data[n] = parseInt(hex.slice(1, 3), 16);
      img.data[n + 1] = parseInt(hex.slice(3, 5), 16);
      img.data[n + 2] = parseInt(hex.slice(5, 7), 16);
      img.data[n + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const u = Math.min(1, Math.max(0, t));
  const r = Math.round(p(a, 1) + (p(b, 1) - p(a, 1)) * u);
  const g = Math.round(p(a, 3) + (p(b, 3) - p(a, 3)) * u);
  const bl = Math.round(p(a, 5) + (p(b, 5) - p(a, 5)) * u);
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(bl)}`;
}

function rocky(base: string, dark: string, light: string, seed: number, caps = false): HTMLCanvasElement {
  const { canvas: c, ctx } = canvas(384);
  shade(ctx, c.width, c.height, (_x, _y, lon, lat) => {
    const n = fbm(lon * 0.02 + seed, lat * 0.03);
    const n2 = fbm(lon * 0.06 + 4, lat * 0.08 + seed);
    let color = mix(dark, base, n);
    color = mix(color, light, n2 * 0.45);
    if (caps && Math.abs(lat) > 62) {
      const cap = Math.min(1, (Math.abs(lat) - 62) / 22);
      color = mix(color, "#f4f1ea", cap * (0.55 + n2 * 0.3));
    }
    return color;
  });
  return c;
}

function earthCanvas(): HTMLCanvasElement {
  const { canvas: c, ctx } = canvas(512);
  const blobs: Array<[number, number, number, number]> = [
    [-100, 48, 34, 16],
    [-112, 26, 16, 12],
    [-90, 14, 9, 16],
    [-62, -12, 15, 28],
    [-68, -42, 9, 10],
    [18, 6, 20, 28],
    [8, 32, 10, 8],
    [24, -26, 11, 9],
    [12, 52, 16, 9],
    [55, 48, 28, 14],
    [95, 32, 32, 16],
    [100, 62, 22, 8],
    [78, 22, 12, 11],
    [112, 6, 16, 10],
    [134, -24, 15, 11],
    [-42, 73, 11, 7],
  ];
  const land = (lon: number, lat: number) => {
    for (const [blo, bla, rx, ry] of blobs) {
      let dlon = lon - blo;
      if (dlon > 180) dlon -= 360;
      if (dlon < -180) dlon += 360;
      const dx = dlon / rx;
      const dy = (lat - bla) / ry;
      if (dx * dx + dy * dy < 1) return true;
    }
    return false;
  };
  shade(ctx, c.width, c.height, (_x, _y, lon, lat) => {
    const n = fbm(lon * 0.02 + 1.4, lat * 0.03);
    const n2 = fbm(lon * 0.055 + 8, lat * 0.06);
    const isLand = land(lon + (n - 0.5) * 16, lat + (n2 - 0.5) * 8);
    let color = mix("#163e72", "#2a629c", n2);
    if (isLand) {
      const dry = Math.abs(lat) < 28 && n2 > 0.48;
      const forest = Math.abs(lat) > 28 && Math.abs(lat) < 62;
      color = dry ? mix("#c4a56a", "#8d7040", n) : forest ? mix("#3d6a38", "#7d9550", n2) : mix("#6d8a48", "#c2b48a", n);
    }
    if (Math.abs(lat) > 68) color = mix(color, "#f4f2ec", (Math.abs(lat) - 68) / 18);
    if (!isLand && n2 > 0.74) color = mix(color, "#e4eef3", (n2 - 0.74) * 1.6);
    return color;
  });
  return c;
}

function sunCanvas(): HTMLCanvasElement {
  const { canvas: c, ctx } = canvas(256);
  shade(ctx, c.width, c.height, (_x, _y, lon, lat) => {
    const n = fbm(lon * 0.03 + 2, lat * 0.05);
    const n2 = fbm(lon * 0.08, lat * 0.09 + 3);
    let color = mix("#f6d48a", "#fff1d0", n);
    color = mix(color, "#e09040", n2 * 0.55);
    if (Math.abs(lat) < 8) color = mix(color, "#ffe7b0", 0.25);
    return color;
  });
  return c;
}

function banded(stops: string[], spot?: { lat: number; lon: number; color: string }): HTMLCanvasElement {
  const { canvas: c, ctx } = canvas(512);
  shade(ctx, c.width, c.height, (_x, _y, lon, lat) => {
    const bands = stops.length;
    const t = (Math.sin(lat * 0.18) * 0.5 + 0.5) * (bands - 1);
    const i = Math.min(bands - 2, Math.floor(t));
    const wobble = fbm(lon * 0.02, lat * 0.15) * 0.35;
    let color = mix(stops[i] ?? stops[0], stops[i + 1] ?? stops[i] ?? stops[0], t - i + wobble * 0.15);
    if (spot) {
      const dLat = lat - spot.lat;
      const dLon = Math.min(Math.abs(lon - spot.lon), 360 - Math.abs(lon - spot.lon));
      const d = Math.hypot(dLon * 0.55, dLat * 1.6);
      if (d < 14) color = mix(color, spot.color, 1 - d / 14);
    }
    return color;
  });
  return c;
}

function ringCanvas(gap: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  const img = ctx.createImageData(8, 256);
  for (let y = 0; y < 256; y++) {
    const v = y / 255;
    let alpha = 210;
    let r = 214;
    let g = 196;
    let b = 160;
    const grain = hash(y, 3);
    r = Math.round(r + (grain - 0.5) * 30);
    g = Math.round(g + (grain - 0.5) * 24);
    b = Math.round(b + (grain - 0.5) * 16);
    if (gap && v > 0.62 && v < 0.68) alpha = 18;
    if (v < 0.04 || v > 0.97) alpha = 0;
    if (gap && v > 0.78 && v < 0.8) alpha = 70;
    for (let x = 0; x < 8; x++) {
      const n = (y * 8 + x) * 4;
      img.data[n] = r;
      img.data[n + 1] = g;
      img.data[n + 2] = b;
      img.data[n + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, "rgba(255, 246, 226, 0.95)");
  g.addColorStop(0.22, "rgba(255, 214, 150, 0.38)");
  g.addColorStop(0.55, "rgba(255, 170, 80, 0.08)");
  g.addColorStop(1, "rgba(255, 160, 60, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export type OrreryTextures = {
  maps: Partial<Record<BodyId, THREE.CanvasTexture>>;
  saturnRing: THREE.CanvasTexture;
  faintRing: THREE.CanvasTexture;
  glow: THREE.CanvasTexture;
  dispose: () => void;
};

let cached: OrreryTextures | null = null;

export function getTextures(): OrreryTextures {
  if (cached) return cached;
  const maps: Partial<Record<BodyId, THREE.CanvasTexture>> = {
    sun: textureFrom(sunCanvas()),
    mercury: textureFrom(rocky("#b7b1a8", "#8d887f", "#d4cfc6", 1)),
    venus: textureFrom(banded(["#e7d7ae", "#f0e2bf", "#d9c396", "#ead8b0"])),
    earth: textureFrom(earthCanvas()),
    moon: textureFrom(rocky("#c5c2bb", "#9a968e", "#ddd9d2", 4)),
    mars: textureFrom(rocky("#c4653d", "#8d3c24", "#d88962", 2, true)),
    jupiter: textureFrom(
      banded(["#e6d3b0", "#c9a36e", "#f0e2c4", "#b88858", "#e4c99a", "#d7b48a"], {
        lat: -22,
        lon: 40,
        color: "#b85a45",
      }),
    ),
    saturn: textureFrom(banded(["#f0e4c4", "#e2d0a4", "#f6edd4", "#d9c59a", "#efe0b8"])),
    uranus: textureFrom(banded(["#d5efec", "#b7ddd8", "#c9e6e4", "#a9d4d2"])),
    neptune: textureFrom(banded(["#2c4e9e", "#3f62b5", "#27468f", "#4d74c4", "#33569f"])),
    pluto: textureFrom(rocky("#cbb8a0", "#9c8874", "#e4d5c2", 6, true)),
  };
  const saturnRing = ringCanvas(true);
  const faintRing = ringCanvas(false);
  const glow = glowTexture();
  cached = {
    maps,
    saturnRing,
    faintRing,
    glow,
    dispose: () => {
      Object.values(maps).forEach((t) => t?.dispose());
      saturnRing.dispose();
      faintRing.dispose();
      glow.dispose();
      cached = null;
    },
  };
  return cached;
}
