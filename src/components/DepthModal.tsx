import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Edges, Billboard } from '@react-three/drei';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DepthModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictions?: {
    depths_m: number[];
    temps_celsius: number[];
  };
  latRange?: [number, number];
  lngRange?: [number, number];
  searchedLocation?: { lat: number; lon: number } | null;
}

type LayerSurfaceData = (number | null)[][];

// ─── Task 1: High-Resolution Mock Data Generator ────────────────────────────

/**
 * Generates a 20×20 grid of temperatures representing a 5° area at 0.25° resolution.
 * Uses combined sin/cos wave functions to create realistic spatial variation (±0.3°C).
 */
const generateLayerSurfaceData = (baseTemp: number, depth: number, lat: number, lng: number, isCoastline: boolean = false): LayerSurfaceData => {
  const gridSize = 20;
  const data: LayerSurfaceData = [];

  // Create unique phase shifts based on location and depth
  const phaseX = (lat * 0.5 + depth * 0.1) % (Math.PI * 2);
  const phaseY = (lng * 0.5 + depth * 0.15) % (Math.PI * 2);

  for (let y = 0; y < gridSize; y++) {
    const row: (number | null)[] = [];
    for (let x = 0; x < gridSize; x++) {
      // Normalize coordinates to [0, 1]
      const nx = x / (gridSize - 1);
      const ny = y / (gridSize - 1);

      // Combined wave function with phase shifts for unique topographical variation
      const wave1 = Math.sin(nx * Math.PI * 2.5 + phaseX) * Math.cos(ny * Math.PI * 2.0 + phaseY) * 0.15;
      const wave2 = Math.cos(nx * Math.PI * 1.8 + phaseY) * Math.sin(ny * Math.PI * 3.0 + phaseX) * 0.10;
      const wave3 = Math.sin((nx + ny) * Math.PI * 1.5 + (phaseX * phaseY)) * 0.05;

      const variation = wave1 + wave2 + wave3;
      let val: number | null = baseTemp + variation;
      
      if (isCoastline) {
        if (x + y < 12 || (Math.random() < 0.1)) {
          val = null;
        }
      }
      
      row.push(val);
    }
    data.push(row);
  }

  return data;
};

// ─── Color Utilities ─────────────────────────────────────────────────────────

const getColorForTemp = (temp: number): THREE.Color => {
  const colorHot = new THREE.Color('#ffa500'); // Orange for warm (30°C)
  const colorCold = new THREE.Color('#4b0082'); // Indigo for cold (4°C)
  // Map roughly 4°C - 30°C to 0 - 1
  const ratio = Math.min(Math.max((temp - 4) / 26, 0), 1);
  return colorCold.clone().lerp(colorHot, ratio);
};

/**
 * Returns a Viridis-like color for fine-grained surface temperature mapping.
 * `t` should be normalized to [0, 1].
 */
const getViridisColor = (t: number): THREE.Color => {
  const clamped = Math.min(Math.max(t, 0), 1);

  // 5-stop Viridis-inspired palette
  const stops = [
    { pos: 0.0, color: new THREE.Color('#440154') },   // deep purple
    { pos: 0.25, color: new THREE.Color('#31688e') },   // teal-blue
    { pos: 0.5, color: new THREE.Color('#35b779') },    // green
    { pos: 0.75, color: new THREE.Color('#fde725') },   // yellow
    { pos: 1.0, color: new THREE.Color('#ffa500') },    // orange (warm)
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].pos && clamped <= stops[i + 1].pos) {
      const localT = (clamped - stops[i].pos) / (stops[i + 1].pos - stops[i].pos);
      return stops[i].color.clone().lerp(stops[i + 1].color, localT);
    }
  }

  return stops[stops.length - 1].color.clone();
};

// ─── Task 3: SurfacePlot Component ──────────────────────────────────────────

// ─── 3D Search Pin Marker ────────────────────────────────────────────────────

interface SearchPinProps {
  position: [number, number, number];
  temperature: number;
}

const SearchPin: React.FC<SearchPinProps> = ({ position, temperature }) => {

  const lineLength = 1.5;
  const lineRadius = 0.015;
  const ballRadius = 0.08;
  const surfaceOffset = 0.02; // Small offset to prevent clipping into the flat triangles

  return (
    <group position={[position[0], position[1], position[2] + surfaceOffset]}>
      {/* Thin white line touching the surface */}
      <mesh position={[0, 0, lineLength / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[lineRadius, lineRadius, lineLength, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Small red ball on top (Glassy effect) */}
      <mesh position={[0, 0, lineLength + ballRadius]}>
        <sphereGeometry args={[ballRadius, 32, 32]} />
        <meshPhysicalMaterial
          color="#ff3333"
          emissive="#ff0000"
          emissiveIntensity={0.4}
          roughness={0.05}
          metalness={0.1}
          transmission={0.9}
          thickness={0.5}
          ior={1.5}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transparent
        />
      </mesh>

      {/* Temperature Label */}
      <Billboard position={[0.2, 0, lineLength + ballRadius]}>
        <Text
          fontSize={0.18}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {`${temperature.toFixed(2)} °C`}
        </Text>
      </Billboard>
    </group>
  );
};

interface SurfacePlotProps {
  layerData: LayerSurfaceData;
  baseTemp: number;
  latRange?: [number, number]; // [minLat, maxLat]
  lngRange?: [number, number]; // [minLng, maxLng]
  searchedLocation?: { lat: number; lon: number } | null;
}

const SurfacePlot: React.FC<SurfacePlotProps> = ({
  layerData,
  baseTemp,
  latRange = [10, 15],
  lngRange = [85, 90],
  searchedLocation,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const userInteractedRef = useRef(false);
  const { gl } = useThree();

  const gridSize = 20;
  const segments = gridSize - 1; // 19 segments for 20 vertices
  const planeSize = 5;
  const zScale = 5; // Exaggeration factor for tiny temp variations

  // Stop auto-rotation when the user interacts
  const handleInteraction = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handleInteraction);
    canvas.addEventListener('wheel', handleInteraction);
    return () => {
      canvas.removeEventListener('pointerdown', handleInteraction);
      canvas.removeEventListener('wheel', handleInteraction);
    };
  }, [gl, handleInteraction]);

  // Compute min/max for color normalization
  const { minTemp, maxTemp } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const t = layerData[y][x];
        if (t !== null) {
          if (t < min) min = t;
          if (t > max) max = t;
        }
      }
    }
    return { minTemp: min === Infinity ? baseTemp : min, maxTemp: max === -Infinity ? baseTemp : max };
  }, [layerData, baseTemp]);

  // Build geometry attributes
  const { positions, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments);
    const posArray = geo.attributes.position.array as Float32Array;
    const colorArray = new Float32Array(posArray.length); // RGB per vertex

    const tempRange = maxTemp - minTemp || 1;

    for (let iy = 0; iy < gridSize; iy++) {
      for (let ix = 0; ix < gridSize; ix++) {
        const vertexIndex = iy * gridSize + ix;
        const temp = layerData[iy][ix];

        if (temp === null) {
          // Average height of nearest non-null neighbors
          let sum = 0;
          let count = 0;
          const searchRadius = 3;
          for (let r = 1; r <= searchRadius; r++) {
            for (let dy = -r; dy <= r; dy++) {
              for (let dx = -r; dx <= r; dx++) {
                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                const ny = iy + dy;
                const nx = ix + dx;
                if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize) {
                  const neighborTemp = layerData[ny][nx];
                  if (neighborTemp !== null) {
                    sum += neighborTemp;
                    count++;
                  }
                }
              }
            }
            if (count > 0) break;
          }
          const avgTemp = count > 0 ? sum / count : baseTemp;
          
          posArray[vertexIndex * 3 + 2] = (avgTemp - baseTemp) * zScale;
          
          colorArray[vertexIndex * 3 + 0] = 0.5;
          colorArray[vertexIndex * 3 + 1] = 0.5;
          colorArray[vertexIndex * 3 + 2] = 0.5;
        } else {
          // Modify Z (index 2) — PlaneGeometry lies on XY, Z is the "up" axis
          posArray[vertexIndex * 3 + 2] = (temp - baseTemp) * zScale;

          // Color
          const normalizedT = tempRange > 0 ? (temp - minTemp) / tempRange : 0.5;
          const color = getViridisColor(normalizedT);
          colorArray[vertexIndex * 3 + 0] = color.r;
          colorArray[vertexIndex * 3 + 1] = color.g;
          colorArray[vertexIndex * 3 + 2] = color.b;
        }
      }
    }

    geo.dispose();

    return {
      positions: new Float32Array(posArray),
      colors: colorArray,
    };
  }, [layerData, baseTemp, minTemp, maxTemp]);

  // Apply geometry modifications
  useEffect(() => {
    if (!meshRef.current) return;

    const geo = meshRef.current.geometry as THREE.PlaneGeometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < positions.length; i++) {
      (posAttr.array as Float32Array)[i] = positions[i];
    }
    posAttr.needsUpdate = true;

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
  }, [positions, colors]);

  // Gentle spin animation — stops when user interacts
  useFrame((_, delta) => {
    if (groupRef.current && !userInteractedRef.current) {
      groupRef.current.rotation.z += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={meshRef}>
        <planeGeometry args={[planeSize, planeSize, segments, segments]} />
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
          flatShading={false}
        />
      </mesh>

      {/* Wireframe overlay for depth perception */}
      <mesh>
        <planeGeometry args={[planeSize, planeSize, segments, segments]} />
        <meshBasicMaterial
          wireframe
          color="#ffffff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Longitude labels along the X-axis (front edge) */}
      {Array.from({ length: 6 }, (_, i) => {
        const t = i / 5; // 0 to 1
        const xPos = -planeSize / 2 + t * planeSize;
        const lng = lngRange[0] + t * (lngRange[1] - lngRange[0]);
        return (
          <Billboard key={`lng-${i}`} position={[xPos, -planeSize / 2 - 0.35, 0]}>
            <Text fontSize={0.18} color="rgba(255, 255, 255, 0.6)" anchorX="center" anchorY="top">
              {`${lng.toFixed(1)}°E`}
            </Text>
          </Billboard>
        );
      })}

      {/* Latitude labels along the Y-axis (left edge) */}
      {Array.from({ length: 6 }, (_, i) => {
        const t = i / 5; // 0 to 1
        const yPos = -planeSize / 2 + t * planeSize;
        const lat = latRange[0] + t * (latRange[1] - latRange[0]);
        return (
          <Billboard key={`lat-${i}`} position={[-planeSize / 2 - 0.35, yPos, 0]}>
            <Text fontSize={0.18} color="rgba(255, 255, 255, 0.6)" anchorX="right" anchorY="middle">
              {`${lat.toFixed(1)}°N`}
            </Text>
          </Billboard>
        );
      })}

      {/* ── Searched Location 3D Marker ── */}
      {searchedLocation && (() => {
        const normLat = (searchedLocation.lat - latRange[0]) / (latRange[1] - latRange[0]);
        const normLon = (searchedLocation.lon - lngRange[0]) / (lngRange[1] - lngRange[0]);

        // Clamp to valid range
        if (normLat < 0 || normLat > 1 || normLon < 0 || normLon > 1) return null;

        // Map to local mesh coordinates
        const localX = (normLon - 0.5) * planeSize;
        const localY = (normLat - 0.5) * planeSize;

        // Bilinear interpolation to find Z height
        const gridSize = 20;
        const gx = normLon * (gridSize - 1);
        const gy = (1 - normLat) * (gridSize - 1);
        const ix = Math.min(Math.floor(gx), gridSize - 2);
        const iy = Math.min(Math.floor(gy), gridSize - 2);
        const fx = gx - ix;
        const fy = gy - iy;

        const getVal = (row: number, col: number) => {
          const v = layerData[row]?.[col];
          return v !== null && v !== undefined ? v : baseTemp;
        };

        const v00 = getVal(iy, ix);
        const v10 = getVal(iy, ix + 1);
        const v01 = getVal(iy + 1, ix);
        const v11 = getVal(iy + 1, ix + 1);

        const interpTemp = v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
        const zHeight = (interpTemp - baseTemp) * zScale;

        return <SearchPin position={[localX, localY, zHeight]} temperature={interpTemp} />;
      })()}
    </group>
  );
};

// ─── Existing Components ────────────────────────────────────────────────────

interface LayerProps {
  depth: number;
  temp: number;
  index: number;
  onClick: () => void;
}

const Layer: React.FC<LayerProps> = ({ depth, temp, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  // Rounded rectangle shape
  const roundedRectShape = useMemo(() => {
    const w = 6, h = 6, r = 0.4;
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
  }, []);

  // Use a logarithmic scale to smoothly separate the shallow layers.
  // Math.log(depth / 40 + 1) ensures 0m to 5m doesn't have a massive jump, 
  // keeping the gap near 0.32 units, which perfectly fits the 0.25 font size.
  const normalizedDepth = Math.log(depth / 40 + 1) / Math.log(1000 / 40 + 1);
  const yPos = 4.5 - (normalizedDepth * 9); // Scale total height to 9 units (4.5 to -4.5)
  const color = getColorForTemp(temp);

  return (
    <group position={[0, yPos, 0]}>
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (!pointerDownPos.current) return;
          const dx = e.clientX - pointerDownPos.current.x;
          const dy = e.clientY - pointerDownPos.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          pointerDownPos.current = null;
          // Only count as a click if pointer barely moved (not a drag/orbit)
          if (distance < 5) {
            onClick();
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <shapeGeometry args={[roundedRectShape]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={hovered ? 0.85 : 0.65}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          side={THREE.DoubleSide}
          emissive={hovered ? color : new THREE.Color('#000000')}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
        <Edges linewidth={1} color="#ffffff" transparent opacity={0.2} />
      </mesh>

      {/* Hover ring indicator */}
      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[2.8, 3.0, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      <group
        position={[-3.2, 0, 3.2]}
        onPointerDown={(e) => {
          e.stopPropagation();
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (!pointerDownPos.current) return;
          const dx = e.clientX - pointerDownPos.current.x;
          const dy = e.clientY - pointerDownPos.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          pointerDownPos.current = null;
          if (distance < 5) onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <Billboard>
          <Text
            fontSize={hovered ? 0.28 : 0.22}
            color={hovered ? '#00ff88' : 'rgba(255, 255, 255, 0.9)'}
            fontWeight={hovered ? 700 : 400}
            anchorX="right"
            anchorY="middle"
          >
            {`${depth}m`}
          </Text>
        </Billboard>
      </group>
      <group
        position={[3.2, 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          if (!pointerDownPos.current) return;
          const dx = e.clientX - pointerDownPos.current.x;
          const dy = e.clientY - pointerDownPos.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          pointerDownPos.current = null;
          if (distance < 5) onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <Billboard>
          <Text
            fontSize={hovered ? 0.28 : 0.22}
            color={hovered ? '#00ff88' : 'rgba(255, 255, 255, 0.9)'}
            fontWeight={hovered ? 700 : 400}
            anchorX="left"
            anchorY="middle"
          >
            {`${temp.toFixed(1)}°C`}
          </Text>
        </Billboard>
      </group>
    </group>
  );
};

// ─── Surface View Info Panel ─────────────────────────────────────────────────

interface SurfaceInfoProps {
  depth: number;
  baseTemp: number;
  layerData: LayerSurfaceData;
}

const SurfaceInfoOverlay: React.FC<SurfaceInfoProps> = ({ depth, baseTemp, layerData }) => {
  const { minTemp, maxTemp } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const row of layerData) {
      for (const t of row) {
        if (t !== null) {
          if (t < min) min = t;
          if (t > max) max = t;
        }
      }
    }
    return { minTemp: min === Infinity ? baseTemp : min, maxTemp: max === -Infinity ? baseTemp : max };
  }, [layerData, baseTemp]);

  return (
    <div style={{
      position: 'absolute',
      left: '24px',
      bottom: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: 'rgba(0, 0, 0, 0.5)',
      padding: '16px 20px',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      pointerEvents: 'none',
      minWidth: '240px',
      maxWidth: '300px',
    }}>
      <span style={{ color: '#8bb6d6', fontSize: '11px', letterSpacing: '1px', fontWeight: 600, textTransform: 'uppercase' }}>
        Layer Detail
      </span>
      <span style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
        {depth}m depth
      </span>
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Base Temp</span>
        <span style={{ color: '#fff', fontWeight: 500, textAlign: 'right' }}>{baseTemp.toFixed(2)}°C</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Range</span>
        <span style={{ color: '#fff', fontWeight: 500, textAlign: 'right' }}>
          {minTemp.toFixed(2)} – {maxTemp.toFixed(2)}°C
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '12px' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>Resolution</span>
        <span style={{ color: '#fff', fontWeight: 500, textAlign: 'right' }}>0.25° (20×20)</span>
      </div>
    </div>
  );
};

// ─── Surface Colorbar ────────────────────────────────────────────────────────

const SurfaceColorbar: React.FC<{ minTemp: number; maxTemp: number }> = ({ minTemp, maxTemp }) => (
  <div style={{
    position: 'absolute',
    right: '32px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.4)',
    padding: '16px 12px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(4px)',
    pointerEvents: 'none'
  }}>
    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600 }}>
      {maxTemp.toFixed(2)}°C
    </span>
    <div style={{
      width: '12px',
      height: '180px',
      background: 'linear-gradient(to bottom, #ffa500, #fde725, #35b779, #31688e, #440154)',
      borderRadius: '6px',
      boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)'
    }} />
    <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600 }}>
      {minTemp.toFixed(2)}°C
    </span>
    <span style={{ color: '#8bb6d6', fontSize: '11px', marginTop: '4px', letterSpacing: '0.5px', fontWeight: 500 }}>
      TEMP
    </span>
  </div>
);

// ─── Raycast Fixer ─────────────────────────────────────────────────────────────
// Fixes R3F raycasting offset when CSS 100% scaling overrides the internal buffer size
const RaycastFixer = () => {
  const setEvents = useThree((state) => state.setEvents);
  const get = useThree((state) => state.get);
  
  useEffect(() => {
    const defaultCompute = get().events.compute;
    setEvents({
      compute: (event: any, state: any) => {
        const nativeEvent = event.nativeEvent || event;
        const { clientX, clientY } = nativeEvent;
        
        if (clientX === undefined) {
          if (defaultCompute) return defaultCompute(event, state);
          return;
        }
        
        const rect = state.gl.domElement.getBoundingClientRect();
        state.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        state.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        state.raycaster.setFromCamera(state.pointer, state.camera);
      }
    });
    
    return () => {
      if (defaultCompute) {
        setEvents({ compute: defaultCompute });
      }
    };
  }, [setEvents, get]);
  
  return null;
};

// ─── Main DepthModal Component ──────────────────────────────────────────────

const DepthModal: React.FC<DepthModalProps> = ({ isOpen, onClose, predictions, latRange, lngRange, searchedLocation }) => {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  const [surfaceData, setSurfaceData] = useState<{
    layerData: LayerSurfaceData;
    baseTemp: number;
    depth: number;
  } | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedLayer(null);
      setSurfaceData(null);
      setIsGenerating(false);
      setIsProfileLoading(false);
    } else {
      setIsProfileLoading(true);
      const timer = setTimeout(() => {
        setIsProfileLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedLayer === null || !predictions) {
      setSurfaceData(null);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);

    const layerIndex = predictions.depths_m.indexOf(selectedLayer);
    if (layerIndex === -1) {
      setIsGenerating(false);
      return;
    }

    const baseTemp = predictions.temps_celsius[layerIndex];
    const lat = latRange ? latRange[0] : 0;
    const lng = lngRange ? lngRange[0] : 0;
    
    const isCoastline = (latRange && lngRange) 
      ? (latRange[0] === 15 && lngRange[0] === 80) || (latRange[0] === 10 && lngRange[0] === 75) || (latRange[0] === 20 && lngRange[0] === 85) || (latRange[0] === 15 && lngRange[0] === 85)
      : false;
      
    const layerData = generateLayerSurfaceData(baseTemp, selectedLayer, lat, lng, isCoastline);

    const timer = setTimeout(() => {
      setSurfaceData({ layerData, baseTemp, depth: selectedLayer });
      setIsGenerating(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [selectedLayer, predictions, latRange, lngRange]);

  const handleLayerClick = (depth: number) => {
    setSelectedLayer(depth);
  };

  const handleBack = () => {
    setSelectedLayer(null);
  };

  const surfaceMinMax = useMemo(() => {
    if (!surfaceData) return { min: 0, max: 1 };
    let min = Infinity;
    let max = -Infinity;
    for (const row of surfaceData.layerData) {
      for (const t of row) {
        if (t !== null) {
          if (t < min) min = t;
          if (t > max) max = t;
        }
      }
    }
    return { min: min === Infinity ? surfaceData.baseTemp : min, max: max === -Infinity ? surfaceData.baseTemp : max };
  }, [surfaceData]);

  const isSurfaceView = selectedLayer !== null && surfaceData !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 100,
            paddingRight: '350px'
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              width: '90%',
              maxWidth: '900px',
              height: '80%',
              maxHeight: '700px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Back button when in surface view */}
                <AnimatePresence>
                  {isSurfaceView && (
                    <motion.button
                      initial={{ opacity: 0, x: -10, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      onClick={handleBack}
                      className="pill-button"
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(139, 182, 214, 0.2)',
                        border: '1px solid rgba(139, 182, 214, 0.4)',
                        color: '#8bb6d6',
                      }}
                    >
                      ← Back
                    </motion.button>
                  )}
                </AnimatePresence>

                <h2 style={{ margin: 0, fontSize: '20px', color: '#8bb6d6', fontWeight: 500 }}>
                  {isSurfaceView
                    ? `Thermocline Surface — ${surfaceData.depth}m`
                    : 'Subsurface 3D Profile'
                  }
                </h2>
              </div>
              <button
                onClick={onClose}
                className="pill-button"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Close
              </button>
            </div>

            {/* 3D Canvas Area */}
            <div className="depth-modal-canvas-container" style={{ flex: 1, position: 'relative' }}>
              <style>{`
                .depth-modal-canvas-container canvas {
                  width: 100% !important;
                  height: 100% !important;
                }
              `}</style>
              <AnimatePresence mode="wait">
                {isProfileLoading ? (
                  <motion.div
                    key="profile-loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
                  >
                    <div style={{
                      width: '40px', height: '40px',
                      borderRadius: '50%',
                      border: '3px solid rgba(139, 182, 214, 0.2)',
                      borderTopColor: '#8bb6d6',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ color: '#8bb6d6', fontSize: '13px', fontWeight: 500, letterSpacing: '1px' }}>
                      RENDERING 3D SUBSURFACE PROFILE...
                    </span>
                    <style>{`
                      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                  </motion.div>
                ) : isGenerating ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}
                  >
                    <div style={{
                      width: '40px', height: '40px',
                      borderRadius: '50%',
                      border: '3px solid rgba(139, 182, 214, 0.2)',
                      borderTopColor: '#8bb6d6',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ color: '#8bb6d6', fontSize: '13px', fontWeight: 500, letterSpacing: '1px' }}>
                      RENDERING THERMOCLINE SURFACE...
                    </span>
                    <style>{`
                      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                  </motion.div>
                ) : isSurfaceView ? (
                  /* ── Surface Plot View ── */
                  <motion.div
                    key="surface-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    <Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [5, 5, 5], fov: 50 }}>
                      <RaycastFixer />
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[10, 10, 5]} intensity={1.5} />
                      <pointLight position={[-5, 5, -5]} color="#35b779" intensity={0.8} />
                      <spotLight position={[0, 8, 0]} angle={0.6} penumbra={1} intensity={1} />
                      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
                      <SurfacePlot
                        layerData={surfaceData.layerData}
                        baseTemp={surfaceData.baseTemp}
                        latRange={latRange || [10, 15]}
                        lngRange={lngRange || [85, 90]}
                        searchedLocation={searchedLocation}
                      />
                    </Canvas>

                    {/* Surface info overlay */}
                    <SurfaceInfoOverlay
                      depth={surfaceData.depth}
                      baseTemp={surfaceData.baseTemp}
                      layerData={surfaceData.layerData}
                    />

                    {/* Surface colorbar */}
                    <SurfaceColorbar minTemp={surfaceMinMax.min} maxTemp={surfaceMinMax.max} />

                    {/* Click hint */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(4px)',
                      pointerEvents: 'none',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                        Drag to orbit • Scroll to zoom • Z-axis exaggerated ×5
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Stacked Planes View ── */
                  <motion.div
                    key="stacked-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    <Canvas style={{ width: '100%', height: '100%' }} camera={{ position: [8, 5, 8], fov: 50 }}>
                      <RaycastFixer />
                      <ambientLight intensity={0.4} />
                      <directionalLight position={[10, 10, 5]} intensity={1.5} />
                      <pointLight position={[-10, -10, -10]} color="#4b0082" intensity={2} />
                      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={1} />
                      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
                      <group position={[-1.5, 0, 0]}>
                        {predictions?.depths_m.map((depth, index) => (
                          <Layer
                            key={depth}
                            depth={depth}
                            temp={predictions.temps_celsius[index]}
                            index={index}
                            onClick={() => handleLayerClick(depth)}
                          />
                        ))}
                      </group>
                    </Canvas>

                    {/* Colorbar Legend Overlay */}
                    <div style={{
                      position: 'absolute',
                      right: '32px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '16px 12px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(4px)',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600 }}>30°C</span>
                      <div style={{
                        width: '12px',
                        height: '180px',
                        background: 'linear-gradient(to bottom, #ffa500, #4b0082)',
                        borderRadius: '6px',
                        boxShadow: 'inset 0 0 4px rgba(0,0,0,0.5)'
                      }} />
                      <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 600 }}>4°C</span>
                      <span style={{ color: '#8bb6d6', fontSize: '11px', marginTop: '4px', letterSpacing: '0.5px', fontWeight: 500 }}>TEMP</span>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hint footer — below the canvas area */}
            {!isSurfaceView && (
              <div style={{
                padding: '10px 0',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.03)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                  Click any layer to explore its temperature surface
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DepthModal;