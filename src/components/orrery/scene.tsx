import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  BODIES,
  WORLD_ORDER,
  auToWorld,
  ringSpec,
  visualRadius,
  type BodyId,
} from "@/lib/solar/catalog";
import { beltEcliptic, moonGeocentric, moonSpeedKms, sampleOrbit, sampleSystem, solarSpeedKms } from "@/lib/solar/ephemeris";
import { sim, bootSim } from "@/lib/solar/sim";
import { useSolar } from "@/lib/solar/store";
import { formatJulian } from "@/lib/solar/time";
import { getTextures, type OrreryTextures } from "./textures";

const TRAIL = 140;
const ORBIT_STEPS = 192;

type Trail = { pos: Float32Array; col: Float32Array; count: number; lastM: number; epoch: number };

function eclipticToWorld(x: number, y: number, z: number, target: THREE.Vector3) {
  const r = Math.hypot(x, y, z);
  const w = auToWorld(r);
  if (r < 1e-10) {
    target.set(0, 0, 0);
    return;
  }
  const s = w / r;
  target.set(x * s, z * s, -y * s);
}

const worldPos: Record<BodyId, THREE.Vector3> = {
  sun: new THREE.Vector3(),
  mercury: new THREE.Vector3(),
  venus: new THREE.Vector3(),
  earth: new THREE.Vector3(),
  moon: new THREE.Vector3(),
  mars: new THREE.Vector3(),
  jupiter: new THREE.Vector3(),
  saturn: new THREE.Vector3(),
  uranus: new THREE.Vector3(),
  neptune: new THREE.Vector3(),
  pluto: new THREE.Vector3(),
};

const sunMat = new THREE.MeshBasicMaterial({ color: "#fff1d4" });
sunMat.toneMapped = false;

function makeLitMaterial(map: THREE.Texture) {
  const mat = new THREE.MeshBasicMaterial({ map });
  mat.toneMapped = false;
  return mat;
}

function Stars() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 1400;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 900 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} raycast={() => null}>
      <pointsMaterial color="#e7edf6" size={2.1} sizeAttenuation={false} depthWrite={false} />
    </points>
  );
}

function Belt() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 6, 5), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#8a8176" }), []);
  const rocks = useMemo(() => {
    let s = 0x51ed;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    return Array.from({ length: 220 }, () => ({
      a: 2.15 + rnd() * 1.15,
      i: (rnd() - 0.5) * 14,
      node: rnd() * Math.PI * 2,
      angle: rnd() * Math.PI * 2,
      n: 0,
    })).map((rock) => ({ ...rock, n: (0.9856 / Math.pow(rock.a, 1.5)) * DEG }));
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, rawDt) => {
    const belt = mesh.current;
    if (!belt) return;
    const show = useSolar.getState().showBelt;
    belt.visible = show;
    if (!show) return;
    const dt = Math.min(rawDt, 0.1);
    const days = useSolar.getState().paused ? 0 : useSolar.getState().daysPerSecond * dt;
    rocks.forEach((rock, index) => {
      rock.angle += rock.n * days;
      const ecl = beltEcliptic(rock.a, rock.i, rock.angle, rock.node);
      eclipticToWorld(ecl.x, ecl.y, ecl.z, dummy.position);
      const scale = 0.1 + (index % 5) * 0.035;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      belt.setMatrixAt(index, dummy.matrix);
    });
    belt.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geo, mat, rocks.length]} frustumCulled={false} raycast={() => null} />;
}

const scratch = new THREE.Vector3();
const DEG = Math.PI / 180;

type Nodes = {
  root: THREE.Group;
  globe: THREE.Object3D;
  reticle: THREE.Mesh;
  hit: THREE.Mesh;
  ring: THREE.Mesh | null;
};

function BodyView({
  id,
  textures,
  register,
}: {
  id: BodyId;
  textures: OrreryTextures;
  register: (id: BodyId, nodes: Nodes | null) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const globe = useRef<THREE.Mesh>(null);
  const reticle = useRef<THREE.Mesh>(null);
  const hit = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const body = BODIES[id];
  const rings = ringSpec(id);
  const material = useMemo(() => {
    if (id === "sun") {
      sunMat.map = textures.maps.sun ?? null;
      sunMat.needsUpdate = true;
      return sunMat;
    }
    const map = textures.maps[id];
    return map ? makeLitMaterial(map) : sunMat;
  }, [id, textures]);

  useEffect(() => {
    if (!root.current || !globe.current || !reticle.current || !hit.current) return;
    const nodes: Nodes = {
      root: root.current,
      globe: globe.current,
      reticle: reticle.current,
      hit: hit.current,
      ring: ring.current,
    };
    register(id, nodes);
    return () => register(id, null);
  }, [id, register]);

  useEffect(() => {
    return () => {
      if (id !== "sun") material.dispose();
    };
  }, [id, material]);

  return (
    <group ref={root}>
      <group rotation={[body.obliquityDeg * DEG, 0, 0]}>
        <mesh ref={globe} material={material} renderOrder={2} frustumCulled={false} raycast={() => null}>
          <sphereGeometry args={[1, id === "sun" ? 40 : 36, id === "sun" ? 28 : 24]} />
          {id === "earth" && (
            <mesh scale={1.06} raycast={() => null}>
              <sphereGeometry args={[1, 28, 20]} />
              <meshBasicMaterial color="#9ebef0" transparent opacity={0.14} side={THREE.BackSide} depthWrite={false} />
            </mesh>
          )}
          {id === "venus" && (
            <mesh scale={1.04} raycast={() => null}>
              <sphereGeometry args={[1, 28, 20]} />
              <meshBasicMaterial color="#f0e2c0" transparent opacity={0.18} side={THREE.BackSide} depthWrite={false} />
            </mesh>
          )}
          {id === "sun" && (
            <sprite scale={[3.6, 3.6, 1]} renderOrder={3} raycast={() => null}>
              <spriteMaterial
                map={textures.glow}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
          )}
        </mesh>
        {rings && (
          <mesh ref={ring} rotation-x={-Math.PI / 2} raycast={() => null}>
            <ringGeometry args={[rings.inner, rings.outer, 96]} />
            <meshBasicMaterial
              map={id === "saturn" ? textures.saturnRing : textures.faintRing}
              color={id === "saturn" ? "#f0e2c4" : "#c5d5d2"}
              side={THREE.DoubleSide}
              transparent
              opacity={rings.opacity}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
      <mesh ref={reticle} rotation-x={-Math.PI / 2} visible={false} raycast={() => null}>
        <ringGeometry args={[1.35, 1.5, 48]} />
        <meshBasicMaterial color="#e6e8ee" transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={hit} renderOrder={1} frustumCulled={false}
        onClick={(event) => {
          event.stopPropagation();
          useSolar.getState().select(id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} colorWrite={false} />
      </mesh>
    </group>
  );
}

function OrbitLines({ texturesReady }: { texturesReady: boolean }) {
  const lines = useRef<Partial<Record<BodyId, THREE.LineLoop>>>({});
  const builtAt = useRef(-1);
  const lastBuild = useRef(0);

  const setRef = (id: BodyId) => (node: THREE.LineLoop | null) => {
    if (node) lines.current[id] = node;
    else delete lines.current[id];
  };

  useFrame(() => {
    if (!texturesReady) return;
    const state = useSolar.getState();
    const bucket = Math.floor(sim.jd / 20);
    const now = performance.now();
    if (bucket !== builtAt.current && now - lastBuild.current > 350) {
      builtAt.current = bucket;
      lastBuild.current = now;
      WORLD_ORDER.forEach((id) => {
        if (id === "sun" || id === "moon") return;
        const line = lines.current[id];
        if (!line) return;
        const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
        const samples = sampleOrbit(id, sim.jd, ORBIT_STEPS);
        const arr = attr.array as Float32Array;
        samples.forEach((p, i) => {
          eclipticToWorld(p.x, p.y, p.z, scratch);
          arr[i * 3] = scratch.x;
          arr[i * 3 + 1] = scratch.y;
          arr[i * 3 + 2] = scratch.z;
        });
        attr.needsUpdate = true;
      });
    }
    WORLD_ORDER.forEach((id) => {
      const line = lines.current[id];
      if (!line) return;
      const hidden = id === "pluto" && !state.showPluto;
      line.visible = state.showOrbits && !hidden;
    });
  });

  return (
    <>
      {WORLD_ORDER.filter((id) => id !== "sun" && id !== "moon").map((id) => (
        <OrbitPath key={id} id={id} lineRef={setRef(id)} />
      ))}
    </>
  );
}

function OrbitPath({
  id,
  lineRef,
}: {
  id: BodyId;
  lineRef: (node: THREE.LineLoop | null) => void;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ORBIT_STEPS * 3), 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineLoop ref={lineRef} geometry={geometry} frustumCulled={false} raycast={() => null}>
      <lineBasicMaterial color={BODIES[id].tint} transparent opacity={0.62} depthWrite={false} />
    </lineLoop>
  );
}

function TrailPath({ lineRef }: { id: BodyId; lineRef: (node: THREE.Line | null) => void }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);
  const material = useMemo(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false }),
    [],
  );
  const line = useMemo(() => {
    const object = new THREE.Line(geometry, material);
    object.frustumCulled = false;
    object.raycast = () => null;
    return object;
  }, [geometry, material]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return <primitive object={line} ref={lineRef} />;
}

function MoonPath({ lineRef }: { lineRef: RefObject<THREE.LineLoop | null> }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(64 * 3), 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineLoop ref={lineRef} geometry={geometry} frustumCulled={false} raycast={() => null}>
      <lineBasicMaterial color="#c8c5be" transparent opacity={0.45} depthWrite={false} />
    </lineLoop>
  );
}
function Simulator({ nodes }: { nodes: RefObject<Map<BodyId, Nodes>> }) {
  const trails = useRef<Partial<Record<BodyId, Trail>>>({});
  const trailLines = useRef<Partial<Record<BodyId, THREE.Line>>>({});
  const moonOrbit = useRef<THREE.LineLoop>(null);
  const uiTick = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const moonTmp = useMemo(() => new THREE.Vector3(), []);
  const proj = useMemo(() => new THREE.Vector3(), []);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const setTrail = (id: BodyId) => (node: THREE.Line | null) => {
    if (node) trailLines.current[id] = node;
    else delete trailLines.current[id];
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    bootSim();
    const state = useSolar.getState();
    if (!state.paused) sim.jd += state.daysPerSecond * dt;
    const sample = sampleSystem(sim.jd);
    const scale = state.bodyScale;

    const place = (id: BodyId, ecl: { x: number; y: number; z: number; r: number }) => {
      eclipticToWorld(ecl.x, ecl.y, ecl.z, worldPos[id]);
    };
    WORLD_ORDER.forEach((id) => {
      if (id === "moon") return;
      place(id, sample.ecl[id]);
    });

    const earthR = visualRadius("earth", scale);
    const moonRing = Math.max(earthR * 2.85, 2.6);
    const moonDir = moonTmp;
    eclipticToWorld(
      sample.ecl.moon.x - sample.ecl.earth.x,
      sample.ecl.moon.y - sample.ecl.earth.y,
      sample.ecl.moon.z - sample.ecl.earth.z,
      moonDir,
    );
    if (moonDir.lengthSq() < 1e-8) moonDir.set(1, 0, 0);
    moonDir.normalize().multiplyScalar(moonRing);
    worldPos.moon.copy(worldPos.earth).add(moonDir);

    sim.moonKm = sample.moonKm;
    WORLD_ORDER.forEach((id) => {
      if (id === "sun") {
        sim.au.sun = 0;
        sim.speed.sun = 0;
        return;
      }
      if (id === "moon") {
        sim.au.moon = sample.moonKm / 149597870.7;
        sim.speed.moon = moonSpeedKms(sample.moonKm);
        return;
      }
      sim.au[id] = sample.ecl[id].r;
      const a = sample.aAu[id] ?? sample.ecl[id].r;
      sim.speed[id] = solarSpeedKms(sample.ecl[id].r, a);
    });

    const persp = camera as THREE.PerspectiveCamera;
    const halfFov = ((persp.isPerspectiveCamera ? persp.fov : 42) * Math.PI) / 360;
    const pxScale = (2 * Math.tan(halfFov)) / Math.max(1, size.height);

    nodes.current.forEach((node, id) => {
      const hidden = id === "pluto" && !state.showPluto;
      node.root.visible = !hidden;
      node.root.position.copy(worldPos[id]);
      const distance = Math.max(0.5, camera.position.distanceTo(worldPos[id]));
      const worldPerPx = pxScale * distance;
      const minPx = id === "sun" ? 36 : id === "moon" ? 10 : 18;
      let nearest = Infinity;
      WORLD_ORDER.forEach((other) => {
        if (other === id) return;
        if (other === "pluto" && !state.showPluto) return;
        nearest = Math.min(nearest, worldPos[id].distanceTo(worldPos[other]));
      });
      const minRadius = (minPx * worldPerPx) / 2;
      let radius = Math.max(visualRadius(id, scale), minRadius);
      if (id !== "sun" && Number.isFinite(nearest)) {
        radius = Math.min(radius, Math.max(minRadius * 0.75, nearest * 0.48));
      }
      node.globe.scale.setScalar(radius);
      if (node.ring) node.ring.scale.setScalar(radius);
      const turns = (sim.jd * 24) / BODIES[id].spinHours;
      node.globe.rotation.y = turns * Math.PI * 2;
      node.reticle.visible = state.selectedId === id && !hidden;
      node.reticle.scale.setScalar(Math.max(radius * 1.9, 0.7));
      const minWorld = worldPerPx * 28;
      const base = id === "sun" ? radius * 1.3 : Math.max(radius * 1.55, 0.85);
      const cap = Number.isFinite(nearest) ? nearest * 0.46 : minWorld;
      node.hit.scale.setScalar(Math.min(Math.max(base, minWorld), Math.max(base, cap)));
    });

    if (moonOrbit.current) {
      moonOrbit.current.visible = state.showOrbits;
      moonOrbit.current.position.copy(worldPos.earth);
      const attr = moonOrbit.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      const steps = 64;
      const period = 27.321661;
      for (let i = 0; i < steps; i++) {
        const geo = moonGeocentric(sim.jd + (i / steps) * period);
        eclipticToWorld(geo.x, geo.y, geo.z, scratch);
        if (scratch.lengthSq() < 1e-8) scratch.set(moonRing, 0, 0);
        else scratch.normalize().multiplyScalar(moonRing);
        arr[i * 3] = scratch.x;
        arr[i * 3 + 1] = scratch.y;
        arr[i * 3 + 2] = scratch.z;
      }
      attr.needsUpdate = true;
    }

    WORLD_ORDER.forEach((id) => {
      if (id === "sun") return;
      let trail = trails.current[id];
      if (!trail) {
        trail = {
          pos: new Float32Array(TRAIL * 3),
          col: new Float32Array(TRAIL * 3),
          count: 0,
          lastM: Number.NaN,
          epoch: sim.trailEpoch,
        };
        trails.current[id] = trail;
      }
      if (trail.epoch !== sim.trailEpoch) {
        trail.count = 0;
        trail.lastM = Number.NaN;
        trail.epoch = sim.trailEpoch;
      }
      const line = trailLines.current[id];
      const hidden = id === "pluto" && !state.showPluto;
      if (line) line.visible = state.showTrails && !hidden && trail.count > 1;
      const pos = worldPos[id];
      const moved = Number.isNaN(trail.lastM) || pos.distanceToSquared(tmp.set(trail.pos[(trail.count - 1) * 3] || 0, trail.pos[(trail.count - 1) * 3 + 1] || 0, trail.pos[(trail.count - 1) * 3 + 2] || 0)) > 0.04;
      if (!state.paused && moved) {
        pushTrail(trail, pos.x, pos.y, pos.z, BODIES[id].tint);
        trail.lastM = 0;
      }
      if (line && trail.count > 1) {
        const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
        const col = line.geometry.getAttribute("color") as THREE.BufferAttribute;
        (attr.array as Float32Array).set(trail.pos);
        (col.array as Float32Array).set(trail.col);
        attr.needsUpdate = true;
        col.needsUpdate = true;
        line.geometry.setDrawRange(0, trail.count);
      }
    });

    camera.updateMatrixWorld();
    nodes.current.forEach((node, id) => {
      const hidden = id === "pluto" && !state.showPluto;
      proj.copy(worldPos[id]);
      proj.applyMatrix4(camera.matrixWorldInverse);
      const inFront = proj.z < 0;
      proj.applyMatrix4(camera.projectionMatrix);
      sim.screen[id] = {
        x: (proj.x * 0.5 + 0.5) * size.width,
        y: (-proj.y * 0.5 + 0.5) * size.height,
        on: inFront && proj.x > -1.08 && proj.x < 1.08 && proj.y > -1.08 && proj.y < 1.08 && !hidden && node.root.visible,
      };
    });

    uiTick.current += dt;
    if (uiTick.current > 1) {
      uiTick.current = 0;
      const selected = state.selectedId;
      let liveDistance: string | null = null;
      let liveSpeed: string | null = null;
      if (selected === "sun") {
        liveDistance = "Center of the system";
        liveSpeed = null;
      } else if (selected === "moon") {
        liveDistance = `${Math.round(sim.moonKm).toLocaleString("en-US")} km from Earth`;
        liveSpeed = sim.speed.moon ? `${sim.speed.moon.toFixed(2)} km/s around Earth` : null;
      } else if (selected) {
        const au = sim.au[selected];
        const kms = sim.speed[selected];
        if (au != null) {
          liveDistance = `${au.toFixed(3)} AU from the Sun · ${(au * 149.6).toFixed(1)} million km`;
        }
        if (kms != null) liveSpeed = `${kms.toFixed(2)} km/s`;
      }
      state.patchLive({
        dateLabel: formatJulian(sim.jd),
        liveDistance,
        liveSpeed,
      });
    }
  }, -20);

  return (
    <>
      <MoonPath lineRef={moonOrbit} />
      {WORLD_ORDER.filter((id) => id !== "sun").map((id) => (
        <TrailPath key={id} id={id} lineRef={setTrail(id)} />
      ))}
    </>
  );
}

function pushTrail(trail: Trail, x: number, y: number, z: number, hex: string) {
  if (trail.count < TRAIL) {
    const i = trail.count * 3;
    trail.pos[i] = x;
    trail.pos[i + 1] = y;
    trail.pos[i + 2] = z;
    trail.count += 1;
  } else {
    trail.pos.copyWithin(0, 3);
    const i = (TRAIL - 1) * 3;
    trail.pos[i] = x;
    trail.pos[i + 1] = y;
    trail.pos[i + 2] = z;
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  for (let i = 0; i < trail.count; i++) {
    const f = ((i + 1) / trail.count) ** 1.4;
    trail.col[i * 3] = r * f;
    trail.col[i * 3 + 1] = g * f;
    trail.col[i * 3 + 2] = b * f;
  }
}

function CameraRig({ controls }: { controls: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera);
  const focus = useRef<BodyId | null>(null);
  const acquire = useRef(0);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const controlsRef = controls.current;
    if (!controlsRef) return;
    const id = useSolar.getState().selectedId;
    if (!id) {
      focus.current = null;
      return;
    }
    const pos = worldPos[id];
    if (focus.current !== id) {
      focus.current = id;
      acquire.current = 1;
      offset.copy(camera.position).sub(controlsRef.target);
      const radius = visualRadius(id, useSolar.getState().bodyScale);
      const dist = Math.max(radius * 7, 7.5);
      if (offset.lengthSq() < 1e-6) offset.set(dist * 0.2, dist * 0.45, dist);
      offset.setLength(dist);
      desired.copy(offset);
    }
    offset.copy(camera.position).sub(controlsRef.target);
    if (acquire.current > 0) {
      acquire.current = Math.max(0, acquire.current - dt * 0.7);
      offset.lerp(desired, 1 - Math.exp(-3.4 * dt));
    }
    controlsRef.target.copy(pos);
    camera.position.copy(pos).add(offset);
    controlsRef.update();
  });

  return null;
}

function InitialFrame() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const framed = useRef(false);

  useEffect(() => {
    if (framed.current) return;
    if (size.width < 2 || size.height < 2) return;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const portrait = size.height > size.width;
    camera.fov = portrait ? 52 : 40;
    camera.position.set(0, portrait ? 220 : 156, portrait ? 300 : 214);
    camera.near = 0.08;
    camera.far = 2200;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    framed.current = true;
  }, [camera, size.width, size.height]);

  return null;
}

function PixelMode() {
  const gl = useThree((s) => s.gl);
  const lowPower = useSolar((s) => s.lowPower);
  useEffect(() => {
    const full = Math.min(window.devicePixelRatio || 1, 1.5);
    gl.setPixelRatio(lowPower ? 1 : full);
  }, [gl, lowPower]);
  return null;
}

function SceneContents() {
  const textures = useMemo(() => getTextures(), []);
  const nodes = useRef(new Map<BodyId, Nodes>());
  const controls = useRef<OrbitControlsImpl>(null);
  const register = useMemo(() => {
    return (id: BodyId, node: Nodes | null) => {
      if (node) nodes.current.set(id, node);
      else nodes.current.delete(id);
    };
  }, []);

  useEffect(() => {
    bootSim();
    const publish = () => {
      window.__helios = {
        jd: () => sim.jd,
        earthAu: () => sim.au.earth ?? null,
        bodyCount: () => nodes.current.size,
      };
    };
    publish();
    return () => {
      textures.dispose();
      sunMat.map = null;
      delete window.__helios;
    };
  }, [textures]);

  return (
    <>
      <color attach="background" args={["#07080c"]} />
      <PixelMode />
      <InitialFrame />
      <Stars />
      <Belt />
      {WORLD_ORDER.map((id) => (
        <BodyView key={id} id={id} textures={textures} register={register} />
      ))}
      <OrbitLines texturesReady />
      <Simulator nodes={nodes} />
      <CameraRig controls={controls} />
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={1100}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI - 0.12}
        rotateSpeed={0.75}
        zoomSpeed={0.85}
      />
    </>
  );
}

declare global {
  interface Window {
    __helios?: {
      jd: () => number;
      earthAu: () => number | null;
      bodyCount: () => number;
    };
  }
}

export function OrreryScene() {
  return (
    <Canvas
      camera={{ position: [0, 220, 300], fov: 52, near: 0.08, far: 2200 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor("#07080c", 1);
        gl.toneMapping = THREE.NoToneMapping;
        camera.lookAt(0, 0, 0);
      }}
      onPointerMissed={() => {
        if (useSolar.getState().selectedId) useSolar.getState().setFactsOpen(false);
      }}
    >
      <SceneContents />
    </Canvas>
  );
}
