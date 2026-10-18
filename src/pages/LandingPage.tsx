import React, { useEffect, useRef, useState, useMemo, Suspense } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text as DreiText, Edges, Billboard, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ThermometerSun,
  Droplets,
  Waves,
  Navigation,
  Wind,
} from "lucide-react";
import Logo from "../assets/logo.svg";
import satelliteSrc from "../assets/images/satellite-wireframe.svg";
import argoSrc from "../assets/images/argo-float.svg";

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

interface ScrollFlyInProps {
  children: React.ReactNode;
  from?: "left" | "right" | "bottom";
  delay?: number;
  threshold?: number;
  style?: React.CSSProperties;
}

const ScrollFlyIn: React.FC<ScrollFlyInProps> = ({ children, from = "bottom", delay = 0, threshold = 0.1, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const initialTransform =
    from === "left"
      ? "translate3d(-28px, 0, 0)"
      : from === "right"
      ? "translate3d(28px, 0, 0)"
      : "translate3d(0, 32px, 0)";

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translate3d(0, 0, 0)" : initialTransform,
        transition: "opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        willChange: isVisible ? undefined : "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const WireframeGlobeScene: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;

      // Very slow, soothing, calm ambient rotation
      groupRef.current.rotation.y = t * 0.035 + scrollY * 0.0004;
      groupRef.current.rotation.x = 0.18 + Math.sin(t * 0.02) * 0.02;

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const baseX = isMobile ? 0 : 0.85;
      const baseY = isMobile ? -0.25 : 0.05;

      groupRef.current.position.x = lerp(baseX, 0.45, clamp(scrollY / 1400, 0, 1));
      groupRef.current.position.y = lerp(baseY, -0.65, clamp(scrollY / 1400, 0, 1));
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 6, 5]} intensity={0.8} color="#38bdf8" />
      <pointLight position={[-5, -4, -2]} intensity={0.4} color="#0284c7" />

      <group ref={groupRef} position={[0.85, 0.05, -0.3]}>
        {/* Soft, dark occlusion core to mask backfacing wireframe lines cleanly */}
        <mesh>
          <sphereGeometry args={[2.28, 40, 40]} />
          <meshStandardMaterial
            color="#06182c"
            roughness={0.85}
            metalness={0.1}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Minimal, elegant wireframe sphere - delicate, calm, non-distracting */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[2.31, 28, 28]} />
          <meshBasicMaterial
            color="#38bdf8"
            wireframe
            transparent
            opacity={0.22}
          />
        </mesh>
      </group>
    </>
  );
};

// ─── Dashboard-Replicated Reconstruction Visualizer ────────────────────────────
// Replicates ObservationModal, DepthModal, and ValidationMetricsDisplay exactly.

const MOCK_SURFACE_TRENDS: Record<string, { date: string; value: number }[]> = {
  SST: [
    { date: 'Dec 02', value: 29.1 },
    { date: 'Dec 04', value: 29.3 },
    { date: 'Dec 06', value: 29.2 },
    { date: 'Dec 08', value: 29.6 },
    { date: 'Dec 10', value: 29.5 },
    { date: 'Dec 12', value: 29.8 },
    { date: 'Dec 14', value: 29.7 },
    { date: 'Dec 15', value: 29.4 },
  ],
  SSS: [
    { date: 'Dec 02', value: 35.1 },
    { date: 'Dec 04', value: 35.15 },
    { date: 'Dec 06', value: 35.2 },
    { date: 'Dec 08', value: 35.18 },
    { date: 'Dec 10', value: 35.22 },
    { date: 'Dec 12', value: 35.25 },
    { date: 'Dec 14', value: 35.21 },
    { date: 'Dec 15', value: 35.2 },
  ],
  SSH: [
    { date: 'Dec 02', value: 0.12 },
    { date: 'Dec 04', value: 0.14 },
    { date: 'Dec 06', value: 0.16 },
    { date: 'Dec 08', value: 0.15 },
    { date: 'Dec 10', value: 0.19 },
    { date: 'Dec 12', value: 0.21 },
    { date: 'Dec 14', value: 0.2 },
    { date: 'Dec 15', value: 0.18 },
  ],
  Currents: [
    { date: 'Dec 02', value: 1.15 },
    { date: 'Dec 04', value: 1.22 },
    { date: 'Dec 06', value: 1.28 },
    { date: 'Dec 08', value: 1.35 },
    { date: 'Dec 10', value: 1.42 },
    { date: 'Dec 12', value: 1.4 },
    { date: 'Dec 14', value: 1.36 },
    { date: 'Dec 15', value: 1.38 },
  ],
  Winds: [
    { date: 'Dec 02', value: 5.2 },
    { date: 'Dec 04', value: 5.8 },
    { date: 'Dec 06', value: 6.5 },
    { date: 'Dec 08', value: 7.1 },
    { date: 'Dec 10', value: 6.8 },
    { date: 'Dec 12', value: 6.2 },
    { date: 'Dec 14', value: 6.0 },
    { date: 'Dec 15', value: 6.4 },
  ],
};

const STANDARD_DEPTHS_LIST = [
  { depth: 0, temp: 29.4 },
  { depth: 5, temp: 29.3 },
  { depth: 10, temp: 29.1 },
  { depth: 20, temp: 28.7 },
  { depth: 30, temp: 28.2 },
  { depth: 50, temp: 27.0 },
  { depth: 75, temp: 25.1 },
  { depth: 100, temp: 22.8 },
  { depth: 125, temp: 19.4 },
  { depth: 150, temp: 16.5 },
  { depth: 200, temp: 13.8 },
  { depth: 300, temp: 11.2 },
  { depth: 500, temp: 8.4 },
  { depth: 700, temp: 6.2 },
  { depth: 1000, temp: 4.8 },
];

const getColorForTemp = (temp: number): THREE.Color => {
  const colorHot = new THREE.Color('#ffa500'); // Orange for warm (30°C)
  const colorCold = new THREE.Color('#4b0082'); // Indigo for cold (4°C)
  // Map roughly 4°C - 30°C to 0 - 1
  const ratio = Math.min(Math.max((temp - 4) / 26, 0), 1);
  return colorCold.clone().lerp(colorHot, ratio);
};

const CanvasResizeSynchronizer = () => {
  const { gl, camera } = useThree();
  useEffect(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) return;
    const updateSize = () => {
      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        gl.setSize(rect.width, rect.height, false);
        if ('aspect' in camera) {
          (camera as THREE.PerspectiveCamera).aspect = rect.width / rect.height;
          camera.updateProjectionMatrix();
        }
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [gl, camera]);
  return null;
};

const roundedRectShape = (() => {
  const w = 5.6, h = 5.6, r = 0.4;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w / 2, h / 2 - r);
  shape.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
})();

interface SubsurfaceLayerMeshProps {
  depth: number;
  temp: number;
}

const SubsurfaceLayerMesh: React.FC<SubsurfaceLayerMeshProps> = ({ depth, temp }) => {
  // Use logarithmic scale matching DepthModal.tsx to smoothly separate shallow layers
  const normalizedDepth = Math.log(depth / 40 + 1) / Math.log(1000 / 40 + 1);
  const yPos = 2.7 - (normalizedDepth * 5.5);
  const color = useMemo(() => getColorForTemp(temp), [temp]);

  return (
    <group position={[0, yPos, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[roundedRectShape]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.68}
          roughness={0.18}
          metalness={0.1}
          clearcoat={0.9}
          clearcoatRoughness={0.15}
          side={THREE.DoubleSide}
        />
        <Edges linewidth={1} color="#ffffff" transparent opacity={0.28} />
      </mesh>

      {/* Depth billboard text label on left-front corner */}
      <group position={[-3.1, 0, 3.1]}>
        <Billboard>
          <DreiText
            fontSize={0.24}
            color="#ffffff"
            fillOpacity={0.95}
            fontWeight={600}
            anchorX="right"
            anchorY="middle"
          >
            {`${depth}m`}
          </DreiText>
        </Billboard>
      </group>

      {/* Temperature billboard text label on right corner */}
      <group position={[3.1, 0, 0]}>
        <Billboard>
          <DreiText
            fontSize={0.24}
            color="#8bb6d6"
            fillOpacity={0.95}
            fontWeight={600}
            anchorX="left"
            anchorY="middle"
          >
            {`${temp.toFixed(1)}°C`}
          </DreiText>
        </Billboard>
      </group>
    </group>
  );
};

const Subsurface3DProfileModel: React.FC = () => {
  return (
    <group position={[-0.2, 0, 0]}>
      {STANDARD_DEPTHS_LIST.map((pred) => (
        <SubsurfaceLayerMesh
          key={pred.depth}
          depth={pred.depth}
          temp={pred.temp}
        />
      ))}
    </group>
  );
};

const getViridisColor = (t: number): THREE.Color => {
  const stops = [
    { p: 0.0, c: new THREE.Color('#440154') },
    { p: 0.25, c: new THREE.Color('#3b528b') },
    { p: 0.5, c: new THREE.Color('#21918c') },
    { p: 0.75, c: new THREE.Color('#5ec962') },
    { p: 1.0, c: new THREE.Color('#fde725') }
  ];
  if (t <= 0) return stops[0].c;
  if (t >= 1) return stops[4].c;
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].p && t <= stops[i + 1].p) {
      const segT = (t - stops[i].p) / (stops[i + 1].p - stops[i].p);
      return stops[i].c.clone().lerp(stops[i + 1].c, segT);
    }
  }
  return stops[4].c;
};

// 28x28 High-Resolution Realistic Thermocline (100m) Spatial Grid for 10.0°N-15.0°N, 65.0°E-70.0°E
const THERMOCLINE_GRID_DATA = (() => {
  const size = 28;
  const grid: number[][] = [];
  const base = 23.0;

  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    // Normalized coordinates [-1, 1]
    const v = (y / (size - 1)) * 2 - 1;

    for (let x = 0; x < size; x++) {
      const u = (x / (size - 1)) * 2 - 1;

      // 1. Asymmetric Anticyclonic Warm Core Eddy (West-Central Arabian Sea)
      const dx1 = u - (-0.28);
      const dy1 = v - 0.22;
      const dist1 = Math.sqrt(dx1 * dx1 * 1.1 + dy1 * dy1 * 0.9);
      const angle1 = Math.atan2(dy1, dx1);
      // Swirling spiral filament around the eddy
      const spiralFilament = Math.sin(angle1 * 2 + dist1 * 5.5) * 0.42 * Math.exp(-dist1 * 1.8);
      const warmCore = Math.exp(-dist1 * dist1 * 3.6) * 2.5 + spiralFilament;

      // 2. Cold Cyclonic Upwelling Eddy / Coastal Trough (East-Northeast)
      const dx2 = u - 0.48;
      const dy2 = v - (-0.35);
      const dist2 = Math.sqrt(dx2 * dx2 * 1.3 + dy2 * dy2 * 1.0);
      const coldUpwelling = -Math.exp(-dist2 * dist2 * 3.4) * 2.3;

      // 3. Sub-mesoscale Meandering Thermal Fronts (instability shear waves)
      const frontWave1 = Math.sin(u * 3.6 + v * 2.2 + Math.cos(u * 2.8 - v * 3.2) * 0.75) * 0.65;
      const frontWave2 = Math.cos(u * 5.8 - v * 4.4 + Math.sin(v * 3.8) * 0.5) * 0.35;

      // 4. Natural Fluid Turbulence / Fine Micro-Perturbations
      const turbulence1 = Math.sin(u * 11.0 + v * 8.5) * Math.cos(u * 7.5 - v * 12.0) * 0.22;
      const turbulence2 = Math.sin(u * 17.0 - v * 14.0) * Math.cos(u * 13.0 + v * 16.0) * 0.12;

      // 5. Regional Latitudinal / Longitude Gradient
      const regionalGrad = (v * -0.55) + (u * 0.28);

      const rawTemp = base + warmCore + coldUpwelling + frontWave1 + frontWave2 + turbulence1 + turbulence2 + regionalGrad;
      row.push(parseFloat(rawTemp.toFixed(2)));
    }
    grid.push(row);
  }

  // Calculate exact statistics
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const val = grid[y][x];
      sum += val;
      if (val < min) min = val;
      if (val > max) max = val;
    }
  }
  const mean = parseFloat((sum / (size * size)).toFixed(2));
  const centerT = parseFloat(((grid[13][13] + grid[13][14] + grid[14][13] + grid[14][14]) / 4).toFixed(2));

  return {
    grid,
    size,
    meanTemp: mean,
    minTemp: min,
    maxTemp: max,
    centerT,
  };
})();

const SurfaceAxes: React.FC<{ size?: number; latRange?: [number, number]; lngRange?: [number, number] }> = ({
  size = 5,
  latRange = [10, 15],
  lngRange = [65, 70],
}) => {
  const half = size / 2;
  const numSteps = 5;
  const latStep = (latRange[1] - latRange[0]) / numSteps;
  const lngStep = (lngRange[1] - lngRange[0]) / numSteps;

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Base Grid at Z=0 (Mean Temperature Datum Plane) */}
      <gridHelper
        args={[size, 20, 0xffffff, 0xffffff]}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material-opacity={0.16}
        material-transparent
      />

      {/* Latitude Labels (Left Edge) */}
      {Array.from({ length: numSteps + 1 }).map((_, i) => {
        const yPos = half - i * (size / numSteps);
        const val = latRange[1] - i * latStep;
        return (
          <DreiText
            key={`lat-${i}`}
            position={[-half - 0.4, yPos, 0]}
            fontSize={0.15}
            color="rgba(255, 255, 255, 0.8)"
            anchorX="right"
            anchorY="middle"
          >
            {val.toFixed(1)}°N
          </DreiText>
        );
      })}

      {/* Longitude Labels (Bottom Edge) */}
      {Array.from({ length: numSteps + 1 }).map((_, i) => {
        const xPos = -half + i * (size / numSteps);
        const val = lngRange[0] + i * lngStep;
        return (
          <DreiText
            key={`lng-${i}`}
            position={[xPos, -half - 0.4, 0]}
            fontSize={0.15}
            color="rgba(255, 255, 255, 0.8)"
            anchorX="center"
            anchorY="top"
          >
            {val.toFixed(1)}°E
          </DreiText>
        );
      })}
    </group>
  );
};

const ThermoclineTopographicScene: React.FC = () => {
  const size = 5;
  const gridRes = THERMOCLINE_GRID_DATA.size;
  const meanTemp = THERMOCLINE_GRID_DATA.meanTemp;
  const zScale = 0.62;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, gridRes - 1, gridRes - 1);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const minTemp = THERMOCLINE_GRID_DATA.minTemp;
    const maxTemp = THERMOCLINE_GRID_DATA.maxTemp;
    const range = maxTemp - minTemp || 1;

    for (let y = 0; y < gridRes; y++) {
      for (let x = 0; x < gridRes; x++) {
        const i = y * gridRes + x;
        const t = THERMOCLINE_GRID_DATA.grid[y][x];
        // Pivoted at meanTemp: hotter > 0 (above axes), colder < 0 (below axes)
        const zHeight = (t - meanTemp) * zScale;
        const norm = Math.max(0, Math.min(1, (t - minTemp) / range));
        const color = getViridisColor(norm);

        pos.setZ(i, zHeight);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [gridRes, meanTemp]);

  // Point query at 12.5°N, 67.5°E (center of Arabian Sea box [10-15°N, 65-70°E])
  const queryPin = useMemo(() => {
    const queryX = 0;
    const queryY = 0;
    const centerT = THERMOCLINE_GRID_DATA.centerT;
    const surfaceZ = (centerT - meanTemp) * zScale;
    return { x: queryX, y: queryY, z: surfaceZ, temp: centerT };
  }, [meanTemp]);

  return (
    <group position={[-0.2, 0, 0]}>
      {/* 3D Topographic Mesh */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            vertexColors
            roughness={0.25}
            metalness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 3D Query Pin (clean, properly anchored and lowered) */}
        <group position={[queryPin.x, queryPin.y, queryPin.z]}>
          {/* Surface contact ring */}
          <mesh position={[0, 0, 0.005]}>
            <ringGeometry args={[0.04, 0.07, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>

          {/* White needle cylinder: anchored through surface (-0.08 to +0.70) */}
          <mesh position={[0, 0, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.78, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Red ball: lowered to sit directly atop the needle at Z = 0.70 */}
          <mesh position={[0, 0, 0.70]}>
            <sphereGeometry args={[0.065, 16, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.1} emissive="#ef4444" emissiveIntensity={0.6} />
          </mesh>

          {/* Tooltip: placed cleanly above the red ball at Z = 0.88 */}
          <Html position={[0, 0, 0.88]} center>
            <div style={{
              color: 'white',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'Inter, monospace',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.85))',
              whiteSpace: 'nowrap',
              background: 'rgba(8, 20, 36, 0.9)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              pointerEvents: 'none'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              <span>{queryPin.temp.toFixed(2)} °C</span>
            </div>
          </Html>
        </group>
      </group>

      {/* Surface Axes with Lat / Lon Labels at Z=0 */}
      <SurfaceAxes size={5} latRange={[10, 15]} lngRange={[65, 70]} />
    </group>
  );
};

const VectorParticleCanvas: React.FC<{ metric: 'Currents' | 'Winds' }> = ({ metric }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const rect = canvas.getBoundingClientRect();
    const width = (canvas.width = Math.round(rect.width) || 380);
    const height = (canvas.height = Math.round(rect.height) || 240);

    const isCurrents = metric === 'Currents';
    const particleColor = isCurrents ? '#fde725' : '#d4a5a5';
    const numParticles = isCurrents ? 95 : 120;
    const maxLife = isCurrents ? 90 : 55;
    const minLife = isCurrents ? 45 : 25;

    const particles = Array.from({ length: numParticles }, () => {
      const x = Math.random() * width;
      const y = Math.random() * height;
      return {
        x,
        y,
        prevX: x,
        prevY: y,
        age: Math.floor(Math.random() * minLife),
        life: Math.floor(Math.random() * (maxLife - minLife)) + minLife,
      };
    });

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const render = () => {
      // Crisp fade to avoid elongated blurry trails
      ctx.fillStyle = isCurrents ? 'rgba(15, 23, 42, 0.17)' : 'rgba(15, 23, 42, 0.20)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = particleColor;
      ctx.lineWidth = isCurrents ? 1.8 : 1.4;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.85;

      particles.forEach((p) => {
        p.prevX = p.x;
        p.prevY = p.y;

        if (isCurrents) {
          // Organic Oceanic Gyre with natural meanders (subtly boosted speed)
          const nx = (p.x - width * 0.46) / (width * 0.42);
          const ny = (p.y - height * 0.50) / (height * 0.42);

          // Tilted elliptical coordinates (-22° basin alignment)
          const rx = nx * 0.93 + ny * 0.37;
          const ry = -nx * 0.37 + ny * 0.93;
          const rSq = (rx * 0.82) ** 2 + (ry * 1.38) ** 2;

          // Main elliptical circulation component
          const gyreMag = Math.exp(-rSq * 0.95);
          const circX = -ry * 1.55 * gyreMag;
          const circY = (rx * 1.15 + 0.12) * gyreMag;

          // Natural planetary fluid meanders & oceanic wave turbulence
          const wave1 = 0.38 * Math.sin(nx * 2.6 + ny * 1.4);
          const wave2 = 0.32 * Math.cos(nx * 1.8 - ny * 2.2);
          const driftX = -0.35 + 0.22 * Math.sin(ny * 2.2);
          const driftY = 0.14 * Math.cos(nx * 2.0);

          p.x += (circX + driftX + wave1 * 0.35) * 1.25;
          p.y += (circY + driftY + wave2 * 0.30) * 1.25;
        } else {
          // Atmospheric Monsoon Winds: steady diagonal airflow from NE to SW
          p.x -= 3.0 + Math.sin(p.y * 0.035) * 0.45;
          p.y += 1.65 + Math.cos(p.x * 0.025) * 0.35;
        }

        p.age++;

        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Respawn uniformly across the entire canvas when out of bounds or expired
        if (p.age > p.life || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.prevX = p.x;
          p.prevY = p.y;
          p.age = 0;
          p.life = Math.floor(Math.random() * (maxLife - minLife)) + minLife;
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [metric]);

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '380px', height: '240px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: '#0f172a' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {/* Dynamic Mode Header Tag */}
        <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '2px 10px', fontSize: '9.5px', color: metric === 'Currents' ? '#fde725' : '#d4a5a5', fontWeight: 600, letterSpacing: '0.5px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {metric === 'Currents' ? 'GEOSTROPHIC OCEAN GYRE' : 'NORTHEAST MONSOON WINDS'}
        </div>

        {/* Geographic bounds */}
        <div style={{ position: 'absolute', top: 6, left: 8, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, monospace', pointerEvents: 'none' }}>15.0°N</div>
        <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, monospace', pointerEvents: 'none' }}>10.0°N</div>
        <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, monospace', pointerEvents: 'none' }}>70.0°E</div>
        <div style={{ position: 'absolute', top: 6, right: 8, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, monospace', pointerEvents: 'none' }}>65.0°E</div>
      </div>
    </div>
  );
};


const ReconstructionStageVisualizer: React.FC<{ activeStage: number }> = ({ activeStage }) => {
  // Stage 1 State
  const [activeMetric, setActiveMetric] = useState<'SST' | 'SSS' | 'SSH' | 'Currents' | 'Winds'>('SST');
  const [activeTab, setActiveTab] = useState<'magnitude' | 'direction'>('magnitude');

  const METRICS = [
    { id: 'SST' as const, label: 'SST', title: 'Sea Surface Temperature (SST)', icon: ThermometerSun, color: '#ff7882', unit: '°C', val: '29.4°C' },
    { id: 'SSS' as const, label: 'SSS', title: 'Sea Surface Salinity (SSS)', icon: Droplets, color: '#35b779', unit: ' psu', val: '35.2 psu' },
    { id: 'SSH' as const, label: 'SSH', title: 'Sea Surface Height (SSH)', icon: Waves, color: '#8bb6d6', unit: 'm', val: '+0.18m' },
    { id: 'Currents' as const, label: 'Currents', title: 'Surface Currents Magnitude', icon: Navigation, color: '#fde725', unit: ' m/s', val: '1.38 m/s' },
    { id: 'Winds' as const, label: 'Winds', title: 'Surface Winds Magnitude', icon: Wind, color: '#d4a5a5', unit: ' m/s', val: '6.4 m/s' },
  ];

  const currentMetricConfig = METRICS.find((m) => m.id === activeMetric) || METRICS[0];
  const effectiveTab = (activeMetric === 'Currents' || activeMetric === 'Winds') ? activeTab : 'magnitude';

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, rgba(16, 33, 54, 0.95), rgba(8, 16, 28, 0.95))',
        border: '1px solid rgba(139, 182, 214, 0.22)',
        borderRadius: '24px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        padding: '24px',
        minHeight: activeStage === 1 ? 'auto' : '490px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        transition: 'min-height 0.3s ease',
      }}
    >
      {/* ─── STAGE 1: SATELLITE SURFACE INPUTS (Replicating ObservationModal & OceanGlobeView) ─── */}
      {activeStage === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Top 5 Metric Selection Buttons from OceanGlobeView sidebar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {METRICS.map((m) => {
              const isSel = activeMetric === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMetric(m.id);
                    if (m.id !== 'Currents' && m.id !== 'Winds') setActiveTab('magnitude');
                  }}
                  style={{
                    background: isSel ? `${m.color}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isSel ? m.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '10px',
                    padding: '8px 4px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: isSel ? `0 0 14px ${m.color}33` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon size={13} color={m.color} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: isSel ? m.color : 'rgba(255,255,255,0.8)' }}>
                      {m.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                    {m.val}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Modal-style Content Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: currentMetricConfig.color, letterSpacing: '0.4px' }}>
                {effectiveTab === 'direction' ? currentMetricConfig.title.replace('Magnitude', 'Direction') : currentMetricConfig.title}
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                {effectiveTab === 'magnitude'
                  ? '14-Day Historical Trend for Region: 10.0°N - 15.0°N, 65.0°E - 70.0°E'
                  : 'Vector Field (0.25° Resolution) for Region: 10.0°N - 15.0°N, 65.0°E - 70.0°E'}
              </div>
            </div>

            {/* Magnitude vs Direction Toggle from ObservationModal */}
            {(activeMetric === 'Currents' || activeMetric === 'Winds') && (
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={() => setActiveTab('magnitude')}
                  style={{
                    background: activeTab === 'magnitude' ? currentMetricConfig.color : 'transparent',
                    color: activeTab === 'magnitude' ? '#000' : 'rgba(255,255,255,0.6)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  Magnitude
                </button>
                <button
                  onClick={() => setActiveTab('direction')}
                  style={{
                    background: activeTab === 'direction' ? currentMetricConfig.color : 'transparent',
                    color: activeTab === 'direction' ? '#000' : 'rgba(255,255,255,0.6)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  Direction
                </button>
              </div>
            )}
          </div>

          {/* Chart or Vector Field Area */}
          <div style={{ width: '100%', height: '260px', display: 'flex', flexDirection: 'column' }}>
            {effectiveTab === 'magnitude' ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={MOCK_SURFACE_TRENDS[activeMetric]} margin={{ top: 12, right: 20, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="landingMetricGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentMetricConfig.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={currentMetricConfig.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    tickFormatter={(val) => `${val}${currentMetricConfig.unit}`}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    dx={-4}
                  />
                  <RechartsTooltip
                    contentStyle={{ background: 'rgba(10,25,45,0.95)', border: `1px solid ${currentMetricConfig.color}`, borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)}${currentMetricConfig.unit}`, 'Observed Value']}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 4px 0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={currentMetricConfig.color}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#landingMetricGrad)"
                    activeDot={{ r: 5, fill: currentMetricConfig.color, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <VectorParticleCanvas metric={activeMetric === 'Winds' ? 'Winds' : 'Currents'} />
            )}
          </div>
        </div>
      )}

      {/* ─── STAGE 2: 15 STANDARD DEPTHS (Subsurface 3D Profile from DepthModal.tsx) ─── */}
      {activeStage === 2 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#8bb6d6', letterSpacing: '0.4px' }}>
                Subsurface 3D Profile — 15 Standard Depths
              </h3>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                Physics-informed neural volumetric grids [0m to 1,000m depth]
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.3)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              Volumetric Stratification
            </div>
          </div>

          {/* 3D Stacked Profile Canvas matching DepthModal.tsx */}
          <div
            className="stage2-3d-profile-container"
            style={{
              flex: 1,
              minHeight: '405px',
              height: '405px',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'radial-gradient(ellipse at center, rgba(14, 32, 56, 0.6) 0%, rgba(4, 10, 20, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <style>{`
              .landing-3d-profile-container {
                position: relative !important;
                width: 100% !important;
                height: 405px !important;
              }
              .stage2-3d-profile-container {
                position: relative !important;
                width: 100% !important;
                height: 405px !important;
              }
              .landing-3d-profile-container > div:first-child,
              .landing-3d-profile-container > div:first-child > div,
              .landing-3d-profile-container canvas,
              .stage2-3d-profile-container > div:first-child,
              .stage2-3d-profile-container > div:first-child > div,
              .stage2-3d-profile-container canvas {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                display: block !important;
              }
            `}</style>
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <Canvas
                camera={{ position: [8.0, 3.8, 8.0], fov: 45 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                <CanvasResizeSynchronizer />
                <ambientLight intensity={0.45} />
                <directionalLight position={[10, 10, 5]} intensity={1.8} />
                <pointLight position={[-10, -10, -10]} color="#4b0082" intensity={2.5} />
                <spotLight position={[0, 10, 0]} angle={0.6} penumbra={1} intensity={1.2} />
                <OrbitControls
                  makeDefault
                  target={[-0.2, -0.85, 0]}
                  enableDamping
                  dampingFactor={0.05}
                  autoRotate
                  autoRotateSpeed={0.7}
                  minDistance={5}
                  maxDistance={22}
                  maxPolarAngle={Math.PI / 2 + 0.25}
                  minPolarAngle={0.2}
                />
                <Suspense fallback={null}>
                  <Subsurface3DProfileModel />
                </Suspense>
              </Canvas>
            </div>

            {/* Colorbar Legend Overlay matching DepthModal.tsx */}
            <div
              style={{
                position: 'absolute',
                right: '24px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.45)',
                padding: '14px 10px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(6px)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600 }}>30°C</span>
              <div
                style={{
                  width: '12px',
                  height: '180px',
                  background: 'linear-gradient(to bottom, #ffa500, #4b0082)',
                  borderRadius: '6px',
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)',
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600 }}>4°C</span>
              <span style={{ color: '#8bb6d6', fontSize: '11px', marginTop: '4px', letterSpacing: '0.5px', fontWeight: 500 }}>TEMP</span>
            </div>

            {/* Bottom Info Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: '#8bb6d6',
                  background: 'rgba(0, 0, 0, 0.45)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(139, 182, 214, 0.2)',
                  backdropFilter: 'blur(4px)',
                  fontWeight: 500,
                  letterSpacing: '0.3px',
                }}
              >
                15 STANDARD DEPTHS • 0m TO 1,000m
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                ↻ Drag to orbit
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STAGE 3: 3D COORDINATE QUERY (Thermocline Topographic Surface from DepthModal.tsx) ─── */}
      {activeStage === 3 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '14px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                  Thermocline Surface
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.3px'
                }}>
                  100m Depth
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(186, 230, 253, 0.65)', lineHeight: 1.4 }}>
                3D Topographic Coordinate Query &bull; Region: 10.0°N–15.0°N, 65.0°E–70.0°E
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: '#bae6fd',
                background: 'rgba(8, 27, 51, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 500,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                <span>Point Query: <strong style={{ color: '#ffffff', fontWeight: 600 }}>12.5°N, 67.5°E</strong></span>
              </div>
            </div>
          </div>

          {/* 3D Topographic Surface Canvas */}
          <div
            className="landing-3d-profile-container"
            style={{
              flex: 1,
              minHeight: '405px',
              height: '405px',
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'radial-gradient(ellipse at center, rgba(14, 32, 56, 0.6) 0%, rgba(4, 10, 20, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <Canvas
                camera={{ position: [5.0, 3.5, 5.0], fov: 44 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                <CanvasResizeSynchronizer />
                <ambientLight intensity={0.55} />
                <directionalLight position={[8, 10, 5]} intensity={1.8} />
                <pointLight position={[-8, -8, -8]} color="#440154" intensity={2} />
                <pointLight position={[0, -6, -4]} color="#312e81" intensity={1.8} />
                <spotLight position={[0, 8, 0]} angle={0.6} penumbra={1} intensity={1.2} />
                <OrbitControls
                  makeDefault
                  target={[-0.2, -0.65, 0]}
                  enableDamping
                  dampingFactor={0.05}
                  autoRotate
                  autoRotateSpeed={0.8}
                  minDistance={3.5}
                  maxDistance={14}
                  maxPolarAngle={Math.PI / 2 + 0.2}
                  minPolarAngle={0.15}
                />
                <Suspense fallback={null}>
                  <ThermoclineTopographicScene />
                </Suspense>
              </Canvas>
            </div>

            {/* Viridis Colorbar Legend Overlay */}
            <div style={{
              position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              background: 'rgba(0, 0, 0, 0.4)', padding: '12px 8px', borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(4px)', pointerEvents: 'none', zIndex: 10
            }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 500 }}>{Math.round(THERMOCLINE_GRID_DATA.maxTemp)}°C</span>
              <div style={{
                width: '12px', height: '160px',
                background: 'linear-gradient(to bottom, #fde725, #5ec962, #21918c, #3b528b, #440154)',
                borderRadius: '6px', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)'
              }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 500 }}>{Math.round(THERMOCLINE_GRID_DATA.minTemp)}°C</span>
              <span style={{ color: '#8bb6d6', fontSize: '10px', marginTop: '2px', letterSpacing: '0.5px', fontWeight: 500 }}>TEMP</span>
            </div>

            {/* Left Topographic Surface Info Overlay (matching DepthModal style) */}
            <div style={{
              position: 'absolute', left: '16px', bottom: '14px',
              background: 'rgba(10, 20, 36, 0.75)', padding: '10px 14px', borderRadius: '8px',
              border: '1px solid rgba(56, 189, 248, 0.2)', backdropFilter: 'blur(6px)', pointerEvents: 'none', zIndex: 10
            }}>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, letterSpacing: '0.5px' }}>
                THERMOCLINE LAYER (100m)
              </div>
              <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.65)', marginTop: '3px', display: 'flex', gap: '12px' }}>
                <span>Mean: {THERMOCLINE_GRID_DATA.meanTemp.toFixed(1)}°C</span>
                <span style={{ color: '#00ff88' }}>Point: {THERMOCLINE_GRID_DATA.centerT.toFixed(2)}°C</span>
              </div>
            </div>

            {/* Top Hint Badge */}
            <div style={{
              position: 'absolute', top: '14px', left: '16px',
              fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)',
              background: 'rgba(0, 0, 0, 0.45)', padding: '4px 10px', borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(4px)',
              pointerEvents: 'none', zIndex: 10
            }}>
              ↻ Drag to orbit 3D relief
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SatelliteScanIllustration: React.FC = () => (
  <svg viewBox="0 0 280 160" fill="none" style={{ width: "100%", height: "100%" }}>
    {([[20,18],[60,10],[100,22],[150,8],[200,15],[240,25],[270,10]] as [number,number][]).map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="1.2" fill="rgba(186,230,253,0.5)" />
    ))}
    <path d="M30,90 Q140,30 250,90" fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="1" strokeDasharray="6 4" />
    <g transform="translate(138, 42)">
      <rect x="-14" y="-4" width="10" height="8" rx="1" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.7)" strokeWidth="1" />
      <rect x="4" y="-4" width="10" height="8" rx="1" fill="rgba(56,189,248,0.15)" stroke="rgba(56,189,248,0.7)" strokeWidth="1" />
      <rect x="-4" y="-5" width="8" height="10" rx="1" fill="rgba(14,116,144,0.3)" stroke="rgba(186,230,253,0.8)" strokeWidth="1.2" />
      <polygon points="-2,5 2,5 10,40 -10,40" fill="rgba(56,189,248,0.18)" />
    </g>
    <line x1="10" y1="100" x2="270" y2="100" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
    <text x="140" y="96" textAnchor="middle" fill="rgba(186,230,253,0.6)" fontSize="8" fontFamily="Inter, monospace">Surface penetration limit: 1 mm</text>
    {[0, 1, 2].map(i => {
      const y1 = 103 + i * 6;
      const qy1 = 99 + i * 6;
      const qx1 = 70 + i * 20;
      const qy2 = 107 + i * 6;
      const qx2 = 210 - i * 15;
      const pathD = `M10,${y1} Q${qx1},${qy1} 140,${y1} Q${qx2},${qy2} 270,${y1}`;
      const strokeColor = `rgba(56,189,248,${0.3 - i * 0.07})`;
      return (
        <path key={i} d={pathD} fill="none" stroke={strokeColor} strokeWidth="0.8" />
      );
    })}
    <rect x="10" y="100" width="260" height="55" fill="rgba(8,27,51,0.6)" rx="2" />
    <text x="140" y="120" textAnchor="middle" fill="rgba(14,116,144,0.6)" fontSize="9" fontFamily="Inter, monospace">UNSEEN BELOW</text>
    <text x="140" y="133" textAnchor="middle" fill="rgba(56,189,248,0.35)" fontSize="8" fontFamily="Inter, monospace">0 to 1000m temperature structure</text>
  </svg>
);

const ArgoSectionIllustration: React.FC = () => (
  <svg viewBox="0 0 280 160" fill="none" style={{ width: "100%", height: "100%" }}>
    <defs>
      <linearGradient id="waterGrad2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#041527" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="280" height="160" rx="4" fill="url(#waterGrad2)" />
    <path d="M0,18 Q35,14 70,18 Q105,22 140,18 Q175,14 210,18 Q245,22 280,18" fill="none" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" />
    <text x="140" y="12" textAnchor="middle" fill="rgba(186,230,253,0.5)" fontSize="7" fontFamily="Inter, monospace">SURFACE</text>
    {([{y:18,label:"0m"},{y:55,label:"100m"},{y:90,label:"250m"},{y:120,label:"500m"},{y:152,label:"1000m"}]).map(({y,label}) => (
      <g key={label}>
        <line x1="8" y1={y} x2="18" y2={y} stroke="rgba(186,230,253,0.35)" strokeWidth="0.7" />
        <text x="20" y={y+3} fill="rgba(186,230,253,0.4)" fontSize="7" fontFamily="Inter, monospace">{label}</text>
      </g>
    ))}
    {[70, 140, 210].map((cx, i) => {
      const cy = 18 + (0.35 + i * 0.18) * 134;
      return (
        <g key={i}>
          <line x1={cx} y1="18" x2={cx} y2={cy} stroke="rgba(186,230,253,0.3)" strokeWidth="0.7" strokeDasharray="3 2" />
          <ellipse cx={cx} cy={cy} rx="9" ry="5" fill="rgba(251,191,36,0.85)" />
          <circle cx={cx} cy={cy} r="14" fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="0.8">
            <animate attributeName="r" values="9;22;9" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur={`${2 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <text x={cx+12} y={cy+4} fill="rgba(251,191,36,0.8)" fontSize="7.5" fontFamily="Inter, monospace" fontWeight="600">Float {i+1}</text>
        </g>
      );
    })}
  </svg>
);

const LiveDepthProfileGraph: React.FC<{ inView: boolean }> = ({ inView }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Depth axis: y: 35 (0m) to y: 375 (1000m) -> 340px vertical travel
  // Temp axis:  x: 75 (4°C) to x: 485 (30°C)   -> 410px horizontal span
  const aiCurvePath = "M 482 35 C 480 44, 470 56, 441 69 C 390 85, 300 120, 241 154 C 190 185, 150 240, 124 290 C 105 330, 96 355, 94 375";

  const argoPoints = [
    { x: 482, y: 35, depth: "0m", temp: "29.8°C", error: "0.0°C" },
    { x: 474, y: 52, depth: "50m", temp: "29.3°C", error: "-0.1°C" },
    { x: 441, y: 69, depth: "100m", temp: "27.2°C", error: "+0.2°C" },
    { x: 340, y: 103, depth: "200m", temp: "20.8°C", error: "-0.3°C" },
    { x: 241, y: 154, depth: "350m", temp: "14.5°C", error: "+0.1°C" },
    { x: 166, y: 205, depth: "500m", temp: "9.8°C", error: "-0.2°C" },
    { x: 124, y: 290, depth: "750m", temp: "7.1°C", error: "+0.1°C" },
    { x: 94, y: 375, depth: "1000m", temp: "5.2°C", error: "0.0°C" },
  ];

  return (
    <div style={{ background: "rgba(8,27,51,0.65)", border: "1px solid rgba(186,230,253,0.18)", borderRadius: "24px", padding: "28px", backdropFilter: "blur(16px)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontFamily: "Inter,sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", color: "#7dd3fc", textTransform: "uppercase" }}>Verification Profile</div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>Depth vs. Temperature</div>
        </div>
        <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 14, height: 3, background: "#38bdf8", borderRadius: 1.5, display: "inline-block" }} />
            <span style={{ fontFamily: "Inter,sans-serif", fontSize: "12px", color: "rgba(186,230,253,0.85)" }}>OceanEmbed AI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbf24", boxShadow: "0 0 6px #fbbf24", display: "inline-block" }} />
            <span style={{ fontFamily: "Inter,sans-serif", fontSize: "12px", color: "rgba(186,230,253,0.85)" }}>ARGO Buoy</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", height: "430px" }}>
        <svg
          viewBox="0 0 540 440"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="aiAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {/* Depth Axis (Y) & Temperature Axis (X) */}
          <line x1="75" y1="35" x2="75" y2="375" stroke="rgba(186,230,253,0.25)" strokeWidth="1.2" />
          <line x1="75" y1="375" x2="495" y2="375" stroke="rgba(186,230,253,0.25)" strokeWidth="1.2" />

          {/* Y-Axis Label: Depth */}
          <text x="24" y="24" fill="rgba(186,230,253,0.75)" fontSize="10" fontWeight="700" letterSpacing="0.08em" fontFamily="Inter, sans-serif">DEPTH</text>
          <text x="24" y="36" fill="rgba(186,230,253,0.4)" fontSize="9" fontFamily="Inter, monospace">(meters)</text>

          {/* Thermocline Zone Background Shading & Callout */}
          <rect x="75" y="69" width="410" height="102" fill="rgba(56,189,248,0.03)" pointerEvents="none" />
          <line x1="73" y1="69" x2="73" y2="171" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" opacity="0.55" />
          <text x="480" y="125" fill="rgba(56,189,248,0.5)" fontSize="9" fontWeight="600" textAnchor="end" letterSpacing="0.08em" fontFamily="Inter, sans-serif">
            THERMOCLINE DROP (100m – 400m)
          </text>

          {/* Depth Grid Lines & Y-Axis Labels */}
          {[
            { y: 35, l: "0m" },
            { y: 103, l: "200m" },
            { y: 171, l: "400m" },
            { y: 239, l: "600m" },
            { y: 307, l: "800m" },
            { y: 375, l: "1000m" },
          ].map(t => (
            <g key={t.l}>
              <line x1="68" y1={t.y} x2="75" y2={t.y} stroke="rgba(186,230,253,0.4)" strokeWidth="1" />
              <text x="63" y={t.y + 4} fill="rgba(186,230,253,0.6)" fontSize="10" textAnchor="end" fontFamily="Inter, monospace">{t.l}</text>
              <line x1="75" y1={t.y} x2="495" y2={t.y} stroke="rgba(186,230,253,0.06)" strokeDasharray="3 4" />
            </g>
          ))}

          {/* Temperature Grid Lines & X-Axis Labels */}
          {[
            { x: 91, l: "5°C" },
            { x: 170, l: "10°C" },
            { x: 248, l: "15°C" },
            { x: 327, l: "20°C" },
            { x: 406, l: "25°C" },
            { x: 485, l: "30°C" },
          ].map(t => (
            <g key={t.l}>
              <line x1={t.x} y1="375" x2={t.x} y2="382" stroke="rgba(186,230,253,0.4)" strokeWidth="1" />
              <text x={t.x} y="398" fill="rgba(186,230,253,0.6)" fontSize="10" textAnchor="middle" fontFamily="Inter, monospace">{t.l}</text>
              <line x1={t.x} y1="35" x2={t.x} y2="375" stroke="rgba(186,230,253,0.04)" strokeDasharray="3 4" />
            </g>
          ))}

          {/* X-Axis Label: Temperature */}
          <text x="285" y="424" fill="rgba(186,230,253,0.65)" fontSize="10" fontWeight="600" letterSpacing="0.1em" textAnchor="middle" fontFamily="Inter, sans-serif">
            WATER TEMPERATURE (°C)
          </text>

          {/* Soft Shading Under AI Curve */}
          <path
            d={`${aiCurvePath} L 75 375 L 75 35 Z`}
            fill="url(#aiAreaGrad)"
            opacity={inView ? 1 : 0}
            style={{ transition: "opacity 1.6s ease 0.4s" }}
          />

          {/* Continuous AI Reconstructed Curve */}
          <path
            d={aiCurvePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="800"
            strokeDashoffset={inView ? "0" : "800"}
            style={{
              transition: "stroke-dashoffset 2.4s cubic-bezier(0.16,1,0.3,1)",
              filter: "drop-shadow(0 0 10px rgba(56,189,248,0.6))",
            }}
          />

          {/* Real Physical ARGO Float Observations */}
          {argoPoints.map((pt, i) => {
            const isHovered = hoveredPoint === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{
                  opacity: inView ? 1 : 0,
                  transition: `opacity 0.4s ease ${0.6 + i * 0.12}s`,
                  cursor: "pointer",
                }}
              >
                <circle cx={pt.x} cy={pt.y} r={isHovered ? 7.5 : 5.5} fill="#fbbf24" style={{ transition: "r 0.2s ease" }} />
                <circle cx={pt.x} cy={pt.y} r={isHovered ? 15 : 11} fill="none" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" style={{ transition: "r 0.2s ease" }} />
                {/* Hit area for easy hover on mobile/desktop */}
                <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />
              </g>
            );
          })}

          {/* Active Hover Tooltip */}
          {hoveredPoint !== null && (
            <g
              transform={`translate(${argoPoints[hoveredPoint].x}, ${argoPoints[hoveredPoint].y})`}
              style={{ pointerEvents: "none", transition: "transform 0.15s ease-out" }}
            >
              <g transform={`translate(${argoPoints[hoveredPoint].x > 380 ? -135 : 15}, ${argoPoints[hoveredPoint].y > 300 ? -48 : -20})`}>
                <rect
                  x="0"
                  y="0"
                  width="125"
                  height="46"
                  rx="8"
                  fill="rgba(4,21,39,0.96)"
                  stroke="rgba(251,191,36,0.6)"
                  strokeWidth="1.2"
                  filter="drop-shadow(0 8px 20px rgba(0,0,0,0.75))"
                />
                <text x="10" y="18" fill="#fbbf24" fontSize="10" fontWeight="700" fontFamily="Inter, monospace">
                  ARGO: {argoPoints[hoveredPoint].depth} @ {argoPoints[hoveredPoint].temp}
                </text>
                <text x="10" y="34" fill="#38bdf8" fontSize="9.5" fontWeight="600" fontFamily="Inter, sans-serif">
                  AI: {argoPoints[hoveredPoint].temp} (Δ {argoPoints[hoveredPoint].error})
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(186,230,253,0.1)", paddingTop: "14px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontFamily: "Inter,sans-serif", fontSize: "11px", color: "rgba(186,230,253,0.5)" }}>Arabian Sea Sector (WMO 2901548)</span>
        <span style={{ fontFamily: "Inter,sans-serif", fontSize: "11px", fontWeight: 600, color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399", display: "inline-block" }} />
          Correlation: 97.2% | RMSE: 0.38°C
        </span>
      </div>
    </div>
  );
};

const SeabedDunes: React.FC = () => (
  <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:1, pointerEvents:"none", lineHeight:0 }}>
    <svg viewBox="0 0 1440 200" fill="none" style={{ width:"100%", display:"block" }}>
      <path d="M0,140 C240,90 480,170 720,130 C960,90 1200,160 1440,120 L1440,200 L0,200 Z" fill="rgba(4,21,39,0.7)" />
      <path d="M0,160 C180,120 400,180 700,148 C1000,120 1220,165 1440,145 L1440,200 L0,200 Z" fill="rgba(6,33,57,0.85)" />
      <path d="M0,175 C200,152 450,185 750,162 C1050,142 1280,175 1440,165 L1440,200 L0,200 Z" fill="rgba(8,27,51,0.95)" />
      {([[120,168],[280,178],[450,162],[620,172],[780,158],[950,170],[1100,165],[1280,175],[1380,170]] as [number,number][]).map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="1.5" fill="rgba(56,189,248,0.45)" />
      ))}
    </svg>
  </div>
);

interface CanvasRipple {
  id: number;
  x: number;
  y: number;
  birth: number;
}

const OceanInteractiveOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<CanvasRipple[]>([]);
  const rippleIdRef = useRef(0);

  const mouseRef = useRef({
    targetX: -100,
    targetY: -100,
    currentX: -100,
    currentY: -100,
    radius: 20,
    targetRadius: 20,
    lockProgress: 0,
    isHovered: false,
    isVisible: false,
    lastMoveTime: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let rafId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let reticleAlpha = 0;

    const onResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    onResize();
    window.addEventListener("resize", onResize, { passive: true });

    const handlePointerMove = (clientX: number, clientY: number, target: HTMLElement | null) => {
      const now = performance.now();
      const m = mouseRef.current;
      m.targetX = clientX;
      m.targetY = clientY;
      m.isVisible = true;
      m.lastMoveTime = now;

      if (m.currentX < 0) {
        m.currentX = clientX;
        m.currentY = clientY;
      }

      const isClickable = !!target?.closest?.(
        'a, button, [role="button"], input, select, textarea, canvas, .btn-primary, .btn-glass, .nav-anchor, [data-clickable]'
      );
      m.isHovered = isClickable;
      m.targetRadius = isClickable ? 14 : 20;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      handlePointerMove(e.clientX, e.clientY, e.target as HTMLElement | null);
    };

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY, e.target as HTMLElement | null);
    };

    let lastRippleTime = 0;
    const triggerRipple = (clientX: number, clientY: number) => {
      const now = performance.now();
      if (now - lastRippleTime < 35) return;
      lastRippleTime = now;
      ripplesRef.current.push({
        id: ++rippleIdRef.current,
        x: clientX,
        y: clientY,
        birth: now,
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      triggerRipple(e.clientX, e.clientY);
    };

    const onMouseDown = (e: MouseEvent) => {
      triggerRipple(e.clientX, e.clientY);
    };

    const onPointerLeave = () => {
      mouseRef.current.isVisible = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    const RIPPLE_DURATION = 820;

    function render() {
      if (!ctx || !canvas) return;
      const now = performance.now();
      const m = mouseRef.current;

      // Always cleanly clear entire high-DPI canvas
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // --- 1. RENDER CLEAN WATER DROPLET RIPPLES ---
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rip = ripples[i];
        const elapsed = now - rip.birth;

        if (elapsed >= RIPPLE_DURATION) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();

        const rings = [
          { delay: 0,   maxR: 52, peakAlpha: 0.72, width: 1.2 },
          { delay: 75,  maxR: 38, peakAlpha: 0.55, width: 1.0 },
          { delay: 150, maxR: 24, peakAlpha: 0.40, width: 0.9 },
        ];

        for (const ring of rings) {
          const ringElapsed = elapsed - ring.delay;
          if (ringElapsed <= 0) continue;

          const ringProgress = ringElapsed / (RIPPLE_DURATION - ring.delay);
          if (ringProgress >= 1) continue;

          const ease = 1 - Math.pow(1 - ringProgress, 3);
          const radius = ring.maxR * ease;
          const alpha = ring.peakAlpha * Math.pow(1 - ringProgress, 1.5);
          if (alpha <= 0.005) continue;

          ctx.beginPath();
          ctx.arc(rip.x, rip.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
          ctx.lineWidth = ring.width;
          ctx.stroke();
        }

        if (elapsed < 160) {
          const dropP = elapsed / 160;
          const dropAlpha = (1 - dropP) * 0.85;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, 1.5 * (1 - dropP * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 230, 253, ${dropAlpha})`;
          ctx.fill();
        }

        ctx.restore();
      }

      // --- 2. RENDER SATELLITE TARGETING RETICLE ---
      const isDesktop = width >= 640;
      if (isDesktop && m.currentX >= 0 && m.currentY >= 0) {
        m.currentX += (m.targetX - m.currentX) * 0.18;
        m.currentY += (m.targetY - m.currentY) * 0.18;
        m.radius += (m.targetRadius - m.radius) * 0.2;

        const targetLock = m.isHovered ? 1 : 0;
        m.lockProgress += (targetLock - m.lockProgress) * 0.18;

        const timeSinceMove = now - m.lastMoveTime;
        const targetAlpha = m.isVisible ? (timeSinceMove > 3500 ? 0.35 : 1) : 0;
        reticleAlpha += (targetAlpha - reticleAlpha) * 0.12;

        if (reticleAlpha > 0.01) {
          const cx = m.currentX;
          const cy = m.currentY;
          const r = m.radius;
          const lock = m.lockProgress;
          const rotAngle = (now * 0.0006) % (Math.PI * 2);

          ctx.save();
          ctx.globalAlpha = reticleAlpha;

          // 2A. Microscopic Central Crosshair Dot
          ctx.beginPath();
          ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = lock > 0.5 ? "#38bdf8" : "rgba(186, 230, 253, 0.9)";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 6;
          ctx.fill();

          // 2B. Micro Crosshair Lines (3px length, 3px inner gap)
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "rgba(125, 211, 252, 0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy - 3);
          ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 6);
          ctx.moveTo(cx - 6, cy); ctx.lineTo(cx - 3, cy);
          ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 6, cy);
          ctx.stroke();

          // 2C. Segmented Vector Ring (4 arcs with cardinal gaps)
          const gap = 0.28;
          ctx.lineWidth = 1.1;
          ctx.strokeStyle = lock > 0.5
            ? `rgba(56, 189, 248, ${0.75 + lock * 0.25})`
            : "rgba(125, 211, 252, 0.55)";

          for (let k = 0; k < 4; k++) {
            const startAngle = rotAngle + k * (Math.PI / 2) + gap / 2;
            const endAngle = rotAngle + (k + 1) * (Math.PI / 2) - gap / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, startAngle, endAngle);
            ctx.stroke();
          }

          // 2D. 4 Precision Cardinal Ticks (N, E, S, W)
          const tickIn = r + 2 - lock * 1.5;
          const tickOut = r + 6 + lock * 1.5;
          ctx.strokeStyle = lock > 0.5 ? "#38bdf8" : "rgba(186, 230, 253, 0.75)";
          ctx.lineWidth = 1.2;

          for (let k = 0; k < 4; k++) {
            const a = k * (Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * tickIn, cy + Math.sin(a) * tickIn);
            ctx.lineTo(cx + Math.cos(a) * tickOut, cy + Math.sin(a) * tickOut);
            ctx.stroke();
          }

          // 2E. Tactical Lock-On Corner Brackets (When Hovering Clickable)
          if (lock > 0.05) {
            const b = r + 6;
            const len = 5 * lock;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lock * 0.95})`;
            ctx.lineWidth = 1.4;
            ctx.shadowColor = "rgba(56, 189, 248, 0.85)";
            ctx.shadowBlur = 5 * lock;

            ctx.beginPath();
            ctx.moveTo(cx - b, cy - b + len); ctx.lineTo(cx - b, cy - b); ctx.lineTo(cx - b + len, cy - b);
            ctx.moveTo(cx + b - len, cy - b); ctx.lineTo(cx + b, cy - b); ctx.lineTo(cx + b, cy - b + len);
            ctx.moveTo(cx - b, cy + b - len); ctx.lineTo(cx - b, cy + b); ctx.lineTo(cx - b + len, cy + b);
            ctx.moveTo(cx + b - len, cy + b); ctx.lineTo(cx + b, cy + b); ctx.lineTo(cx + b, cy + b - len);
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // 2F. Satellite Telemetry Readout Tag
          const normX = cx / width;
          const normY = cy / height;
          const latVal = (28 - normY * 38).toFixed(1);
          const lonVal = (52 + normX * 44).toFixed(1);
          const latText = `${Math.abs(Number(latVal)).toFixed(1)}°${Number(latVal) >= 0 ? "N" : "S"}`;
          const lonText = `${Math.abs(Number(lonVal)).toFixed(1)}°E`;

          const tagX = cx + r + 10 > width - 130 ? cx - r - 110 : cx + r + 10;
          const tagY = cy - 6;

          ctx.font = '9px "Inter", monospace';
          ctx.fillStyle = "rgba(186, 230, 253, 0.65)";
          ctx.fillText(`LAT ${latText}  LON ${lonText}`, tagX, tagY);

          if (lock > 0.3) {
            ctx.font = 'bold 8.5px "Inter", monospace';
            ctx.fillStyle = "#38bdf8";
            ctx.fillText("[LOCK-ON ACQUIRED]", tagX, tagY + 11);
          } else {
            ctx.font = '8px "Inter", monospace';
            ctx.fillStyle = "rgba(125, 211, 252, 0.45)";
            ctx.fillText("SAT-07 // RECON", tagX, tagY + 11);
          }

          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseleave", onPointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1001,
        display: "block",
      }}
    />
  );
};

const computeOrbitGeometry = (w: number, h: number, satEl?: HTMLElement | null) => {
  if (w <= 540) return null;

  const isMobile = w < 768;
  const fovRad = (46 * Math.PI) / 180;
  // Camera is at [0, 0, 6], group is at [baseX, baseY, -0.3]
  // Distance to group = 6 - (-0.3) = 6.3
  const visibleHeight = 2 * 6.3 * Math.tan(fovRad / 2); // ~5.34838
  const pxPerUnit = h / visibleHeight;

  const globe3DX = isMobile ? 0 : 0.85;
  const globe3DY = isMobile ? -0.25 : 0.05;

  const globeX = w * 0.5 + globe3DX * pxPerUnit;
  const globeY = h * 0.5 - globe3DY * pxPerUnit;

  let satX = 0;
  let satY = 0;

  if (satEl) {
    const rect = satEl.getBoundingClientRect();
    const currentScroll = typeof window !== "undefined" ? (window.scrollY || window.pageYOffset || 0) : 0;
    satX = rect.left + rect.width * 0.5 - currentScroll * 0.24;
    satY = rect.top + rect.height * 0.5 + currentScroll * 0.14;
  } else {
    const satW = Math.max(125, Math.min(180, w * 0.125));
    const satRight = w * 0.085;
    satX = w - satRight - satW * 0.5;
    satY = h * 0.11 + satW * 0.31;
  }

  const dx = satX - globeX;
  const dy = satY - globeY;
  const a = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const b = a * 0.34;

  return { globeX, globeY, a, b, angle };
};

const RECONSTRUCTION_STAGES = [
  {
    stg: 1,
    num: "01",
    label: "Surface Fingerprints",
    title: "Reading Surface Radar Clues",
    description: "Subsurface heat anomalies slightly elevate sea surface height and alter surface currents. OceanEmbed ingests 7 daily satellite streams from NASA and Copernicus.",
    badge: "4 Surface Inputs"
  },
  {
    stg: 2,
    num: "02",
    label: "15 Standard Depths",
    title: "Deep Neural Layering",
    description: "A physics-informed deep neural network translates 2D surface anomalies into 3D volumetric thermal grids across 15 standard depths down to 1,000 meters.",
    badge: "0m to 1,000m Depth"
  },
  {
    stg: 3,
    num: "03",
    label: "3D Coordinate Query",
    title: "Coordinate Point Inspection",
    description: "Query exact temperatures, depth gradients, and confidence intervals at any point in the Indian Ocean basin with instant 3D slicing.",
    badge: "Real-Time Query",
  },
];

const ArgoFloatTelemetry: React.FC<{ sectionRef: React.RefObject<HTMLElement | null> }> = React.memo(({ sectionRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentY = useRef(0);
  const targetY = useRef(0);
  const currentOpacity = useRef(0);
  const targetOpacity = useRef(0);
  const isRunning = useRef(false);

  // Wheel speed dampener: makes the scroll slower when the argo illustration is visible in the viewport
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Active when the section containing the argo illustration is in the active viewport
      const isVisibleInViewport = rect.top < windowH * 0.78 && rect.bottom > windowH * 0.22;

      // Smooth exit bounds: don't trap when user scrolls up out of top or down out of bottom
      const isExitingTop = rect.top > 0 && e.deltaY < 0;
      const isExitingBottom = rect.bottom < windowH && e.deltaY > 0;

      if (isVisibleInViewport && !isExitingTop && !isExitingBottom) {
        e.preventDefault();
        const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaMode === 2 ? e.deltaY * windowH : e.deltaY;
        // Slow down scroll by ~55% (speed factor 0.45)
        window.scrollBy({
          top: delta * 0.45,
          left: 0,
          behavior: "instant" as any,
        });
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [sectionRef]);

  // Viewport tracking & slow downward parallax glide
  useEffect(() => {
    const computeTarget = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Section visibility in viewport
      const inView = rect.bottom > 40 && rect.top < windowH - 40;
      if (!inView) {
        targetOpacity.current = 0;
        return;
      }

      // Smooth fade in as it enters, smooth fade out as it leaves
      const enterDist = windowH - rect.top;
      const leaveDist = rect.bottom;
      const fadeIn = Math.min(1, enterDist / 220);
      const fadeOut = Math.min(1, leaveDist / 220);
      targetOpacity.current = Math.min(fadeIn, fadeOut) * 0.85;

      // Scroll progress through the section
      const totalDist = rect.height + windowH;
      const progress = clamp((windowH - rect.top) / totalDist, 0, 1);

      // Slow scroll down parallax:
      // Pinned in viewport at top: 50%, drifting gently downwards by ±80px (160px total)
      // across the entire duration of the section
      targetY.current = (progress - 0.5) * 160;
    };

    let animId: number;
    const updateLerp = () => {
      const diffY = targetY.current - currentY.current;
      const diffOp = targetOpacity.current - currentOpacity.current;

      const needsUpdate = Math.abs(diffY) > 0.1 || Math.abs(diffOp) > 0.01;

      if (needsUpdate) {
        currentY.current += diffY * 0.12;
        currentOpacity.current += diffOp * 0.15;

        if (containerRef.current) {
          containerRef.current.style.transform = `translate3d(0, calc(-50% + ${currentY.current.toFixed(2)}px), 0)`;
          containerRef.current.style.opacity = currentOpacity.current.toFixed(3);
          containerRef.current.style.visibility = currentOpacity.current > 0.01 ? "visible" : "hidden";
        }
        animId = requestAnimationFrame(updateLerp);
      } else {
        currentY.current = targetY.current;
        currentOpacity.current = targetOpacity.current;
        if (containerRef.current) {
          containerRef.current.style.transform = `translate3d(0, calc(-50% + ${targetY.current.toFixed(2)}px), 0)`;
          containerRef.current.style.opacity = targetOpacity.current.toFixed(3);
          containerRef.current.style.visibility = targetOpacity.current > 0.01 ? "visible" : "hidden";
        }
        isRunning.current = false;
      }
    };

    const startLoop = () => {
      if (!isRunning.current) {
        isRunning.current = true;
        animId = requestAnimationFrame(updateLerp);
      }
    };

    const onScroll = () => {
      computeTarget();
      startLoop();
    };

    computeTarget();
    currentY.current = targetY.current;
    currentOpacity.current = targetOpacity.current;
    if (containerRef.current) {
      containerRef.current.style.transform = `translate3d(0, calc(-50% + ${targetY.current.toFixed(2)}px), 0)`;
      containerRef.current.style.opacity = targetOpacity.current.toFixed(3);
      containerRef.current.style.visibility = targetOpacity.current > 0.01 ? "visible" : "hidden";
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sectionRef]);

  return (
    <div
      ref={containerRef}
      className="argo-float-telemetry"
      style={{
        position: "fixed",
        right: "clamp(24px, 4vw, 64px)",
        top: "50%",
        transform: "translate3d(0, -50%, 0)",
        width: "clamp(55px, 5.2vw, 75px)",
        zIndex: 20,
        pointerEvents: "none",
        willChange: "transform, opacity",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: 0,
        visibility: "hidden",
      }}
    >
      {/* Ambient Depth Glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "130px",
          height: "280px",
          background: "radial-gradient(ellipse at center, rgba(56, 189, 248, 0.16) 0%, rgba(2, 132, 199, 0.05) 55%, transparent 75%)",
          filter: "blur(32px)",
          borderRadius: "9999px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="argo-float-anim" style={{ width: "100%", position: "relative" }}>
        {/* White wire extending from above, terminating at the back/top of the ARGO float without passing through or past it */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(100% - 22px)",
            height: "75vh",
            width: "1.5px",
            transform: "translateX(-50%)",
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.35) 25%, rgba(255, 255, 255, 0.95) 100%)",
            boxShadow: "0 0 6px rgba(255, 255, 255, 0.5), 0 0 12px rgba(56, 189, 248, 0.25)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <img
          src={argoSrc}
          alt="ARGO Profiling Float"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            mixBlendMode: "screen",
            opacity: 0.85,
            position: "relative",
            zIndex: 2,
            filter: "drop-shadow(0 0 22px rgba(56, 189, 248, 0.25))",
            transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
});

const PersistentGlobeCanvas: React.FC = React.memo(() => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2,
        pointerEvents: "none",
        opacity: 0.75,
        userSelect: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%" }}
      >
        <WireframeGlobeScene />
      </Canvas>
    </div>
  );
});

const HeroSatelliteOrbit: React.FC = React.memo(() => {
  const [scrollY, setScrollY] = useState(0);
  const satelliteRef = useRef<HTMLDivElement>(null);
  const [orbitPath, setOrbitPath] = useState<{
    globeX: number;
    globeY: number;
    a: number;
    b: number;
    angle: number;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    return computeOrbitGeometry(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    const updateOrbit = () => {
      setOrbitPath(computeOrbitGeometry(window.innerWidth, window.innerHeight, satelliteRef.current));
    };
    updateOrbit();
    window.addEventListener("resize", updateOrbit, { passive: true });
    const timer = setTimeout(updateOrbit, 120);
    return () => {
      window.removeEventListener("resize", updateOrbit);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let lastScroll = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const cur = window.scrollY;
      if (cur > 1100 && lastScroll > 1100) return;
      if (!ticking) {
        requestAnimationFrame(() => {
          if (Math.abs(cur - lastScroll) > 1.5) {
            lastScroll = cur;
            setScrollY(cur);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (scrollY > 1100) return null;

  const orbitFade = clamp(1 - scrollY / 720, 0, 1);
  const satelliteFade = clamp((1 - scrollY / 820) * 0.78, 0, 0.78);
  const flyX = scrollY * 0.24;
  const flyY = -scrollY * 0.14;
  const flyScale = clamp(1 - scrollY * 0.00025, 0.75, 1);

  return (
    <>
      {/* Subtle Orbital Trajectory — Rear Arc (Behind Globe) */}
      {orbitPath && (
        <svg
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
            opacity: orbitFade * 0.38,
            transition: "opacity 0.25s ease-out",
          }}
        >
          <g transform={`rotate(${orbitPath.angle} ${orbitPath.globeX} ${orbitPath.globeY})`}>
            <path
              d={`M ${orbitPath.globeX - orbitPath.a} ${orbitPath.globeY} A ${orbitPath.a} ${orbitPath.b} 0 0 1 ${orbitPath.globeX + orbitPath.a} ${orbitPath.globeY}`}
              fill="none"
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="3"
              filter="blur(3px)"
            />
            <path
              className="orbit-path-anim"
              d={`M ${orbitPath.globeX - orbitPath.a} ${orbitPath.globeY} A ${orbitPath.a} ${orbitPath.b} 0 0 1 ${orbitPath.globeX + orbitPath.a} ${orbitPath.globeY}`}
              fill="none"
              stroke="rgba(56, 189, 248, 0.28)"
              strokeWidth="1"
              strokeDasharray="6 8"
            />
            <circle
              cx={orbitPath.globeX + orbitPath.a}
              cy={orbitPath.globeY}
              r={2}
              fill="#38bdf8"
              opacity={0.5}
            />
            <circle
              cx={orbitPath.globeX + orbitPath.a}
              cy={orbitPath.globeY}
              r={5}
              fill="none"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="0.8"
              strokeDasharray="2 3"
            />
          </g>
        </svg>
      )}

      {/* Orbital Satellite Layer — Positioned BEHIND the Earth Globe */}
      <div
        ref={satelliteRef}
        className="orbital-satellite-fixed-layer"
        style={{
          position: "fixed",
          top: "11vh",
          right: "8.5vw",
          width: "clamp(125px, 12.5vw, 180px)",
          zIndex: 1,
          pointerEvents: "none",
          transform: `translate3d(${flyX}px, ${flyY}px, 0) scale(${flyScale})`,
          opacity: satelliteFade,
          transition: "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out",
          userSelect: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "20%",
            width: "75%",
            height: "75%",
            background: "radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(2, 132, 199, 0.05) 50%, transparent 75%)",
            filter: "blur(32px)",
            borderRadius: "9999px",
            pointerEvents: "none",
          }}
        />

        <div className="satellite-float-anim" style={{ position: "relative", width: "100%" }}>
          <img
            src={satelliteSrc}
            alt="Orbital Satellite Wireframe"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              transform: "scaleX(-1) rotate(-14deg)",
              mixBlendMode: "screen",
              opacity: 0.78,
              filter: "drop-shadow(0 0 20px rgba(56, 189, 248, 0.3))",
            }}
          />
        </div>
      </div>

      {/* Subtle Orbital Trajectory — Front Arc (In Front of Globe) */}
      {orbitPath && (
        <svg
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 3,
            pointerEvents: "none",
            opacity: orbitFade * 0.42,
            transition: "opacity 0.25s ease-out",
          }}
        >
          <g transform={`rotate(${orbitPath.angle} ${orbitPath.globeX} ${orbitPath.globeY})`}>
            <path
              d={`M ${orbitPath.globeX + orbitPath.a} ${orbitPath.globeY} A ${orbitPath.a} ${orbitPath.b} 0 0 1 ${orbitPath.globeX - orbitPath.a} ${orbitPath.globeY}`}
              fill="none"
              stroke="rgba(56, 189, 248, 0.1)"
              strokeWidth="3"
              filter="blur(3px)"
            />
            <path
              className="orbit-path-anim"
              d={`M ${orbitPath.globeX + orbitPath.a} ${orbitPath.globeY} A ${orbitPath.a} ${orbitPath.b} 0 0 1 ${orbitPath.globeX - orbitPath.a} ${orbitPath.globeY}`}
              fill="none"
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth="1"
              strokeDasharray="6 8"
            />
          </g>
        </svg>
      )}
    </>
  );
});

const LandingPage: React.FC = () => {
  const accuracySectionRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const [accuracyInView, setAccuracyInView] = useState(false);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const s = window.scrollY > 20;
          setIsScrolled(prev => (prev !== s ? s : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = accuracySectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAccuracyInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Interactive Light Blue Gradient for "BENEATH THE SURFACE."
  const heroHeadlineRef = useRef<HTMLHeadingElement>(null);
  const heroTextRef = useRef<HTMLSpanElement>(null);
  const targetHeroCursor = useRef({ x: 50, y: 50 });
  const currentHeroCursor = useRef({ x: 50, y: 50 });
  const isHeroLerpRunning = useRef(false);

  const startHeroLerp = () => {
    if (isHeroLerpRunning.current) return;
    isHeroLerpRunning.current = true;
    const lerp = () => {
      const dx = targetHeroCursor.current.x - currentHeroCursor.current.x;
      const dy = targetHeroCursor.current.y - currentHeroCursor.current.y;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        currentHeroCursor.current.x += dx * 0.12;
        currentHeroCursor.current.y += dy * 0.12;
        if (heroTextRef.current) {
          const cx = currentHeroCursor.current.x;
          const cy = currentHeroCursor.current.y;
          heroTextRef.current.style.backgroundImage = `
            radial-gradient(ellipse 75% 55% at ${cx}% ${100 + (cy - 50) * 0.3}%, rgba(56, 189, 248, 0.95) 0%, rgba(56, 189, 248, 0) 70%),
            linear-gradient(${180 + (cx - 50) * 0.28}deg, #ffffff 0%, #ffffff 28%, #bae6fd ${55 + (cy - 50) * 0.18}%, #38bdf8 100%)
          `;
        }
        requestAnimationFrame(lerp);
      } else {
        isHeroLerpRunning.current = false;
      }
    };
    requestAnimationFrame(lerp);
  };

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroHeadlineRef.current) return;
    const rect = heroHeadlineRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    targetHeroCursor.current = {
      x: Math.max(-25, Math.min(125, x)),
      y: Math.max(-35, Math.min(135, y)),
    };
    startHeroLerp();
  };

  const handleHeroMouseLeave = () => {
    targetHeroCursor.current = { x: 50, y: 50 };
    startHeroLerp();
  };

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as any });
    document.documentElement.style.overflowX = "clip";
    document.body.style.overflowX = "clip";
    document.body.style.overflowY = "visible";
  }, []);

  return (
    <div style={{ background: "#081b33", color: "#ffffff", minHeight: "100vh", width: "100%", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: #081b33; }
        .orbital-satellite-fixed-layer,
        .argo-float-telemetry {
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        @keyframes bounceSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes horizonGlow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.85;transform:scale(1.05)} }
        @keyframes stageFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseSlow { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes sweepLine { 0% { left: 0%; opacity: 0.1; } 50% { opacity: 0.7; } 100% { left: 100%; opacity: 0.1; } }
        .masked-ocean-headline{display:inline-block;background-image:linear-gradient(180deg,#ffffff 0%,#bae6fd 55%,#38bdf8 100%);-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important}
        .stroke-frost{display:inline-block;-webkit-text-stroke:1.5px rgba(186,230,253,0.6);-webkit-text-fill-color:transparent!important;color:transparent!important}
        .masked-ice{display:inline-block;background-image:linear-gradient(135deg,#bae6fd 0%,#38bdf8 60%,#0ea5e9 100%);-webkit-background-clip:text!important;background-clip:text!important;-webkit-text-fill-color:transparent!important;color:transparent!important}
        .number-outline-ice{display:inline-block;-webkit-text-stroke:1.5px rgba(186,230,253,0.65);-webkit-text-fill-color:transparent!important;color:transparent!important}
        .nav-anchor{font-family:Inter,sans-serif;font-size:13px;font-weight:500;color:rgba(186,230,253,0.65);text-decoration:none;letter-spacing:.02em;transition:color .2s ease}
        .nav-anchor:hover{color:#bae6fd}
        .btn-primary{background:#ffffff;color:#0c1a2e;font-family:Inter,sans-serif;font-weight:600;border-radius:999px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 8px 30px rgba(56,189,248,0.25);transition:all .3s cubic-bezier(.16,1,.3,1);border:none;cursor:pointer}
        .btn-primary:hover{background:#e0f2fe;transform:translateY(-2px);box-shadow:0 12px 40px rgba(56,189,248,0.4)}
        .btn-glass{background:rgba(255,255,255,0.10);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.20);color:#ffffff;font-family:Inter,sans-serif;font-weight:500;border-radius:999px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .3s ease;cursor:pointer}
        .btn-glass:hover{background:rgba(255,255,255,0.18);border-color:rgba(186,230,253,0.4);transform:translateY(-2px)}
        @keyframes satelliteHover {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1.2deg);
          }
        }
        @keyframes argoFloatBob {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .satellite-float-anim {
          animation: satelliteHover 7s ease-in-out infinite;
        }
        .argo-float-anim {
          animation: argoFloatBob 5.5s ease-in-out infinite;
        }
        @keyframes orbitDash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -180;
          }
        }
        .orbit-path-anim {
          animation: orbitDash 36s linear infinite;
        }
        @media (max-width: 1024px) {
          .orbital-satellite-fixed-layer {
            width: 135px !important;
            top: 9vh !important;
            right: 6.5vw !important;
          }
        }
        @media (max-width: 768px) {
          .orbital-satellite-fixed-layer {
            width: 105px !important;
            top: 7.5vh !important;
            right: 4.5vw !important;
            opacity: 0.55 !important;
          }
          .argo-float-telemetry {
            opacity: 0.35 !important;
            right: 8px !important;
            width: 48px !important;
          }
        }
        @media (max-width: 540px) {
          .orbital-satellite-fixed-layer {
            display: none !important;
          }
          .argo-float-telemetry {
            display: none !important;
          }
        }
      `}</style>

      {/* Satellite Targeting Reticle & Water Refraction Interactive Canvas */}
      <OceanInteractiveOverlay />

      {/* Permanently Mounted 3D Wireframe Earth Globe Canvas */}
      <PersistentGlobeCanvas />

      {/* Hero Orbital Trajectory & Satellite Fly-Out Layer */}
      <HeroSatelliteOrbit />

      {/* ARGO Autonomous Profiling Float Fixed Telemetry Accent */}
      <ArgoFloatTelemetry sectionRef={howItWorksRef} />

      <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:1000, padding:"16px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", background:isScrolled ? "rgba(8,27,51,0.78)" : "transparent", backdropFilter:isScrolled ? "blur(20px)" : "none", WebkitBackdropFilter:isScrolled ? "blur(20px)" : "none", borderBottom:isScrolled ? "1px solid rgba(186,230,253,0.1)" : "1px solid transparent", transition:"all .35s ease" }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:"12px", textDecoration:"none" }}>
          <img src={Logo} alt="OceanEmbed" style={{ width:"30px", height:"30px" }} />
          <span style={{ fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:600, letterSpacing:"-0.5px", color:"#ffffff" }}>OceanEmbed</span>
        </Link>
        <nav style={{ display:"flex", gap:"36px", alignItems:"center" }}>
          <a href="#blind-spot" className="nav-anchor">The Blind Spot</a>
          <a href="#how-it-works" className="nav-anchor">How It Works</a>
          <a href="#accuracy" className="nav-anchor">Accuracy</a>
        </nav>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <Link to="/login" style={{ fontFamily:"Inter,sans-serif", fontSize:"13px", fontWeight:600, color:"rgba(186,230,253,0.8)", textDecoration:"none", padding:"8px 16px", borderRadius:"6px" }}>Sign In</Link>
          <Link to="/dashboard" className="btn-primary" style={{ padding:"9px 22px", fontSize:"13px" }}>Launch 3D Globe</Link>
        </div>
      </header>

      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        style={{ position:"relative", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 24px 80px", overflow:"hidden", background:"transparent", zIndex: 3 }}
      >
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 40% 50%, transparent 25%, rgba(8,27,51,0.3) 65%, rgba(8,27,51,0.75) 100%)", pointerEvents:"none", zIndex:1 }} />
        <div style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:"650px", height:"450px", background:"radial-gradient(ellipse, rgba(2,132,199,0.15) 0%, transparent 70%)", filter:"blur(50px)", pointerEvents:"none", zIndex:1 }} />
        <div style={{ position:"relative", zIndex:2, maxWidth:"1040px" }}>
          <div style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:"0.18em", color:"rgba(186,230,253,0.7)", textTransform:"uppercase", marginBottom:"24px" }}>AI-Powered Subsurface Ocean Intelligence</div>
          <h1
            ref={heroHeadlineRef}
            style={{
              fontFamily:"Syne,sans-serif",
              fontSize:"clamp(3.4rem,8.5vw,8.2rem)",
              fontWeight:800,
              letterSpacing:"-0.04em",
              lineHeight:0.95,
              margin:"0 auto 32px",
              userSelect:"none",
            }}
          >
            <span style={{ display:"block", color:"#ffffff", marginBottom:"8px" }}>SEE</span>
            <span
              ref={heroTextRef}
              style={{
                display: "block",
                backgroundImage: `
                  radial-gradient(ellipse 75% 55% at 50% 100%, rgba(56, 189, 248, 0.95) 0%, rgba(56, 189, 248, 0) 70%),
                  linear-gradient(180deg, #ffffff 0%, #ffffff 28%, #bae6fd 55%, #38bdf8 100%)
                `,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              BENEATH THE SURFACE.
            </span>
          </h1>
          <p style={{ fontFamily:"Inter,sans-serif", fontSize:"clamp(17px,2vw,21px)", fontWeight:400, color:"rgba(186,230,253,0.8)", lineHeight:1.65, maxWidth:"680px", margin:"0 auto 44px" }}>
            Satellites photograph the entire ocean every day, but they can only see the top millimeter of water. OceanEmbed uses deep learning to turn flat surface snapshots into a 3D underwater temperature map, 1,000 meters deep.
          </p>
          <div style={{ display:"flex", gap:"18px", justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/dashboard" className="btn-primary" style={{ padding:"16px 36px", fontSize:"15px" }}>Enter the 3D Visualizer</Link>
          </div>
        </div>
      </section>

      <section
        id="blind-spot"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, rgba(7,54,84,0.76) 0%, rgba(6,40,64,0.86) 60%, rgba(4,28,51,0.94) 100%)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          padding: "100px 32px 140px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 4,
        }}
      >
        <div style={{ maxWidth:"1140px", width:"100%" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ textAlign:"center", marginBottom:"80px" }}>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:"0.16em", color:"#7dd3fc", textTransform:"uppercase", marginBottom:"16px" }}>The Observation Paradox</div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(2.4rem,6.5vw,5.8rem)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.05 }}>
                <span style={{ color:"#ffffff" }}>SPACE SEES WIDE. </span>
                <span className="stroke-frost">SENSORS SEE DEEP.</span>
                <br />
                <span className="masked-ocean-headline">NOTHING SAW BOTH.</span>
              </h2>
            </div>
          </ScrollFlyIn>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:"40px" }}>
            <ScrollFlyIn from="left" delay={100}>
              <div style={{ background:"rgba(8,27,51,0.75)", border:"1px solid rgba(56,189,248,0.25)", borderRadius:"24px", padding:"36px", backdropFilter:"blur(16px)", overflow:"hidden", boxShadow:"0 20px 50px rgba(0,0,0,0.45)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"18px" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#38bdf8", boxShadow:"0 0 8px #38bdf8", display:"inline-block" }} />
                  <span style={{ fontFamily:"Inter,monospace", fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"rgba(186,230,253,0.7)", textTransform:"uppercase" }}>From 800 km Up - NASA / Copernicus</span>
                </div>
                <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:700, color:"#ffffff", marginBottom:"12px" }}>Global daily coverage, but skin-deep.</h3>
                <p style={{ fontFamily:"Inter,sans-serif", fontSize:"15px", color:"rgba(186,230,253,0.7)", lineHeight:1.6, marginBottom:"24px" }}>Satellites cover every square kilometer daily, but radar and infrared light stop dead at the water surface.</p>
                <div style={{ height:"160px", borderRadius:"12px", overflow:"hidden", border:"1px solid rgba(56,189,248,0.2)" }}>
                  <SatelliteScanIllustration />
                </div>
              </div>
            </ScrollFlyIn>
            <ScrollFlyIn from="right" delay={200}>
              <div style={{ background:"rgba(8,27,51,0.75)", border:"1px solid rgba(251,191,36,0.25)", borderRadius:"24px", padding:"36px", backdropFilter:"blur(16px)", overflow:"hidden", boxShadow:"0 20px 50px rgba(0,0,0,0.45)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"18px" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#fbbf24", boxShadow:"0 0 8px #fbbf24", display:"inline-block" }} />
                  <span style={{ fontFamily:"Inter,monospace", fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"rgba(186,230,253,0.7)", textTransform:"uppercase" }}>From Inside the Water - ARGO Floats</span>
                </div>
                <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:"24px", fontWeight:700, color:"#ffffff", marginBottom:"12px" }}>Subsurface truth, but sparse pinpricks.</h3>
                <p style={{ fontFamily:"Inter,sans-serif", fontSize:"15px", color:"rgba(186,230,253,0.7)", lineHeight:1.6, marginBottom:"24px" }}>Drifting buoys dive 1,000 meters to measure real underwater heat, but they leave 99% of the Indian Ocean unmeasured on any given day.</p>
                <div style={{ height:"160px", borderRadius:"12px", overflow:"hidden", border:"1px solid rgba(251,191,36,0.15)" }}>
                  <ArgoSectionIllustration />
                </div>
              </div>
            </ScrollFlyIn>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        ref={howItWorksRef}
        style={{
          minHeight: "90vh",
          background: "linear-gradient(180deg, rgba(4,28,51,0.85) 0%, rgba(4,21,39,0.93) 100%)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          padding: "120px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 4,
          overflow: "hidden"
        }}
      >
        <div style={{ maxWidth:"1140px", width:"100%", margin:"0 auto" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ textAlign:"center", marginBottom:"64px" }}>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:"0.16em", color:"#7dd3fc", textTransform:"uppercase", marginBottom:"16px" }}>Deep Neural Reconstruction</div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(2.4rem,5.5vw,4.8rem)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.05, marginBottom:"20px", color:"#ffffff" }}>
                TURNING FLAT SATELLITES INTO 3D OCEANS.
              </h2>
              <p style={{ fontFamily:"Inter,sans-serif", fontSize:"18px", color:"rgba(186,230,253,0.75)", maxWidth:"680px", margin:"0 auto", lineHeight:1.6 }}>
                How OceanEmbed reconstructs 1,000 meters of vertical ocean thermal structure from surface radar clues in real time.
              </p>
            </div>
          </ScrollFlyIn>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:"40px", alignItems:"center" }}>
            <ScrollFlyIn from="left" delay={100}>
              <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                {RECONSTRUCTION_STAGES.map(s => {
                  const isActive = activeStage === s.stg;
                  return (
                    <div
                      key={s.stg}
                      onClick={() => setActiveStage(s.stg)}
                      style={{
                        cursor:"pointer",
                        padding:"22px 26px",
                        borderRadius:"20px",
                        background: isActive ? "rgba(12,74,110,0.38)" : "rgba(8,27,51,0.6)",
                        border: `1px solid ${isActive ? "rgba(56,189,248,0.55)" : "rgba(186,230,253,0.12)"}`,
                        boxShadow: isActive ? "0 12px 35px rgba(2,132,199,0.22)" : "none",
                        transition:"all .3s cubic-bezier(0.16,1,0.3,1)",
                        display:"flex",
                        gap:"18px",
                        alignItems:"flex-start"
                      }}
                    >
                      <div style={{ fontFamily:"Inter,monospace", fontSize:"12px", fontWeight:700, color:isActive ? "#38bdf8" : "rgba(186,230,253,0.4)", background:isActive ? "rgba(56,189,248,0.18)" : "rgba(186,230,253,0.06)", padding:"6px 12px", borderRadius:"8px", flexShrink:0 }}>
                        {s.num}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                          <h4 style={{ fontFamily:"Syne,sans-serif", fontSize:"18px", fontWeight:700, color:isActive ? "#ffffff" : "rgba(186,230,253,0.75)", margin:0 }}>
                            {s.label}
                          </h4>
                          <span style={{ fontFamily:"Inter,sans-serif", fontSize:"10px", fontWeight:600, color:isActive ? "#7dd3fc" : "rgba(186,230,253,0.35)", background:"rgba(8,27,51,0.7)", borderRadius:"4px", padding:"2px 8px" }}>
                            {s.badge}
                          </span>
                        </div>
                        <p style={{ fontFamily:"Inter,sans-serif", fontSize:"14px", color:isActive ? "rgba(186,230,253,0.85)" : "rgba(186,230,253,0.5)", lineHeight:1.55, margin:0 }}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollFlyIn>

            <ScrollFlyIn from="right" delay={200}>
              <ReconstructionStageVisualizer activeStage={activeStage} />
            </ScrollFlyIn>
          </div>
        </div>
      </section>

      <section
        id="accuracy"
        ref={accuracySectionRef}
        style={{
          minHeight: "90vh",
          background: "linear-gradient(180deg, rgba(4,21,39,0.88) 0%, rgba(5,26,46,0.95) 100%)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          padding: "120px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 4,
        }}
      >
        <div style={{ maxWidth:"1140px", width:"100%" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ marginBottom:"64px" }}>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:"0.16em", color:"#7dd3fc", textTransform:"uppercase", marginBottom:"14px" }}>Empirical Validation</div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(2.4rem,5.5vw,4.8rem)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.05, marginBottom:"20px", color:"#ffffff" }}>TESTED AGAINST REAL OCEAN BUOYS.</h2>
              <p style={{ fontFamily:"Inter,sans-serif", fontSize:"18px", color:"rgba(186,230,253,0.75)", maxWidth:"640px", lineHeight:1.6 }}>We do not ask scientists to trust a black box. Every prediction is automatically cross-checked against real physical thermometers diving in the Indian Ocean.</p>
            </div>
          </ScrollFlyIn>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:"60px", alignItems:"center" }}>
            <ScrollFlyIn from="left" delay={100}>
              <div style={{ display:"flex", flexDirection:"column", gap:"44px" }}>
                {([
                  { val:"> 94%", label:"Pattern match with real depth curves (Correlation)" },
                  { val:"~0.5°C", label:"Average margin of error across 1,000m (RMSE)" },
                  { val:"±0.05°C", label:"Near-zero warm or cold drift (Bias)" },
                ]).map(({ val, label }, i) => (
                  <div key={i}>
                    <div
                      className="masked-ice"
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: "clamp(3.8rem, 7vw, 5.5rem)",
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.05,
                        display: "inline-block",
                        paddingBottom: "4px"
                      }}
                    >
                      {val}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "rgba(186, 230, 253, 0.65)", marginTop: "12px" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollFlyIn>
            <ScrollFlyIn from="right" delay={200}>
              <LiveDepthProfileGraph inView={accuracyInView} />
            </ScrollFlyIn>
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "120px 32px 80px",
          background: "linear-gradient(180deg, rgba(5,26,46,0.92) 0%, rgba(4,21,39,0.97) 100%)",
          borderTop: "1px solid rgba(186,230,253,0.08)",
          position: "relative",
          zIndex: 4,
        }}
      >
        <div style={{ maxWidth:"1140px", margin:"0 auto" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ textAlign:"center", marginBottom:"80px" }}>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:"0.16em", color:"#7dd3fc", textTransform:"uppercase", marginBottom:"14px" }}>Real-World Impact</div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(2.2rem,5vw,4rem)", fontWeight:800, letterSpacing:"-0.03em", color:"#ffffff" }}>WHY SEEING BENEATH MATTERS.</h2>
            </div>
          </ScrollFlyIn>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:"48px" }}>
            {([
              { num:"01", from:"left" as const, title:"Monsoon and Cyclone Forecasting", body:"Subsurface ocean heat is the fuel tank for tropical cyclones and the Indian monsoon. Knowing what is 200 meters below tells meteorologists how much energy a storm will gain." },
              { num:"02", from:"bottom" as const, title:"Sustainable Fisheries", body:"Thermal boundaries underwater dictate where nutrient-rich waters and marine life gather. Fisheries using this data can find productive zones without over-trawling." },
              { num:"03", from:"right" as const, title:"Naval and Subsea Operations", body:"Sound travels differently through warm and cold water layers; accurate 3D thermal maps are vital for underwater navigation, sonar calibration, and submarine routing." },
            ]).map(({ num, from, title, body }) => (
              <ScrollFlyIn key={num} from={from} delay={parseInt(num) * 80}>
                <div style={{ borderLeft:"1px solid rgba(186,230,253,0.18)", paddingLeft:"28px" }}>
                  <div className="number-outline-ice" style={{ fontFamily:"Syne,sans-serif", fontSize:"42px", fontWeight:800, marginBottom:"16px" }}>{num}</div>
                  <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:"20px", fontWeight:700, color:"#ffffff", marginBottom:"12px" }}>{title}</h3>
                  <p style={{ fontFamily:"Inter,sans-serif", fontSize:"15px", color:"rgba(186,230,253,0.65)", lineHeight:1.6 }}>{body}</p>
                </div>
              </ScrollFlyIn>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          minHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          position: "relative",
          padding: "80px 24px 180px",
          background: "linear-gradient(180deg, rgba(4,21,39,0.96) 0%, #030e1e 60%, #020b16 100%)",
          overflow: "hidden",
          zIndex: 4,
        }}
      >
        <SeabedDunes />
        <div style={{ position:"absolute", bottom:"80px", left:"50%", transform:"translateX(-50%)", width:"70vw", height:"250px", borderRadius:"50%", background:"radial-gradient(ellipse,rgba(2,132,199,0.2) 0%,rgba(14,116,144,0.08) 40%,transparent 70%)", filter:"blur(50px)", pointerEvents:"none", animation:"horizonGlow 8s ease-in-out infinite" }} />
        {Array.from({ length: 18 }, (_, i) => {
          const left = `${5 + (i * 5.5) % 92}%`;
          const bottom = `${8 + (i * 3.7) % 35}%`;
          const sz = `${2 + (i % 3)}px`;
          const dur = `${3 + (i % 4)}s`;
          const del = `${(i * 0.35) % 3}s`;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left,
                bottom,
                width: sz,
                height: sz,
                borderRadius: "50%",
                background: "rgba(56,189,248,0.55)",
                boxShadow: "0 0 8px rgba(56,189,248,0.5)",
                animation: `pulseSlow ${dur} ease-in-out ${del} infinite`,
                pointerEvents: "none",
                zIndex: 1
              }}
            />
          );
        })}
        <div style={{ position:"relative", zIndex:3, maxWidth:"900px" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", fontWeight:600, letterSpacing:"0.18em", color:"rgba(186,230,253,0.55)", textTransform:"uppercase", marginBottom:"24px" }}>The Ocean Awaits</div>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(3.5rem,8.5vw,7.5rem)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:0.95, marginBottom:"40px", color:"#ffffff" }}>
              DIVE INTO <span className="masked-ocean-headline">THE DATA.</span>
            </h2>
            <div style={{ display:"flex", gap:"20px", justifyContent:"center", flexWrap:"wrap" }}>
              <Link to="/dashboard" className="btn-primary" style={{ padding:"18px 44px", fontSize:"16px" }}>Launch OceanEmbed Visualizer</Link>
            </div>
          </ScrollFlyIn>
        </div>
        <footer style={{ position:"absolute", bottom:"24px", left:"40px", right:"40px", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid rgba(186,230,253,0.08)", paddingTop:"20px", flexWrap:"wrap", gap:"12px", zIndex:3 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <img src={Logo} alt="OceanEmbed" style={{ width:"20px", height:"20px", opacity:0.7 }} />
            <span style={{ fontFamily:"Syne,sans-serif", fontSize:"14px", fontWeight:700, color:"rgba(186,230,253,0.7)" }}>OceanEmbed</span>
            <span style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", color:"rgba(186,230,253,0.35)", marginLeft:"8px" }}>Subsurface Ocean Intelligence</span>
          </div>
          <div style={{ display:"flex", gap:"24px" }}>
            {([{to:"/dashboard",label:"Visualizer"},{to:"/login",label:"Sign In"},{to:"/signup",label:"Sign Up"}]).map(({ to, label }) => (
              <Link key={to} to={to} style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", color:"rgba(186,230,253,0.4)", textDecoration:"none" }}>{label}</Link>
            ))}
          </div>
        </footer>
      </section>
    </div>
  );
};

export default LandingPage;
