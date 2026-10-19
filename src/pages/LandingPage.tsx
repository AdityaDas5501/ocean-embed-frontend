import React, { useEffect, useRef, useState, useMemo, Suspense } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text as DreiText } from "@react-three/drei";
import * as THREE from "three";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  type MotionValue,
  cubicBezier,
} from "framer-motion";
import {
  Waves,
  Menu,
  X,
} from "lucide-react";
import Logo from "../assets/logo.svg";
import satelliteSrc from "../assets/images/satellite-wireframe.svg";
import argoSrc from "../assets/images/argo-float.svg";

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);
const easeExplode = cubicBezier(0.16, 1, 0.3, 1);

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

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
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
  { depth: 10, temp: 29.1 },
  { depth: 25, temp: 28.5 },
  { depth: 50, temp: 27.0 },
  { depth: 100, temp: 22.8 },
  { depth: 150, temp: 16.5 },
  { depth: 200, temp: 14.2 },
  { depth: 250, temp: 12.8 },
  { depth: 300, temp: 11.2 },
  { depth: 400, temp: 9.8 },
  { depth: 500, temp: 8.4 },
  { depth: 600, temp: 7.2 },
  { depth: 700, temp: 6.2 },
  { depth: 850, temp: 5.4 },
  { depth: 1000, temp: 4.8 },
];

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

// ─── ACT 02: HIGH-FIDELITY CSS-3D ISOMETRIC WAFER STACK (0.48 – 0.76) ───
const MILESTONE_SLICES = [
  { depth: 0, temp: 29.4, index: 0, tag: "SURFACE" },
  { depth: 100, temp: 22.8, index: 4, tag: "THERMOCLINE" },
  { depth: 250, temp: 12.8, index: 7, tag: "MESOPELAGIC" },
  { depth: 500, temp: 8.4, index: 10, tag: "DEEP LAYER", isStaggered: true },
  { depth: 1000, temp: 4.8, index: 14, tag: "ABYSSAL" },
];

const getSliceGradientTheme = (depth: number) => {
  if (depth <= 25) {
    return {
      bg: "linear-gradient(135deg, rgba(251, 191, 36, 0.44) 0%, rgba(245, 158, 11, 0.16) 100%)",
      border: "rgba(251, 191, 36, 0.55)",
      accent: "#fbbf24",
      glow: "rgba(251, 191, 36, 0.28)",
      title: "Solar Mixed Layer",
    };
  } else if (depth <= 50) {
    return {
      bg: "linear-gradient(135deg, rgba(52, 211, 153, 0.38) 0%, rgba(16, 185, 129, 0.14) 100%)",
      border: "rgba(52, 211, 153, 0.50)",
      accent: "#34d399",
      glow: "rgba(52, 211, 153, 0.24)",
      title: "Upper Epipelagic",
    };
  } else if (depth === 100) {
    return {
      bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.44) 0%, rgba(6, 182, 212, 0.20) 100%)",
      border: "rgba(52, 211, 153, 0.85)",
      accent: "#10b981",
      glow: "rgba(16, 185, 129, 0.38)",
      title: "Thermocline Core",
    };
  } else if (depth <= 200) {
    return {
      bg: "linear-gradient(135deg, rgba(56, 189, 248, 0.36) 0%, rgba(2, 132, 199, 0.14) 100%)",
      border: "rgba(56, 189, 248, 0.50)",
      accent: "#38bdf8",
      glow: "rgba(56, 189, 248, 0.24)",
      title: "Upper Mesopelagic",
    };
  } else if (depth <= 350) {
    return {
      bg: "linear-gradient(135deg, rgba(129, 140, 248, 0.34) 0%, rgba(99, 102, 241, 0.12) 100%)",
      border: "rgba(129, 140, 248, 0.50)",
      accent: "#818cf8",
      glow: "rgba(129, 140, 248, 0.22)",
      title: "Mesopelagic Gradient",
    };
  } else {
    return {
      bg: "linear-gradient(135deg, rgba(192, 132, 252, 0.32) 0%, rgba(126, 34, 206, 0.15) 100%)",
      border: "rgba(192, 132, 252, 0.45)",
      accent: "#c084fc",
      glow: "rgba(192, 132, 252, 0.22)",
      title: "Abyssal Bathypelagic",
    };
  }
};

interface Css3DSliceProps {
  item: { depth: number; temp: number };
  index: number;
  p: MotionValue<number>;
  globalProgress?: MotionValue<number>;
  isMobile: boolean;
}

const Css3DSlice: React.FC<Css3DSliceProps> = ({
  item,
  index,
  p,
  globalProgress,
  isMobile,
}) => {
  const theme = getSliceGradientTheme(item.depth);

  const transform = useTransform(p, (val) => {
    // Stage 1: Close-Up Zoom-Out, Orbit & Full Explosion (p: 0.00 -> 0.52)
    const rawExplode = clamp(val / 0.52, 0, 1);
    const explodeT = easeExplode(rawExplode);
    const layerGap = explodeT * 18; // 0px -> 18px
    const baseY = (index - 7) * layerGap;

    let offsetY = baseY;
    let rotX = 25 + explodeT * 43; // 25deg -> 68deg
    let rotZ = -5 - explodeT * 43; // -5deg -> -48deg
    let s = 3.2 - explodeT * 2.25; // 3.2 -> 0.95

    if (val > 0.52 && val <= 0.64) {
      // Stage 2: Plateau Hold (p: 0.52 -> 0.64)
      rotZ = -48;
      rotX = 68;
      s = 0.95;
      offsetY = (index - 7) * 18;
    } else if (val > 0.64) {
      // Stage 3: Isolate 100m layer & Zoom into Act 03 (p: 0.64 -> 1.00)
      const isolateT = clamp((val - 0.64) / 0.36, 0, 1);

      if (index === 4) {
        // Isolated Slice 4 (100m Thermocline) - Glides smoothly into Act 03 starting transform by latest = 0.748!
        const centerT = clamp((isolateT - 0.25) / 0.65, 0, 1);
        const eCenter = centerT * centerT * (3 - 2 * centerT);
        offsetY = -54 * (1 - eCenter); // -54px -> 0px (vertical center!)
        rotZ = -48 + eCenter * 23; // -48deg -> -25deg (matches Act 03 starting azimuth!)
        rotX = 68 - eCenter * 46; // 68deg -> 22deg (matches Act 03 steep top-down starting pitch!)
        s = 0.95 + eCenter * 0.55; // 0.95 -> 1.50 (matches Act 03 initial scale!)
      } else if (index < 4) {
        // Upper slices (0m - 50m) fly upward into the air (-90px)
        const flyT = clamp(isolateT / 0.65, 0, 1);
        const eFly = flyT * flyT * (3 - 2 * flyT);
        offsetY = (index - 7) * 18 - 90 * eFly;
        rotZ = -48;
        rotX = 68;
        s = 0.95;
      } else {
        // Deeper slices (150m - 1000m) drop downward into abyss (+130px)
        const flyT = clamp(isolateT / 0.65, 0, 1);
        const eFly = flyT * flyT * (3 - 2 * flyT);
        offsetY = (index - 7) * 18 + 130 * eFly;
        rotZ = -48;
        rotX = 68;
        s = 0.95;
      }
    }

    return `translate3d(0px, ${offsetY.toFixed(2)}px, 0px) rotateX(${rotX.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${s.toFixed(3)})`;
  });

  const opacity = useTransform(globalProgress || p, (latest) => {
    const isGlobal = globalProgress !== undefined;
    const pVal = isGlobal ? clamp((latest - 0.48) / 0.28, 0, 1) : latest;

    if (pVal <= 0.64) {
      return 1;
    }

    // Stage 3
    const isolateT = clamp((pVal - 0.64) / 0.36, 0, 1);

    if (index === 4) {
      // Slice 4 stays at opacity 1 until precisely handing off to flat 3D canvas (0.748 -> 0.762)
      if (isGlobal) {
        if (latest <= 0.748) return 1;
        if (latest >= 0.762) return 0;
        // Clean linear drop to 0 before extrusion begins
        const transitionT = (latest - 0.748) / (0.762 - 0.748);
        return 1 - transitionT;
      }
      if (latest < 0.92) return 1;
      const dissolveT = clamp((latest - 0.92) / 0.08, 0, 1);
      const eDissolve = dissolveT * dissolveT * (3 - 2 * dissolveT);
      return 1 - eDissolve;
    } else {
      // All other 14 slices fly away and dissolve over isolateT: 0.0 -> 0.65
      const flyT = clamp(isolateT / 0.65, 0, 1);
      const eFly = flyT * flyT * (3 - 2 * flyT);
      return 1 - eFly;
    }
  });

  const boxShadow = useTransform(p, (val) => {
    if (index !== 4) {
      return `0 4px 18px rgba(0, 0, 0, 0.45), inset 0 0 16px ${theme.glow}`;
    }
    if (val <= 0.64) {
      return `0 4px 18px rgba(0, 0, 0, 0.45), inset 0 0 16px ${theme.glow}`;
    }
    const isolateT = clamp((val - 0.64) / 0.36, 0, 1);
    const glowT = clamp(isolateT / 0.35, 0, 1);
    const eGlow = glowT * glowT * (3 - 2 * glowT);
    const alpha = (0.45 * eGlow).toFixed(2);
    const innerAlpha = (0.35 * eGlow).toFixed(2);
    return `0 0 35px rgba(16, 185, 129, ${alpha}), 0 8px 24px rgba(0, 0, 0, 0.6), inset 0 0 25px rgba(16, 185, 129, ${innerAlpha})`;
  });

  const border = useTransform(p, (val) => {
    if (index !== 4 || val <= 0.64) return `1.5px solid ${theme.border}`;
    const isolateT = clamp((val - 0.64) / 0.36, 0, 1);
    return isolateT > 0.25 ? "1.5px solid rgba(52, 211, 153, 0.95)" : `1.5px solid ${theme.border}`;
  });

  const wireGridOpacity = useTransform(p, (val) => {
    if (index !== 4 || val < 0.64) return 0;
    const isolateT = clamp((val - 0.64) / 0.36, 0, 1);
    return clamp((isolateT - 0.15) / 0.30, 0, 1);
  });

  const zIndex = useTransform(p, (val) => (val > 0.64 && index === 4 ? 30 : 20 - index));

  const sliceWidth = isMobile ? "180px" : "230px";
  const sliceHeight = isMobile ? "180px" : "230px";
  const halfOffset = isMobile ? "-90px" : "-115px";

  return (
    <motion.div
      style={{
        position: "absolute",
        width: sliceWidth,
        height: sliceHeight,
        left: "50%",
        top: "50%",
        marginLeft: halfOffset,
        marginTop: halfOffset,
        borderRadius: "14px",
        transformOrigin: "center center",
        transform,
        opacity,
        background: theme.bg,
        border,
        boxShadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex,
      }}
    >
      {/* Subtle inner thermal contours / cross-grid for physical oceanographic feel */}
      <div
        style={{
          position: "absolute",
          inset: "14px",
          borderRadius: "9px",
          border: `1px dashed ${theme.border}`,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${theme.accent}33 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Wire gridlines etched across isolated 100m slice (Index 4) */}
      {index === 4 && (
        <motion.div
          style={{
            position: "absolute",
            inset: "8px",
            borderRadius: "10px",
            pointerEvents: "none",
            opacity: wireGridOpacity,
            backgroundImage: `
              linear-gradient(to right, rgba(52, 211, 153, 0.45) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(52, 211, 153, 0.45) 1px, transparent 1px)
            `,
            backgroundSize: isMobile ? "16px 16px" : "20px 20px",
            boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.35)",
          }}
        >
          {/* Micro corner coordinate brackets */}
          <div style={{ position: "absolute", top: 3, left: 3, width: 8, height: 8, borderTop: "2px solid #34d399", borderLeft: "2px solid #34d399" }} />
          <div style={{ position: "absolute", top: 3, right: 3, width: 8, height: 8, borderTop: "2px solid #34d399", borderRight: "2px solid #34d399" }} />
          <div style={{ position: "absolute", bottom: 3, left: 3, width: 8, height: 8, borderBottom: "2px solid #34d399", borderLeft: "2px solid #34d399" }} />
          <div style={{ position: "absolute", bottom: 3, right: 3, width: 8, height: 8, borderBottom: "2px solid #34d399", borderRight: "2px solid #34d399" }} />
          {/* Center coordinate crosshair */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 14, height: 14 }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#34d399" }} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "#34d399" }} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

interface MilestoneSliceLabelRowProps {
  item: { depth: number; temp: number; index: number; tag: string; isStaggered?: boolean };
  p: MotionValue<number>;
  isMobile: boolean;
}

const MilestoneSliceLabelRow: React.FC<MilestoneSliceLabelRowProps> = ({
  item,
  p,
  isMobile,
}) => {
  const theme = getSliceGradientTheme(item.depth);

  const transform = useTransform(p, (val) => {
    const rawExplode = clamp(val / 0.52, 0, 1);
    const explodeT = easeExplode(rawExplode);
    const gap = explodeT * 18;
    const baseY = (item.index - 7) * gap;

    if (val <= 0.64) {
      return `translateY(-50%) translateY(${baseY.toFixed(1)}px)`;
    }

    const isolateT = clamp((val - 0.64) / 0.36, 0, 1);

    if (item.index === 4) {
      const centerT = clamp((isolateT - 0.30) / 0.70, 0, 1);
      const eCenter = centerT * centerT * (3 - 2 * centerT);
      const y = -54 * (1 - eCenter);
      return `translateY(-50%) translateY(${y.toFixed(1)}px)`;
    } else if (item.index < 4) {
      const flyT = clamp(isolateT / 0.65, 0, 1);
      const eFly = flyT * flyT * (3 - 2 * flyT);
      const y = (item.index - 7) * 18 - 90 * eFly;
      return `translateY(-50%) translateY(${y.toFixed(1)}px)`;
    } else {
      const flyT = clamp(isolateT / 0.65, 0, 1);
      const eFly = flyT * flyT * (3 - 2 * flyT);
      const y = (item.index - 7) * 18 + 130 * eFly;
      return `translateY(-50%) translateY(${y.toFixed(1)}px)`;
    }
  });

  const opacity = useTransform(p, (val) => {
    const rawExplode = clamp(val / 0.52, 0, 1);
    const explodeT = easeExplode(rawExplode);
    // Keep milestone labels hidden (opacity: 0) while explodeT < 0.40, fade in cleanly between 0.40 -> 0.55
    const fadeIn = clamp((explodeT - 0.40) / 0.15, 0, 1);

    if (val <= 0.64) {
      return fadeIn;
    }

    const isolateT = clamp((val - 0.64) / 0.36, 0, 1);

    if (item.index === 4) {
      // 100m stays visible until final 12% (p: 0.88 -> 1.00)
      if (val < 0.88) return fadeIn;
      const dissolveT = clamp((val - 0.88) / 0.12, 0, 1);
      const eDissolve = dissolveT * dissolveT * (3 - 2 * dissolveT);
      return fadeIn * (1 - eDissolve);
    } else {
      // Non-100m fade out over isolateT: 0.0 -> 0.65
      const flyT = clamp(isolateT / 0.65, 0, 1);
      const eFly = flyT * flyT * (3 - 2 * flyT);
      return fadeIn * (1 - eFly);
    }
  });

  const leaderLineWidth = isMobile ? 12 : item.isStaggered ? 36 : 20;

  return (
    <motion.div
      style={{
        position: "absolute",
        left: isMobile ? "calc(50% + 72px)" : "calc(50% + 140px)",
        top: "50%",
        transform,
        opacity,
        display: "flex",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 35,
        whiteSpace: "nowrap",
      }}
    >
      {/* Sleek connector line extending from slice edge to badge */}
      <div
        style={{
          width: `${leaderLineWidth}px`,
          height: "1.5px",
          background: `linear-gradient(90deg, ${theme.accent} 0%, rgba(255,255,255,0.7) 100%)`,
          boxShadow: `0 0 6px ${theme.accent}`,
          flexShrink: 0,
        }}
      />

      {/* High-contrast Glassmorphic Pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: isMobile ? "6px" : "8px",
          padding: isMobile ? "4px 8px" : "6px 13px",
          borderRadius: "9px",
          background: "rgba(3, 14, 28, 0.95)",
          border: `1.5px solid ${theme.border}`,
          boxShadow: `0 8px 24px rgba(0, 0, 0, 0.8), 0 0 14px ${theme.glow}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Glowing Indicator Dot */}
        <span
          style={{
            display: "inline-block",
            width: isMobile ? "5px" : "7px",
            height: isMobile ? "5px" : "7px",
            borderRadius: "50%",
            background: theme.accent,
            boxShadow: `0 0 8px ${theme.accent}`,
            flexShrink: 0,
          }}
        />

        {/* Depth */}
        <span
          style={{
            fontFamily: "Inter, monospace",
            fontSize: isMobile ? "12px" : "14.5px",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "0.03em",
          }}
        >
          {item.depth}m
        </span>

        {/* Divider */}
        <span
          style={{
            fontSize: isMobile ? "10px" : "12px",
            color: "rgba(255, 255, 255, 0.35)",
            fontWeight: 400,
          }}
        >
          /
        </span>

        {/* Temperature */}
        <span
          style={{
            fontFamily: "Inter, monospace",
            fontSize: isMobile ? "12px" : "14.5px",
            fontWeight: 700,
            color: theme.accent,
            letterSpacing: "0.02em",
          }}
        >
          {item.temp.toFixed(1)}°C
        </span>

        {/* Layer Tag (Desktop only) */}
        {!isMobile && (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              fontWeight: 700,
              color: "rgba(186, 230, 253, 0.7)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginLeft: "3px",
              paddingLeft: "6px",
              borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            {item.tag}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export const IsometricCss3DSlicesStack: React.FC<{
  progress: MotionValue<number>;
  isMobile: boolean;
}> = ({ progress, isMobile }) => {
  // Local progress p of Act 02 normalized from 0.00 to 1.00 (spanning global 0.48 to 0.76)
  const p = useTransform(progress, [0.48, 0.76], [0, 1], { clamp: true });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: "1200px",
        perspectiveOrigin: "50% 50%",
        transformStyle: "preserve-3d",
      }}
    >
      {/* 15 3D Slices Stack */}
      {STANDARD_DEPTHS_LIST.map((item, index) => (
        <Css3DSlice
          key={item.depth}
          item={item}
          index={index}
          p={p}
          globalProgress={progress}
          isMobile={isMobile}
        />
      ))}

      {/* Prominent, Razor-Sharp Milestone Depth & Temperature Labels */}
      {MILESTONE_SLICES.map((item) => (
        <MilestoneSliceLabelRow
          key={item.depth}
          item={item}
          p={p}
          isMobile={isMobile}
        />
      ))}
    </div>
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
    <group>
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

interface ThermoclineTopographicSceneProps {
  terrainProgress?: number;
  progress?: MotionValue<number>;
  onProjectedCoords?: (peak: [number, number], trough: [number, number], deployProgress: number) => void;
}

const ThermoclineTopographicScene: React.FC<ThermoclineTopographicSceneProps> = ({
  terrainProgress = 1,
  progress,
}) => {
  const size = 5;
  const gridRes = THERMOCLINE_GRID_DATA.size;
  const meanTemp = THERMOCLINE_GRID_DATA.meanTemp;
  const zScale = 0.58;
  const groupRef = useRef<THREE.Group>(null);
  const lastDispRef = useRef<number>(-1);

  // Precomputed baseline topographic heights (displacementScale = 1.0)
  const baseHeights = useMemo(() => {
    const heights = new Float32Array(gridRes * gridRes);
    for (let y = 0; y < gridRes; y++) {
      for (let x = 0; x < gridRes; x++) {
        const i = y * gridRes + x;
        const t = THERMOCLINE_GRID_DATA.grid[y][x];
        heights[i] = (t - meanTemp) * zScale;
      }
    }
    return heights;
  }, [gridRes, meanTemp]);

  // Mesh geometry initialized as a COMPLETELY FLAT 2D plane matching the 100m CSS layer
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
        const norm = Math.max(0, Math.min(1, (t - minTemp) / range));
        const color = getViridisColor(norm);

        // Initially Z is 0.0 (perfect flat 2D slice)
        pos.setZ(i, 0.0);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [gridRes, size]);

  // CONTINUOUS CINEMATIC FLIGHT & DYNAMIC GEOMETRY MORPH
  useFrame(({ camera }) => {
    const p = progress ? progress.get() : lerp(0.76, 1.00, terrainProgress);
    // Act 03 scroll progress normalized from 0.00 to 1.00 (spanning global 0.762 to 1.00)
    // Ensures displacementScale is strictly 0.0 until CSS layer has completely dissolved!
    const act3Progress = clamp((p - 0.762) / (1.00 - 0.762), 0, 1);

    // 1. Dynamic Extrusion: flat plane (displacementScale = 0.0) -> full mountains (1.0)
    // Extrusion finishes smoothly by act3Progress = 0.35
    const morphT = clamp(act3Progress / 0.35, 0, 1);
    const eMorph = morphT * morphT * (3 - 2 * morphT);
    const displacementScale = eMorph;

    if (Math.abs(displacementScale - lastDispRef.current) > 0.0005) {
      lastDispRef.current = displacementScale;
      const pos = geometry.attributes.position;
      for (let i = 0; i < gridRes * gridRes; i++) {
        pos.setZ(i, baseHeights[i] * displacementScale);
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    // 2. Continuous Camera Flight throughout entire Act 03 (Zero dead scroll space!):
    // Pitch: interpolates continuously from steep top-down view (22deg) down to dramatic low-angle profile (68deg)
    const pitchDeg = lerp(22, 68, act3Progress);
    const pitchRad = (pitchDeg * Math.PI) / 180;

    // Azimuth: rotates continuously by a full 45 degrees over the entire Act 03 scroll duration (-25deg -> +20deg)
    const startAzimuthDeg = -25;
    const azimuthDeg = startAzimuthDeg + act3Progress * 45;
    const azimuthRad = (azimuthDeg * Math.PI) / 180;

    // Spherical camera orbit with generous margins
    const radius = 7.7;
    const camY = radius * Math.cos(pitchRad);
    const horizDist = radius * Math.sin(pitchRad);
    const camX = horizDist * Math.sin(azimuthRad);
    const camZ = horizDist * Math.cos(azimuthRad);

    camera.position.set(camX, camY, camZ);
    const targetY = lerp(-0.25, 0.12, act3Progress);
    camera.lookAt(0, targetY, 0);
  });

  return (
    <group ref={groupRef} position={[0, -0.35, 0]}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* 3D Topographic Mesh */}
        <mesh geometry={geometry}>
          <meshStandardMaterial
            vertexColors
            roughness={0.25}
            metalness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Surface Axes with Lat / Lon Labels at Z=0 */}
        <SurfaceAxes size={5} latRange={[10, 15]} lngRange={[65, 70]} />
      </group>
    </group>
  );
};

export const VectorParticleCanvas: React.FC<{ metric: 'Currents' | 'Winds'; visible?: boolean }> = ({ metric, visible = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = container.clientWidth || 420);
    let height = (canvas.height = container.clientHeight || 260);

    const handleResize = () => {
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        width = canvas.width = w;
        height = canvas.height = h;
      }
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    const isCurrents = metric === 'Currents';
    const particleColor = isCurrents ? '#fde725' : '#d4a5a5';
    const numParticles = isCurrents ? 105 : 125;
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

    ctx.fillStyle = '#091528';
    ctx.fillRect(0, 0, width, height);

    const render = () => {
      ctx.fillStyle = isCurrents ? 'rgba(9, 21, 40, 0.18)' : 'rgba(9, 21, 40, 0.20)';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = particleColor;
      ctx.lineWidth = isCurrents ? 1.8 : 1.4;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.85;

      particles.forEach((p) => {
        p.prevX = p.x;
        p.prevY = p.y;

        if (isCurrents) {
          const nx = (p.x - width * 0.46) / (width * 0.42 || 1);
          const ny = (p.y - height * 0.50) / (height * 0.42 || 1);
          const rx = nx * 0.93 + ny * 0.37;
          const ry = -nx * 0.37 + ny * 0.93;
          const rSq = (rx * 0.82) ** 2 + (ry * 1.38) ** 2;

          const gyreMag = Math.exp(-rSq * 0.95);
          const circX = -ry * 1.55 * gyreMag;
          const circY = (rx * 1.15 + 0.12) * gyreMag;

          const wave1 = 0.38 * Math.sin(nx * 2.6 + ny * 1.4);
          const wave2 = 0.32 * Math.cos(nx * 1.8 - ny * 2.2);
          const driftX = -0.35 + 0.22 * Math.sin(ny * 2.2);
          const driftY = 0.14 * Math.cos(nx * 2.0);

          p.x += (circX + driftX + wave1 * 0.35) * 1.25;
          p.y += (circY + driftY + wave2 * 0.30) * 1.25;
        } else {
          p.x -= 3.0 + Math.sin(p.y * 0.035) * 0.45;
          p.y += 1.65 + Math.cos(p.x * 0.025) * 0.35;
        }

        p.age++;

        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

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
    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [metric, visible]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        background: '#091528',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Dynamic Mode Header Tag */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(6, 20, 38, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '20px',
          padding: '2px 10px',
          fontSize: '9.5px',
          color: metric === 'Currents' ? '#fde725' : '#d4a5a5',
          fontWeight: 700,
          letterSpacing: '0.5px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)',
        }}
      >
        {metric === 'Currents' ? 'OCEAN CURRENTS & CIRCULATION' : 'MONSOON WINDS & AIRFLOW'}
      </div>

      {/* Geographic Bounds HUD */}
      <div style={{ position: 'absolute', top: 8, left: 10, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, monospace', pointerEvents: 'none' }}>15.0°N</div>
      <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, monospace', pointerEvents: 'none' }}>10.0°N</div>
      <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, monospace', pointerEvents: 'none' }}>70.0°E</div>
      <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, monospace', pointerEvents: 'none' }}>65.0°E</div>
    </div>
  );
};

interface AnimatedCalloutPointerProps {
  x: number; // percentage in container (0 - 100)
  y: number; // percentage in container (0 - 100)
  title: string;
  badgeTag?: string;
  description: string;
  accentColor: string;
  visible: boolean;
  align?: "left" | "right";
  verticalAlign?: "top" | "bottom";
}

export const AnimatedCalloutPointer: React.FC<AnimatedCalloutPointerProps> = ({
  x,
  y,
  title,
  badgeTag,
  description,
  accentColor,
  visible,
  align = "right",
  verticalAlign = "top",
}) => {
  const isLeft = align === "left";
  const isBottom = verticalAlign === "bottom";

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        pointerEvents: "none",
        zIndex: 25,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.85)",
        transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Outer Radiating Pulsing Ring */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: "translate(-50%, -50%)",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: `1.5px solid ${accentColor}`,
          animation: visible ? "pointerRingPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite" : "none",
        }}
      />

      {/* Center Pinpoint Beacon Dot */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: "translate(-50%, -50%)",
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: accentColor,
          boxShadow: `0 0 10px ${accentColor}, 0 0 18px ${accentColor}`,
        }}
      />

      {/* SVG Angled Leader Line */}
      <svg
        style={{
          position: "absolute",
          left: isLeft ? -90 : 0,
          top: isBottom ? 0 : -32,
          width: "90px",
          height: "64px",
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <path
          d={
            isLeft
              ? isBottom
                ? "M 90,0 L 68,18 L 46,18"
                : "M 90,32 L 68,14 L 46,14"
              : isBottom
              ? "M 0,0 L 22,18 L 44,18"
              : "M 0,32 L 22,14 L 44,14"
          }
          fill="none"
          stroke={accentColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="90"
          strokeDashoffset={visible ? 0 : 90}
          style={{
            transition: "stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 4px ${accentColor})`,
          }}
        />
      </svg>

      {/* Floating Glass Annotation Badge */}
      <div
        style={{
          position: "absolute",
          left: isLeft ? undefined : "44px",
          right: isLeft ? "44px" : undefined,
          top: isBottom ? "6px" : "-36px",
          background: "rgba(6, 20, 38, 0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${accentColor}66`,
          borderRadius: "10px",
          padding: "9px 13px",
          maxWidth: "230px",
          minWidth: "175px",
          boxShadow: `0 12px 30px rgba(0, 0, 0, 0.75), 0 0 16px ${accentColor}25`,
          transform: visible ? "translate3d(0, 0, 0)" : "translate3d(0, 6px, 0)",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          userSelect: "none",
        }}
      >
        {badgeTag && (
          <div
            style={{
              fontFamily: "Inter, monospace",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: accentColor,
              marginBottom: "3px",
              textTransform: "uppercase",
            }}
          >
            {badgeTag}
          </div>
        )}
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "13.5px",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "rgba(186, 230, 253, 0.85)",
            lineHeight: 1.45,
            marginTop: "3px",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
};

interface EditorialChapterProps {
  num: string;
  tagline: string;
  label: string;
  description: string;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  lineProgress: MotionValue<string>;
  accentColor?: string;
}

const EditorialChapter: React.FC<EditorialChapterProps> = ({
  num,
  tagline,
  label,
  description,
  opacity,
  scale,
  lineProgress,
  accentColor = "#38bdf8",
}) => {
  return (
    <motion.div
      style={{
        opacity,
        scale,
        transformOrigin: "left center",
        position: "relative",
        paddingLeft: "22px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      {/* Thin glowing vertical progress line on left edge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "2.5px",
          background: "rgba(255, 255, 255, 0.08)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            width: "100%",
            height: lineProgress,
            background: `linear-gradient(180deg, ${accentColor} 0%, #0284c7 100%)`,
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            fontFamily: "Inter, monospace",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: accentColor,
          }}
        >
          {num}
        </span>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(186, 230, 253, 0.55)",
          }}
        >
          {tagline}
        </span>
      </div>

      <h3
        style={{
          fontFamily: "Syne, sans-serif",
          fontSize: "clamp(1.15rem, 1.8vw, 1.45rem)",
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
          margin: 0,
        }}
      >
        {label}
      </h3>

      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "12.5px",
          color: "rgba(186, 230, 253, 0.75)",
          lineHeight: 1.5,
          margin: 0,
          maxWidth: "340px",
        }}
      >
        {description}
      </p>
    </motion.div>
  );
};

export const EditorialChaptersColumn: React.FC<{
  smoothProgress: MotionValue<number>;
  isMobile: boolean;
}> = ({ smoothProgress, isMobile }) => {
  // Act 01: 0.00 to 0.48
  const op1 = useTransform(smoothProgress, [0.00, 0.44, 0.48], [1, 1, 0.22]);
  const sc1 = useTransform(smoothProgress, [0.00, 0.44, 0.48], [1, 1, 0.96]);
  const line1 = useTransform(smoothProgress, [0.00, 0.48], ["0%", "100%"]);

  // Act 02: 0.48 to 0.76
  const op2 = useTransform(smoothProgress, [0.44, 0.48, 0.72, 0.76], [0.22, 1, 1, 0.22]);
  const sc2 = useTransform(smoothProgress, [0.44, 0.48, 0.72, 0.76], [0.96, 1, 1, 0.96]);
  const line2 = useTransform(smoothProgress, [0.48, 0.76], ["0%", "100%"]);

  // Act 03: 0.76 to 1.00
  const op3 = useTransform(smoothProgress, [0.72, 0.76, 1.00], [0.22, 1, 1]);
  const sc3 = useTransform(smoothProgress, [0.72, 0.76, 1.00], [0.96, 1, 1]);
  const line3 = useTransform(smoothProgress, [0.76, 1.00], ["0%", "100%"]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        gap: isMobile ? "16px" : "28px",
        height: "100%",
        padding: isMobile ? "8px 0" : "18px 0",
      }}
    >
      <EditorialChapter
        num="01"
        tagline="Surface Telemetry"
        label="Surface Fingerprints"
        description="Warm underwater water expands, creating tiny bumps on the ocean surface that satellite radars can detect. OceanEmbed collects live satellite data from NASA and European space agencies daily."
        opacity={op1}
        scale={sc1}
        lineProgress={line1}
        accentColor="#38bdf8"
      />

      <EditorialChapter
        num="02"
        tagline="Depth Physics"
        label="Underwater Layers"
        description="Our AI model uses fluid physics laws to calculate how surface heat spreads downward, predicting water temperature across 15 standard depths down to 1,000 meters."
        opacity={op2}
        scale={sc2}
        lineProgress={line2}
        accentColor="#60a5fa"
      />

      <EditorialChapter
        num="03"
        tagline="Volumetric Model"
        label="Interactive 3D Map"
        description="A continuous volumetric thermal surface revealing subsurface eddies, heat cores, and cyclonic upwelling invisible to flat surface observation."
        opacity={op3}
        scale={sc3}
        lineProgress={line3}
        accentColor="#a78bfa"
      />
    </div>
  );
};

const ACT_CONFIGS = [
  // Slide 0: SST
  {
    category: "Surface Telemetry",
    title: "Sea Surface Temperature (SST)",
    subtitle: "14-day ocean surface temperature trends across the Arabian Sea",
    metricValue: "29.4°C",
    accentColor: "#ff7882",
  },
  // Slide 1: SSS
  {
    category: "Surface Telemetry",
    title: "Sea Surface Salinity (SSS)",
    subtitle: "Salt concentration levels indicating freshwater barrier layers",
    metricValue: "35.2 psu",
    accentColor: "#35b779",
  },
  // Slide 2: SSH
  {
    category: "Surface Telemetry",
    title: "Sea Surface Height (SSH)",
    subtitle: "Sea level elevation changes caused by ocean warming expansion",
    metricValue: "+0.18 m",
    accentColor: "#8bb6d6",
  },
  // Slide 3: Currents
  {
    category: "Surface Telemetry",
    title: "Ocean Currents & Circulation",
    subtitle: "Real-time flow speeds and rotating warm-water eddies",
    metricValue: "1.38 m/s",
    accentColor: "#fde725",
  },
  // Slide 4: Winds
  {
    category: "Surface Telemetry",
    title: "Monsoon Winds & Airflow",
    subtitle: "Seasonal wind vectors driving surface ocean circulation",
    metricValue: "6.4 m/s",
    accentColor: "#d4a5a5",
  },
  // Act 02: 15 Depths
  {
    category: "Depth Layers",
    title: "Underwater Temperature Layers",
    subtitle: "Water temperature measured across 15 depths down to 1,000m",
    metricValue: "15 Depths (0–1000m)",
    accentColor: "#38bdf8",
  },
  // Act 03: 3D Volumetric Terrain
  {
    category: "3D Heat Map",
    title: "3D Ocean Heat Map",
    subtitle: "Interactive 3D model revealing underwater heat cores and eddies",
    metricValue: "24.9°C Core Peak",
    accentColor: "#a78bfa",
  },
];

// ─── 100% SCROLL-SCRUBBED ACT 01 TELEMETRY GRAPH COMPONENTS ──────────────────

interface ScrollScrubbedCalloutPointerProps {
  x: number; // percentage in container (0 - 100)
  y: number; // percentage in container (0 - 100)
  title: string;
  badgeTag?: string;
  description: string;
  accentColor: string;
  align?: "left" | "right";
  verticalAlign?: "top" | "bottom";
  progress: MotionValue<number>;
  slideIndex: number;
}

const ScrollScrubbedCalloutPointer: React.FC<ScrollScrubbedCalloutPointerProps> = ({
  x,
  y,
  title,
  badgeTag,
  description,
  accentColor,
  align = "right",
  verticalAlign = "top",
  progress,
  slideIndex,
}) => {
  const isLeft = align === "left";
  const isBottom = verticalAlign === "bottom";

  // Phase 3 (u: 0.50 -> 0.82): Smoothly interpolate badge, ring, and leader line as curve passes anomaly peak
  const calloutOpacity = useTransform(progress, (p) => {
    if (slideIndex === 3) {
      if (p < 0.295) return 0;
      if (p < 0.312) return (p - 0.295) / 0.017;
      return 1;
    }
    if (slideIndex === 4) {
      if (p < 0.388) return 0;
      if (p < 0.405) return (p - 0.388) / 0.017;
      return 1;
    }
    const u = (p - slideIndex * 0.096) / 0.096;
    if (u < 0.50) return 0;
    if (u < 0.65) return (u - 0.50) / 0.15;
    return 1;
  });

  const calloutScale = useTransform(progress, (p) => {
    if (slideIndex === 3) {
      if (p < 0.295) return 0.92;
      if (p < 0.312) return 0.92 + 0.08 * ((p - 0.295) / 0.017);
      return 1;
    }
    if (slideIndex === 4) {
      if (p < 0.388) return 0.92;
      if (p < 0.405) return 0.92 + 0.08 * ((p - 0.388) / 0.017);
      return 1;
    }
    const u = (p - slideIndex * 0.096) / 0.096;
    if (u < 0.50) return 0.92;
    if (u < 0.65) return 0.92 + 0.08 * ((u - 0.50) / 0.15);
    return 1;
  });

  const calloutTranslateY = useTransform(progress, (p) => {
    if (slideIndex === 3) {
      if (p < 0.295) return 8;
      if (p < 0.312) return 8 * (1 - (p - 0.295) / 0.017);
      return 0;
    }
    if (slideIndex === 4) {
      if (p < 0.388) return 8;
      if (p < 0.405) return 8 * (1 - (p - 0.388) / 0.017);
      return 0;
    }
    const u = (p - slideIndex * 0.096) / 0.096;
    if (u < 0.50) return 8;
    if (u < 0.65) return 8 * (1 - (u - 0.50) / 0.15);
    return 0;
  });

  const leaderDashOffset = useTransform(progress, (p) => {
    if (slideIndex === 3) {
      if (p < 0.295) return 90;
      if (p < 0.312) return 90 * (1 - (p - 0.295) / 0.017);
      return 0;
    }
    if (slideIndex === 4) {
      if (p < 0.388) return 90;
      if (p < 0.405) return 90 * (1 - (p - 0.388) / 0.017);
      return 0;
    }
    const u = (p - slideIndex * 0.096) / 0.096;
    if (u < 0.50) return 90;
    if (u < 0.65) return 90 * (1 - (u - 0.50) / 0.15);
    return 0;
  });

  const leaderPathD = isLeft
    ? isBottom
      ? "M 90,0 L 68,18 L 46,18"
      : "M 90,32 L 68,14 L 46,14"
    : isBottom
    ? "M 0,0 L 22,18 L 44,18"
    : "M 0,32 L 22,14 L 44,14";

  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        pointerEvents: "none",
        zIndex: 25,
        opacity: calloutOpacity,
        scale: calloutScale,
        y: calloutTranslateY,
      }}
    >
      {/* Outer Radiating Target Ring */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: "translate(-50%, -50%)",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: `1.5px solid ${accentColor}`,
          boxShadow: `0 0 10px ${accentColor}55`,
          animation: "pointerRingPulse 2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        }}
      />

      {/* Center Pinpoint Beacon Dot */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: "translate(-50%, -50%)",
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: accentColor,
          boxShadow: `0 0 10px ${accentColor}, 0 0 18px ${accentColor}`,
        }}
      />

      {/* SVG Angled Leader Line (Scroll-Scrubbed Dash Offset) */}
      <svg
        style={{
          position: "absolute",
          left: isLeft ? -90 : 0,
          top: isBottom ? 0 : -32,
          width: "90px",
          height: "64px",
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <motion.path
          d={leaderPathD}
          fill="none"
          stroke={accentColor}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="90"
          style={{
            strokeDashoffset: leaderDashOffset,
            filter: `drop-shadow(0 0 4px ${accentColor})`,
          }}
        />
      </svg>

      {/* Floating Glass Annotation Badge */}
      <div
        style={{
          position: "absolute",
          left: isLeft ? undefined : "44px",
          right: isLeft ? "44px" : undefined,
          top: isBottom ? "6px" : "-36px",
          background: "rgba(6, 20, 38, 0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: `1px solid ${accentColor}66`,
          borderRadius: "10px",
          padding: "9px 13px",
          maxWidth: "230px",
          minWidth: "175px",
          boxShadow: `0 12px 30px rgba(0, 0, 0, 0.75), 0 0 16px ${accentColor}25`,
          userSelect: "none",
        }}
      >
        {badgeTag && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 7px",
              borderRadius: "4px",
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}44`,
              color: accentColor,
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "Inter, monospace",
              marginBottom: "5px",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                background: accentColor,
              }}
            />
            {badgeTag}
          </div>
        )}
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.3,
            marginBottom: "2px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "10.5px",
            color: "rgba(186, 230, 253, 0.75)",
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      </div>
    </motion.div>
  );
};

interface ScrollScrubbedLineChartSlideProps {
  progress: MotionValue<number>;
  slideIndex: number;
  data: { date: string; value: number }[];
  yDomain: [number, number];
  yTicks: number[];
  yFormatter: (val: number) => string;
  accentColor: string;
  gradientId: string;
  clipId: string;
  callout: {
    x: number;
    y: number;
    title: string;
    badgeTag: string;
    description: string;
    align?: "left" | "right";
    verticalAlign?: "top" | "bottom";
  };
  isMobile: boolean;
}

const ScrollScrubbedLineChartSlide: React.FC<ScrollScrubbedLineChartSlideProps> = ({
  progress,
  slideIndex,
  data,
  yDomain,
  yTicks,
  yFormatter,
  accentColor,
  gradientId,
  clipId,
  callout,
  isMobile,
}) => {
  const X0 = 56;
  const X1 = 676;
  const Y0 = 22;
  const Y1 = 280;
  const W = X1 - X0;
  const H = Y1 - Y0;

  const [minY, maxY] = yDomain;

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = X0 + (i / (data.length - 1)) * W;
      const y = Y1 - ((d.value - minY) / (maxY - minY)) * H;
      return { x, y, date: d.date, value: d.value };
    });
  }, [data, minY, maxY, W, H, X0, Y1]);

  const curvePathD = useMemo(() => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
    }
    return d;
  }, [points]);

  const areaPathD = useMemo(() => {
    if (points.length < 2) return "";
    const first = points[0];
    const last = points[points.length - 1];
    return `${curvePathD} L ${last.x.toFixed(2)},${Y1} L ${first.x.toFixed(2)},${Y1} Z`;
  }, [curvePathD, points, Y1]);

  // Phase 1 (u: 0.00 -> 0.18): Axes & Grid Smooth Fade-In (opacity 0 -> 1, translateY 16px -> 0px)
  // Phase 4 (u: 0.82 -> 1.00): Smooth Fade-Out (opacity 1 -> 0, translateY 0px -> -12px, pointerEvents 'none' < 0.05)
  const slideOpacity = useTransform(progress, (p) => {
    const u = (p - slideIndex * 0.096) / 0.096;
    if (u <= 0) return 0;
    if (u < 0.18) return u / 0.18;
    if (u <= 0.82) return 1;
    if (u < 1.00) return 1 - (u - 0.82) / 0.18;
    return 0;
  });

  const slideTranslateY = useTransform(progress, (p) => {
    const u = (p - slideIndex * 0.096) / 0.096;
    if (u <= 0) return 16;
    if (u < 0.18) return 16 * (1 - u / 0.18);
    if (u <= 0.82) return 0;
    if (u < 1.00) return -12 * ((u - 0.82) / 0.18);
    return -12;
  });

  const pointerEvents = useTransform(slideOpacity, (op) => (op < 0.05 ? "none" : "auto"));

  // Phase 2 (u: 0.18 -> 0.62): Gradual Scroll-Scrubbed Graph Drawing
  const drawProgress = useTransform(progress, (p) => {
    const u = (p - slideIndex * 0.096) / 0.096;
    return Math.min(1, Math.max(0, (u - 0.18) / 0.44));
  });

  const strokeDashoffset = useTransform(drawProgress, (dp) => 1 - dp);
  const clipWidth = useTransform(drawProgress, (dp) => `${dp * 100}%`);

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: isMobile ? "8px 10px 4px" : "12px 16px 6px",
        boxSizing: "border-box",
        opacity: slideOpacity,
        y: slideTranslateY,
        pointerEvents,
      }}
    >
      <div style={{ flex: 1, minHeight: 0, width: "100%", height: "100%", position: "relative" }}>
        <svg
          viewBox="0 0 700 320"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={accentColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={accentColor} stopOpacity={0.0} />
            </linearGradient>
            <clipPath id={clipId}>
              <motion.rect
                x="0"
                y="0"
                width={clipWidth}
                height="100%"
                style={{ width: clipWidth }}
              />
            </clipPath>
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {yTicks.map((tick) => {
            const yTick = Y1 - ((tick - minY) / (maxY - minY)) * H;
            return (
              <g key={tick}>
                <line
                  x1={X0}
                  y1={yTick}
                  x2={X1}
                  y2={yTick}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={X0 - 10}
                  y={yTick + 3.5}
                  fill="rgba(255, 255, 255, 0.55)"
                  fontSize="10"
                  fontFamily="Inter, monospace"
                  textAnchor="end"
                >
                  {yFormatter(tick)}
                </text>
              </g>
            );
          })}

          {/* X-Axis Baseline & Date Labels */}
          <line
            x1={X0}
            y1={Y1}
            x2={X1}
            y2={Y1}
            stroke="rgba(255, 255, 255, 0.12)"
          />
          {points.map((pt) => (
            <text
              key={pt.date}
              x={pt.x}
              y={Y1 + 18}
              fill="rgba(255, 255, 255, 0.55)"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              textAnchor="middle"
            >
              {pt.date}
            </text>
          ))}

          {/* Scroll-Scrubbed Area Fill (clipped left-to-right) */}
          <path
            d={areaPathD}
            fill={`url(#${gradientId})`}
            clipPath={`url(#${clipId})`}
          />

          {/* Scroll-Scrubbed Line Path (strokeDashoffset scrubbed) */}
          <motion.path
            d={curvePathD}
            fill="none"
            stroke={accentColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={strokeDashoffset}
            style={{ strokeDashoffset }}
          />
        </svg>

        {/* Phase 3: Scroll-Scrubbed Callout Pointer */}
        <ScrollScrubbedCalloutPointer
          x={callout.x}
          y={callout.y}
          title={callout.title}
          badgeTag={callout.badgeTag}
          description={callout.description}
          accentColor={accentColor}
          align={callout.align}
          verticalAlign={callout.verticalAlign}
          progress={progress}
          slideIndex={slideIndex}
        />
      </div>
    </motion.div>
  );
};

interface ScrollScrubbedVectorFieldSlideProps {
  progress: MotionValue<number>;
  slideIndex: number;
  metric: "Currents" | "Winds";
  accentColor: string;
  clipId?: string;
  callout: {
    x: number;
    y: number;
    title: string;
    badgeTag: string;
    description: string;
    align?: "left" | "right";
    verticalAlign?: "top" | "bottom";
  };
  isMobile: boolean;
}

const ScrollScrubbedVectorFieldSlide: React.FC<ScrollScrubbedVectorFieldSlideProps> = ({
  progress,
  slideIndex,
  metric,
  accentColor: propAccentColor,
  callout,
  isMobile,
}) => {
  const isCurrents = metric === "Currents";
  const accentColor = propAccentColor || (isCurrents ? "#fde725" : "#d4a5a5");

  // Phase 1: Container & Grid Fade In
  // Phase 4: Container & Slide Dissolve
  const slideOpacity = useTransform(progress, (p) => {
    if (isCurrents) {
      if (p <= 0.272) return 0;
      if (p < 0.292) return (p - 0.272) / 0.020;
      if (p <= 0.370) return 1;
      if (p < 0.388) return 1 - (p - 0.370) / 0.018;
      return 0;
    }
    if (p <= 0.370) return 0;
    if (p < 0.390) return (p - 0.370) / 0.020;
    if (p <= 0.472) return 1;
    if (p < 0.485) return 1 - (p - 0.472) / 0.013;
    return 0;
  });

  const slideTranslateY = useTransform(progress, (p) => {
    if (isCurrents) {
      if (p <= 0.272) return 16;
      if (p < 0.292) return 16 * (1 - (p - 0.272) / 0.020);
      if (p <= 0.370) return 0;
      if (p < 0.388) return -12 * ((p - 0.370) / 0.018);
      return -12;
    }
    if (p <= 0.370) return 16;
    if (p < 0.390) return 16 * (1 - (p - 0.370) / 0.020);
    if (p <= 0.472) return 0;
    if (p < 0.485) return -12 * ((p - 0.472) / 0.013);
    return -12;
  });

  const pointerEvents = useTransform(slideOpacity, (op) => (op < 0.05 ? "none" : "auto"));

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hybrid Scroll-Ignited Particle Stream Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.clientWidth || 700;
    let height = container.clientHeight || 320;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const updateCanvasSize = () => {
      if (!container || !canvas) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        width = w;
        height = h;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    };

    updateCanvasSize();
    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(container);

    // Particle Counts: 140 for Slide 4 (Currents), 125 for Slide 5 (Winds)
    const totalParticles = isCurrents ? 140 : 125;

    interface Particle {
      x: number;
      y: number;
      distFromCore: number;
      speed: number;
      maxTrailLen: number;
      life: number;
      age: number;
      phaseOffset: number;
      history: { x: number; y: number }[];
    }

    const initCx = 0.58 * width;
    const initCy = 0.52 * height;

    const particles: Particle[] = Array.from({ length: totalParticles }, (_, i) => {
      if (isCurrents) {
        // Seed 140 particles organically across Arabian Sea bounding box with eddy density
        let px = 0;
        let py = 0;
        if (i < 95) {
          const angle = Math.random() * Math.PI * 2;
          const r = 18 + Math.sqrt(Math.random()) * 165;
          px = initCx + Math.cos(angle) * r;
          py = initCy + Math.sin(angle) * r * 0.88;
        } else {
          px = Math.random() * width;
          py = Math.random() * height;
        }
        const dist = Math.hypot(px - initCx, py - initCy);
        return {
          x: px,
          y: py,
          distFromCore: dist,
          speed: 0.95 + Math.random() * 0.35,
          maxTrailLen: 14,
          life: 400 + Math.random() * 200,
          age: Math.floor(Math.random() * 300),
          phaseOffset: Math.random() * Math.PI * 2,
          history: [{ x: px, y: py }],
        };
      } else {
        // Seed 125 wind particles across canvas with calm laminar distribution
        const px = Math.random() * (width + 60) - 30;
        const py = Math.random() * (height + 60) - 30;
        const distFromBL = (px / width) * 0.6 + ((height - py) / height) * 0.4;
        return {
          x: px,
          y: py,
          distFromCore: distFromBL,
          speed: 1.6 + ((i % 7) / 7) * 0.6, // Calm, smooth, laminar velocity (1.6 - 2.2 px/frame)
          maxTrailLen: 22,
          life: 99999,
          age: 0,
          phaseOffset: 0,
          history: [{ x: px, y: py }],
        };
      }
    });

    // Sort particles so ignition radiates progressively from core outward (Currents) or across wind corridor (Winds)
    particles.sort((a, b) => a.distFromCore - b.distFromCore);

    // Physics step function - purely continuous time-based simulation (100% decoupled from scroll)
    const stepPhysics = (dt: number) => {
      if (isCurrents) {
        const cx = 0.58 * width;
        const cy = 0.52 * height;
        const rEddy = Math.min(width, height) * 0.28;

        for (let i = 0; i < totalParticles; i++) {
          const pt = particles[i];

          // Vector Field Math (Anticyclonic Gyre / Eddy)
          const dx = pt.x - cx;
          const dy = pt.y - cy;
          const dist = Math.hypot(dx, dy);
          const rNorm = dist / Math.max(rEddy, 1);

          // Smooth tangential swirl around (cx, cy) with peak speed near eddy ring
          const eddyFactor = rNorm * Math.exp(-0.5 * rNorm * rNorm) * 2.7;
          const invDist = 1 / (dist + 0.001);
          // Clockwise tangential swirl: (-dy, dx)
          const tanVx = -dy * invDist * eddyFactor * 2.2;
          const tanVy = dx * invDist * eddyFactor * 2.2;

          // Gentle inward downwelling pull towards eddy core
          const inwardVx = -dx * invDist * 0.12 * eddyFactor;
          const inwardVy = -dy * invDist * 0.12 * eddyFactor;

          // Gentle eastward coastal drift
          const driftVx = 0.38 + 0.12 * Math.sin((pt.y / height) * Math.PI);
          const driftVy = 0.08 * Math.cos((pt.x / width) * 2 * Math.PI);

          const vx = (tanVx + inwardVx + driftVx) * pt.speed;
          const vy = (tanVy + inwardVy + driftVy) * pt.speed;

          // Fixed history length of 14 points (steady trail length, zero scroll dependence)
          pt.history.push({ x: pt.x, y: pt.y });
          if (pt.history.length > 14) {
            pt.history.shift();
          }

          pt.x += vx * dt;
          pt.y += vy * dt;
          pt.age += dt;

          // Boundary wrap / respawn
          if (pt.x > width + 35) {
            pt.x = -15;
            pt.y = cy + (Math.random() - 0.5) * height * 0.8;
            pt.history = [{ x: pt.x, y: pt.y }];
          } else if (pt.x < -35) {
            pt.x = width + 15;
            pt.y = cy + (Math.random() - 0.5) * height * 0.8;
            pt.history = [{ x: pt.x, y: pt.y }];
          }
          if (pt.y > height + 35) {
            pt.y = -15;
            pt.x = Math.random() * width;
            pt.history = [{ x: pt.x, y: pt.y }];
          } else if (pt.y < -35) {
            pt.y = height + 15;
            pt.x = Math.random() * width;
            pt.history = [{ x: pt.x, y: pt.y }];
          }
          if (pt.age > pt.life) {
            pt.age = 0;
            const angle = Math.random() * Math.PI * 2;
            const r = 20 + Math.sqrt(Math.random()) * 160;
            pt.x = cx + Math.cos(angle) * r;
            pt.y = cy + Math.sin(angle) * r * 0.88;
            pt.history = [{ x: pt.x, y: pt.y }];
          }
        }
      } else {
        const baseAngle = -32 * (Math.PI / 180); // SW-to-NE Monsoon Jet Stream (~ -32deg)

        for (let i = 0; i < totalParticles; i++) {
          const pt = particles[i];

          // Coherent, laminar spatial wave (particles in the same area flow harmoniously)
          const wave = 0.10 * Math.sin(pt.x * 0.008 + pt.y * 0.006);
          const angle = baseAngle + wave;
          const vx = Math.cos(angle) * pt.speed;
          const vy = Math.sin(angle) * pt.speed;

          // Fixed history length of 20 points (steady trail length, zero scroll dependence)
          pt.history.push({ x: pt.x, y: pt.y });
          if (pt.history.length > 20) {
            pt.history.shift();
          }

          pt.x += vx * dt;
          pt.y += vy * dt;

          // Seamless boundary respawn along bottom/left boundary as particles exit top/right
          if (pt.x > width + 30 || pt.y < -30) {
            if (Math.random() < 0.5) {
              pt.x = -20;
              pt.y = Math.random() * (height + 20);
            } else {
              pt.x = Math.random() * (width + 20);
              pt.y = height + 20;
            }
            pt.history = [{ x: pt.x, y: pt.y }];
          }
        }
      }
    };

    // Pre-warm particle stream history so trails are immediately smooth and complete on reveal
    for (let warm = 0; warm < 22; warm++) {
      stepPhysics(1.0);
    }

    let isRunning = false;
    let rafId: number | null = null;
    let lastTime = performance.now();

    const calcLifecycle = (p: number) => {
      if (isCurrents) {
        let op = 0;
        if (p > 0.272 && p < 0.292) op = (p - 0.272) / 0.020;
        else if (p >= 0.292 && p <= 0.370) op = 1;
        else if (p > 0.370 && p < 0.388) op = 1 - (p - 0.370) / 0.018;

        const dp = clamp((p - 0.272) / 0.040, 0, 1);
        return { opacity: op, drawProgress: dp };
      }

      let op = 0;
      if (p > 0.370 && p < 0.390) op = (p - 0.370) / 0.020;
      else if (p >= 0.390 && p <= 0.472) op = 1;
      else if (p > 0.472 && p < 0.485) op = 1 - (p - 0.472) / 0.013;

      const dp = clamp((p - 0.370) / 0.040, 0, 1);
      return { opacity: op, drawProgress: dp };
    };

    const render = () => {
      if (!isRunning) return;

      const p = progress.get();
      const { opacity, drawProgress } = calcLifecycle(p);

      // Only run the canvas requestAnimationFrame loop when the slide's opacity is > 0.02
      if (opacity <= 0.02) {
        isRunning = false;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        return;
      }

      // Delta time normalized to 60 FPS (16.667ms per step)
      const now = performance.now();
      let dt = (now - lastTime) / 16.667;
      lastTime = now;
      if (dt > 2.0 || dt < 0.1) dt = 1.0;

      // Advance physics continuously based on clock time (completely independent of scroll)
      stepPhysics(dt);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (isCurrents) {
        // Slide 4: Ocean Currents & Circulation (Swirling Mesoscale Eddy)
        const cx = 0.58 * width;
        const cy = 0.52 * height;
        const rEddy = Math.min(width, height) * 0.28;

        // Add 3–4 very faint, dashed concentric contour rings around the eddy core
        if (drawProgress > 0.01) {
          ctx.save();
          ctx.setLineDash([4, 5]);
          const contourRadii = [rEddy * 0.48, rEddy * 0.98, rEddy * 1.58, rEddy * 2.22];
          contourRadii.forEach((r, idx) => {
            ctx.strokeStyle = `rgba(253, 231, 37, ${(0.06 + idx * 0.025) * drawProgress * opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r * 0.86, 0.08, 0, Math.PI * 2);
            ctx.stroke();
          });
          ctx.restore();
        }

        // Render each particle with smooth individual alpha fade-in (NO POPPING!)
        for (let i = 0; i < totalParticles; i++) {
          const pt = particles[i];

          // Staggered progressive onset: eddy core particles fade in first, spreading outward
          const onset = (i / totalParticles) * 0.65;
          const particleFade = clamp((drawProgress - onset) / 0.35, 0, 1);
          if (particleFade <= 0.003) continue;

          const pts = pt.history;
          if (pts.length >= 2) {
            for (let j = 0; j < pts.length - 1; j++) {
              const t = (j + 1) / pts.length;
              const alpha = Math.pow(t, 2) * 0.85 * particleFade * opacity;
              const w = 0.6 + t * 1.4;
              ctx.strokeStyle = `rgba(253, 231, 37, ${alpha})`;
              ctx.lineWidth = w;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(pts[j].x, pts[j].y);
              ctx.lineTo(pts[j + 1].x, pts[j + 1].y);
              ctx.stroke();
            }
          }

          // Glowing golden head (#fde725, 1.8px radius with soft glow, smoothly faded)
          const headAlpha = 0.95 * particleFade * opacity;
          if (headAlpha > 0.01) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(253, 231, 37, ${headAlpha})`;
            ctx.shadowColor = "#fde725";
            ctx.shadowBlur = 6 * particleFade;
            ctx.fill();
            ctx.restore();
          }
        }
      } else {
        // Slide 5: Monsoon Winds & Airflow (Smooth Laminar Streaks)
        // Render each wind streak with smooth individual alpha fade-in (NO POPPING!)
        for (let i = 0; i < totalParticles; i++) {
          const pt = particles[i];

          // Staggered progressive onset across wind corridor
          const onset = (i / totalParticles) * 0.65;
          const particleFade = clamp((drawProgress - onset) / 0.35, 0, 1);
          if (particleFade <= 0.003) continue;

          const pts = pt.history;
          if (pts.length >= 2) {
            for (let j = 0; j < pts.length - 1; j++) {
              const t = (j + 1) / pts.length;
              const alpha = Math.pow(t, 2) * 0.70 * particleFade * opacity;
              const w = 0.7 + t * 1.2;
              ctx.strokeStyle = `rgba(212, 165, 165, ${alpha})`;
              ctx.lineWidth = w;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(pts[j].x, pts[j].y);
              ctx.lineTo(pts[j + 1].x, pts[j + 1].y);
              ctx.stroke();
            }
          }

          // Soft leading tip with subtle #d4a5a5 glow, smoothly faded
          const tipAlpha = 0.95 * particleFade * opacity;
          if (tipAlpha > 0.01) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(245, 230, 230, ${tipAlpha})`;
            ctx.shadowColor = "#d4a5a5";
            ctx.shadowBlur = 4 * particleFade;
            ctx.fill();
            ctx.restore();
          }
        }
      }

      ctx.restore();

      // Continue animation loop while slide is visible
      rafId = requestAnimationFrame(render);
    };

    const startAnimation = () => {
      if (!isRunning) {
        isRunning = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(render);
      }
    };

    const stopAnimation = () => {
      isRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Listen to progress changes to trigger ignition and wake loop
    const unsub = progress.on("change", (latestP) => {
      const { opacity } = calcLifecycle(latestP);
      if (opacity > 0.02) {
        startAnimation();
      } else {
        stopAnimation();
      }
    });

    // Initial check
    const { opacity: initialOpacity } = calcLifecycle(progress.get());
    if (initialOpacity > 0.02) {
      startAnimation();
    }

    return () => {
      unsub();
      stopAnimation();
      ro.disconnect();
    };
  }, [progress, slideIndex, isCurrents]);

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: isMobile ? "8px 10px 4px" : "12px 16px 6px",
        boxSizing: "border-box",
        opacity: slideOpacity,
        y: slideTranslateY,
        pointerEvents,
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          height: "100%",
          position: "relative",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          background: "#091528",
        }}
      >
        {/* High-DPI Fluid Particle Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "none",
          }}
        />

        {/* Subtle Coordinate Grid Lines */}
        <svg
          viewBox="0 0 700 320"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "none",
          }}
        >
          <line x1="55" y1="100" x2="645" y2="100" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 4" />
          <line x1="55" y1="160" x2="645" y2="160" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 4" />
          <line x1="55" y1="220" x2="645" y2="220" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 4" />
          <line x1="202" y1="40" x2="202" y2="280" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 4" />
          <line x1="350" y1="40" x2="350" y2="280" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 4" />
          <line x1="498" y1="40" x2="498" y2="280" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="2 4" />
        </svg>

        {/* Dynamic Mode Header Tag */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(6, 20, 38, 0.85)",
            border: `1px solid ${isCurrents ? "rgba(253, 231, 37, 0.3)" : "rgba(212, 165, 165, 0.3)"}`,
            borderRadius: "20px",
            padding: "2px 10px",
            fontSize: "9.5px",
            color: accentColor,
            fontWeight: 700,
            letterSpacing: "0.5px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 10,
          }}
        >
          {isCurrents ? "OCEAN CURRENTS & CIRCULATION" : "MONSOON WINDS & AIRFLOW"}
        </div>

        {/* Geographic Bounds HUD */}
        <div style={{ position: "absolute", top: 8, left: 10, fontSize: "10px", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, monospace", pointerEvents: "none", zIndex: 10 }}>15.0°N</div>
        <div style={{ position: "absolute", bottom: 8, left: 10, fontSize: "10px", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, monospace", pointerEvents: "none", zIndex: 10 }}>10.0°N</div>
        <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: "10px", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, monospace", pointerEvents: "none", zIndex: 10 }}>70.0°E</div>
        <div style={{ position: "absolute", top: 8, right: 10, fontSize: "10px", color: "rgba(255,255,255,0.6)", fontFamily: "Inter, monospace", pointerEvents: "none", zIndex: 10 }}>65.0°E</div>

        {/* Phase 3: Scroll-Scrubbed Callout Pointer */}
        <ScrollScrubbedCalloutPointer
          x={callout.x}
          y={callout.y}
          title={callout.title}
          badgeTag={callout.badgeTag}
          description={callout.description}
          accentColor={accentColor}
          align={callout.align}
          verticalAlign={callout.verticalAlign}
          progress={progress}
          slideIndex={slideIndex}
        />
      </div>
    </motion.div>
  );
};

export const ScrollScrubbedStageVisualizer: React.FC<{
  smoothProgress?: MotionValue<number>;
  sectionProgress?: number;
}> = ({ smoothProgress, sectionProgress = 0 }) => {
  const isMobile = useIsMobile(768);
  const fallbackProgress = useMotionValue(sectionProgress);
  useEffect(() => {
    if (!smoothProgress) {
      fallbackProgress.set(sectionProgress);
    }
  }, [sectionProgress, smoothProgress, fallbackProgress]);

  const progress = smoothProgress || fallbackProgress;

  // Track active act & slide index reactively from progress
  const [activeAct, setActiveAct] = useState<1 | 2 | 3>(() => {
    const init = progress.get();
    return init < 0.48 ? 1 : init < 0.75 ? 2 : 3;
  });
  const [slideIndex, setSlideIndex] = useState<number>(() => {
    const init = progress.get();
    return Math.min(4, Math.max(0, Math.floor(init / 0.096)));
  });

  useEffect(() => {
    const unsubscribe = progress.on("change", (latest: number) => {
      const nextAct: 1 | 2 | 3 = latest < 0.48 ? 1 : latest < 0.75 ? 2 : 3;
      setActiveAct((prev) => (prev !== nextAct ? nextAct : prev));
      if (latest < 0.48) {
        const nextSlide =
          latest >= 0.375
            ? 4
            : latest >= 0.280
            ? 3
            : Math.min(2, Math.max(0, Math.floor(latest / 0.096)));
        setSlideIndex((prev) => (prev !== nextSlide ? nextSlide : prev));
      }
    });
    return () => {
      unsubscribe();
    };
  }, [progress]);

  const currentConfigIndex = activeAct === 1 ? slideIndex : activeAct === 2 ? 5 : 6;
  const currentConfig = ACT_CONFIGS[currentConfigIndex];

  // Opacity & visibility transforms for seamless cross-fade boundaries
  const act1Opacity = useTransform(progress, [0.00, 0.47, 0.485], [1, 1, 0]);
  const act2Opacity = useTransform(progress, [0.47, 0.485], [0, 1]);

  // Act 03 cross-dissolve: simultaneously fades in 0.0 -> 1.0 in exact handoff window (0.748 -> 0.762) while plane is flat
  const act3Opacity = useTransform(progress, [0.748, 0.762], [0, 1], { clamp: true });
  // Stable 1.0 scale — zero jarring pop
  const act3Scale = useTransform(progress, () => 1);

  // Overlapping visibility & interactivity windows eliminating blank gaps
  // Act 02 hides cleanly at 0.765 once handoff to flat 3D canvas is complete
  const isAct2Visible = useTransform(progress, (v) => (v >= 0.46 && v <= 0.765 ? "visible" : "hidden"));
  const isAct2Interactive = useTransform(progress, (v) => (v >= 0.48 && v < 0.755 ? "auto" : "none"));
  const isAct3Visible = useTransform(progress, (v) => (v >= 0.745 ? "visible" : "hidden"));
  const isAct3Interactive = useTransform(progress, (v) => (v >= 0.755 ? "auto" : "none"));

  // Callout opacity for Act 02 (hidden while explodeT < 0.40, fades in 0.40 -> 0.55, holds, fades out 0.0 -> 0.65 of Stage 3)
  const act2CalloutOpacity = useTransform(progress, (latest) => {
    const pVal = clamp((latest - 0.48) / 0.28, 0, 1);
    const rawExplode = clamp(pVal / 0.52, 0, 1);
    const explodeT = easeExplode(rawExplode);
    const fadeIn = clamp((explodeT - 0.40) / 0.15, 0, 1);
    if (pVal <= 0.64) return fadeIn;
    const isolateT = clamp((pVal - 0.64) / 0.36, 0, 1);
    const flyT = clamp(isolateT / 0.65, 0, 1);
    const eFly = flyT * flyT * (3 - 2 * flyT);
    return fadeIn * (1 - eFly);
  });

  // Callout opacity for Act 03 (delayed until terrain has fully extruded and camera has tilted down: act3Progress > 0.40)
  const act3CalloutOpacity = useTransform(progress, (latest) => {
    const act3P = clamp((latest - 0.762) / (1.00 - 0.762), 0, 1);
    const t = clamp((act3P - 0.40) / 0.15, 0, 1);
    return t * t * (3 - 2 * t);
  });
  const act3CalloutTranslateX = useTransform(act3CalloutOpacity, [0, 1], [-14, 0]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: isMobile ? "380px" : "480px",
        background: "linear-gradient(145deg, rgba(10, 24, 44, 0.88), rgba(4, 13, 24, 0.96))",
        border: "1px solid rgba(56, 189, 248, 0.22)",
        borderRadius: isMobile ? "16px" : "20px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* ─── UNIFIED PERSISTENT STAGE HEADER BAR ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "10px 14px 8px" : "14px 20px 12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          background: "rgba(2, 9, 20, 0.55)",
          gap: "12px",
          flexShrink: 0,
          zIndex: 20,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 700,
                color: currentConfig.accentColor,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: `${currentConfig.accentColor}18`,
                border: `1px solid ${currentConfig.accentColor}33`,
                borderRadius: "4px",
                padding: "2px 8px",
              }}
            >
              {currentConfig.category}
            </span>
          </div>
          <h3
            style={{
              fontFamily: "Syne, sans-serif",
              margin: "3px 0 0",
              fontSize: isMobile ? "14.5px" : "17px",
              fontWeight: 700,
              color: "#ffffff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentConfig.title}
          </h3>
          <div
            style={{
              fontSize: "12px",
              color: "rgba(186, 230, 253, 0.75)",
              marginTop: "2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {currentConfig.subtitle}
          </div>
        </div>

        {/* Live Metric Glow Badge */}
        <div
          style={{
            padding: isMobile ? "4px 8px" : "6px 12px",
            borderRadius: "8px",
            background: `${currentConfig.accentColor}16`,
            border: `1px solid ${currentConfig.accentColor}44`,
            fontFamily: "Inter, monospace",
            fontSize: isMobile ? "12px" : "14px",
            fontWeight: 700,
            color: currentConfig.accentColor,
            whiteSpace: "nowrap",
            flexShrink: 0,
            boxShadow: `0 0 16px ${currentConfig.accentColor}20`,
            transition: "all 0.3s ease",
          }}
        >
          {currentConfig.metricValue}
        </div>
      </div>

      {/* ─── UNIFIED VISUAL VIEWPORT (SAME DIMENSIONS FOR ALL 3 ACTS) ─── */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* ─── ACT 01: SATELLITE TELEMETRY (0.00 – 0.48) ─── */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: activeAct === 1 ? "flex" : "none",
            flexDirection: "column",
            opacity: act1Opacity,
            zIndex: 5,
          }}
        >
          {/* Continuous Stack of 5 Telemetry Slides (100% Scroll-Scrubbed 4-Phase Lifecycle) */}
          <div style={{ position: "relative", width: "100%", height: "100%", flex: 1, minHeight: 0 }}>
            {/* Slide 0: SST */}
            <ScrollScrubbedLineChartSlide
              progress={progress}
              slideIndex={0}
              data={MOCK_SURFACE_TRENDS.SST}
              yDomain={[29.0, 30.0]}
              yTicks={[29.0, 29.2, 29.4, 29.6, 29.8, 30.0]}
              yFormatter={(v) => `${v.toFixed(1)}°C`}
              accentColor="#ff7882"
              gradientId="landingSSTGrad"
              clipId="landingSSTClip"
              callout={{
                x: 71.3,
                y: 23.0,
                title: "Thermal Surface Anomaly (29.8°C)",
                badgeTag: "Peak Solar Absorption",
                description: "Intense solar heating detected in top 1mm layer.",
                align: "left",
                verticalAlign: "bottom",
              }}
              isMobile={isMobile}
            />

            {/* Slide 1: SSS */}
            <ScrollScrubbedLineChartSlide
              progress={progress}
              slideIndex={1}
              data={MOCK_SURFACE_TRENDS.SSS}
              yDomain={[35.05, 35.30]}
              yTicks={[35.10, 35.15, 35.20, 35.25, 35.30]}
              yFormatter={(v) => `${v.toFixed(2)} psu`}
              accentColor="#35b779"
              gradientId="landingSSSGrad"
              clipId="landingSSSClip"
              callout={{
                x: 45,
                y: 50,
                title: "Freshwater Plume (35.18 psu)",
                badgeTag: "Barrier Layer Detection",
                description: "Low-salinity barrier layer traps heat downward.",
                align: "right",
                verticalAlign: "top",
              }}
              isMobile={isMobile}
            />

            {/* Slide 2: SSH */}
            <ScrollScrubbedLineChartSlide
              progress={progress}
              slideIndex={2}
              data={MOCK_SURFACE_TRENDS.SSH}
              yDomain={[0.10, 0.22]}
              yTicks={[0.10, 0.13, 0.16, 0.19, 0.22]}
              yFormatter={(v) => `${v.toFixed(2)}m`}
              accentColor="#8bb6d6"
              gradientId="landingSSHGrad"
              clipId="landingSSHClip"
              callout={{
                x: 60,
                y: 35,
                title: "Sea Surface Bulge (+0.21m)",
                badgeTag: "Thermal Water Expansion",
                description: "Warm water columns expand, raising surface altitude by 25cm.",
                align: "left",
                verticalAlign: "bottom",
              }}
              isMobile={isMobile}
            />

            {/* Slide 3: Currents */}
            <ScrollScrubbedVectorFieldSlide
              progress={progress}
              slideIndex={3}
              metric="Currents"
              accentColor="#fde725"
              clipId="landingCurrentsClip"
              callout={{
                x: 58,
                y: 52,
                title: "Mesoscale Eddy (1.38 m/s)",
                badgeTag: "Anticyclonic Core",
                description: "Rotating currents funnel warm surface water downward.",
                align: "right",
                verticalAlign: "top",
              }}
              isMobile={isMobile}
            />

            {/* Slide 4: Winds */}
            <ScrollScrubbedVectorFieldSlide
              progress={progress}
              slideIndex={4}
              metric="Winds"
              accentColor="#d4a5a5"
              clipId="landingWindsClip"
              callout={{
                x: 58,
                y: 38,
                title: "Monsoon Wind Stress (6.4 m/s)",
                badgeTag: "Northeast Airflow",
                description: "Surface shear drives vertical mixing.",
                align: "left",
                verticalAlign: "top",
              }}
              isMobile={isMobile}
            />
          </div>
        </motion.div>

        {/* ─── ACT 02: 3D SUBSURFACE LAYERS (0.48 – 0.76) ─── */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            visibility: isAct2Visible,
            pointerEvents: isAct2Interactive,
            opacity: act2Opacity,
            zIndex: 6,
          }}
        >
          {/* CSS-3D Exploding Slices Stack: Perfectly Centered */}
          <IsometricCss3DSlicesStack progress={progress} isMobile={isMobile} />

          {/* Callout 1: Top-Left Margin */}
          <motion.div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              zIndex: 15,
              pointerEvents: "none",
              background: "rgba(4, 14, 28, 0.90)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderLeft: "3px solid #fbbf24",
              padding: "9px 13px",
              borderRadius: "0 8px 8px 0",
              maxWidth: isMobile ? "180px" : "230px",
              boxShadow: "0 10px 28px rgba(0,0,0,0.65)",
              opacity: act2CalloutOpacity,
            }}
          >
            <div style={{ fontFamily: "Inter, monospace", fontSize: "10.5px", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.12em" }}>
              0m – 50m // SURFACE
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13.5px", fontWeight: 700, color: "#ffffff", marginTop: "2px", lineHeight: 1.25 }}>
              Mixed Surface Layer (28.9°C)
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "rgba(186, 230, 253, 0.85)", marginTop: "3px", lineHeight: 1.45 }}>
              Warm solar heat layer observed directly by radiometers.
            </div>
          </motion.div>

          {/* Callout 2: Bottom-Left Margin */}
          <motion.div
            style={{
              position: "absolute",
              bottom: "14px",
              left: "14px",
              zIndex: 15,
              pointerEvents: "none",
              background: "rgba(4, 14, 28, 0.90)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderLeft: "3px solid #a78bfa",
              padding: "9px 13px",
              borderRadius: "0 8px 8px 0",
              maxWidth: isMobile ? "180px" : "230px",
              boxShadow: "0 10px 28px rgba(0,0,0,0.65)",
              opacity: act2CalloutOpacity,
            }}
          >
            <div style={{ fontFamily: "Inter, monospace", fontSize: "10.5px", fontWeight: 700, color: "#a78bfa", letterSpacing: "0.12em" }}>
              800m – 1,000m // ABYSSAL
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13.5px", fontWeight: 700, color: "#ffffff", marginTop: "2px", lineHeight: 1.25 }}>
              Dense Deep Ocean (6.5°C)
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "rgba(186, 230, 253, 0.85)", marginTop: "3px", lineHeight: 1.45 }}>
              Deep abyssal water reconstructed without in-situ buoys.
            </div>
          </motion.div>
        </motion.div>

        {/* ─── ACT 03: 3D VOLUMETRIC THERMOCLINE TERRAIN (0.76 – 1.00) ─── */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            visibility: isAct3Visible,
            pointerEvents: isAct3Interactive,
            opacity: act3Opacity,
            scale: act3Scale,
            transformOrigin: "center center",
            zIndex: 7,
          }}
        >
          {/* 3D Topographic Mesh Canvas: Perfectly Centered */}
          <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <Canvas
              camera={{ position: [0, 7.1, 2.8], fov: 42 }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            >
              <CanvasResizeSynchronizer />
              <ambientLight intensity={0.65} />
              <directionalLight position={[8, 10, 5]} intensity={2.0} />
              <pointLight position={[-8, -8, -8]} color="#440154" intensity={2.2} />
              <pointLight position={[0, -6, -4]} color="#312e81" intensity={2.0} />
              <spotLight position={[0, 8, 0]} angle={0.6} penumbra={1} intensity={1.2} />
              <Suspense fallback={null}>
                <ThermoclineTopographicScene progress={progress} />
              </Suspense>
            </Canvas>
          </div>

          {/* Thermal Peak Callout: Top-Left Margin (Paced onset after extrusion) */}
          <motion.div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              zIndex: 15,
              pointerEvents: "none",
              background: "rgba(4, 14, 28, 0.90)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderLeft: "3px solid #ef4444",
              padding: "9px 13px",
              borderRadius: "0 8px 8px 0",
              maxWidth: isMobile ? "180px" : "230px",
              boxShadow: "0 10px 28px rgba(0,0,0,0.65)",
              opacity: act3CalloutOpacity,
              x: act3CalloutTranslateX,
            }}
          >
            <div style={{ fontFamily: "Inter, monospace", fontSize: "10.5px", fontWeight: 700, color: "#ef4444", letterSpacing: "0.12em" }}>
              12.5°N, 67.5°E @ 100m
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13.5px", fontWeight: 700, color: "#ffffff", marginTop: "2px", lineHeight: 1.25 }}>
              Subsurface Heat Core (24.91°C)
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "rgba(186, 230, 253, 0.85)", marginTop: "3px", lineHeight: 1.45 }}>
              High thermal energy pocket invisible from flat surface satellite view.
            </div>
          </motion.div>

          {/* Cold Upwelling Callout: Bottom-Left Margin (Paced onset after extrusion) */}
          <motion.div
            style={{
              position: "absolute",
              bottom: "14px",
              left: "14px",
              zIndex: 15,
              pointerEvents: "none",
              background: "rgba(4, 14, 28, 0.90)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderLeft: "3px solid #38bdf8",
              padding: "9px 13px",
              borderRadius: "0 8px 8px 0",
              maxWidth: isMobile ? "180px" : "230px",
              boxShadow: "0 10px 28px rgba(0,0,0,0.65)",
              opacity: act3CalloutOpacity,
              x: act3CalloutTranslateX,
            }}
          >
            <div style={{ fontFamily: "Inter, monospace", fontSize: "10.5px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.12em" }}>
              14.2°N, 69.2°E @ 100m
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13.5px", fontWeight: 700, color: "#ffffff", marginTop: "2px", lineHeight: 1.25 }}>
              Upwelling Cold Trough (19.20°C)
            </div>
            <div style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "rgba(186, 230, 253, 0.85)", marginTop: "3px", lineHeight: 1.45 }}>
              Deep abyssal upwelling lifting cooler nutrient-rich water.
            </div>
          </motion.div>

          {/* Bottom-Right Margin: Viridis Colorbar */}
          <motion.div
            style={{
              position: "absolute",
              bottom: "14px",
              right: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              background: "rgba(2, 8, 18, 0.85)",
              padding: "9px 8px",
              borderRadius: "9px",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              pointerEvents: "none",
              zIndex: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.65)",
              opacity: act3CalloutOpacity,
            }}
          >
            <span style={{ color: "rgba(186,230,253,0.7)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>
              TEMP
            </span>
            <span style={{ color: "#ffffff", fontSize: "11.5px", fontWeight: 700, fontFamily: "Inter, monospace" }}>
              25°C
            </span>
            <div
              style={{
                width: "7px",
                height: "76px",
                background: "linear-gradient(to bottom, #fde725, #5ec962, #21918c, #3b528b, #440154)",
                borderRadius: "4px",
                boxShadow: "0 0 8px rgba(253, 231, 37, 0.25)",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11.5px", fontWeight: 600, fontFamily: "Inter, monospace" }}>
              19°C
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// Backwards-compatible shim
export const ReconstructionStageVisualizer: React.FC<{ activeStage: number }> = ({ activeStage }) => {
  const p = activeStage === 1 ? 0.2 : activeStage === 2 ? 0.6 : 0.9;
  return <ScrollScrubbedStageVisualizer sectionProgress={p} />;
};

const SatelliteScanIllustration: React.FC = () => (
  <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(180deg, #020b18 0%, #051a36 55%, #020c1c 100%)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
    {/* Subtle Starfield & Coordinate Crosshairs */}
    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(1px 1px at 30px 20px, rgba(255,255,255,0.45) 1px, transparent 0), radial-gradient(1px 1px at 110px 50px, rgba(186,230,253,0.3) 1px, transparent 0), radial-gradient(1px 1px at 210px 25px, rgba(255,255,255,0.4) 1px, transparent 0), radial-gradient(1px 1px at 320px 60px, rgba(186,230,253,0.3) 1px, transparent 0)", backgroundSize: "360px 100px", pointerEvents: "none" }} />

    {/* Precision Orbit Path Passing Directly Through Satellite Core */}
    <svg viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100px", pointerEvents: "none", zIndex: 1 }}>
      <path d="M -50,68 Q 500,30 1050,68" fill="none" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="3" filter="blur(2px)" />
      <path d="M -50,68 Q 500,30 1050,68" fill="none" stroke="rgba(56, 189, 248, 0.38)" strokeWidth="1.2" strokeDasharray="7 6" />
    </svg>

    {/* Real Satellite Wireframe Asset with Attached Blue Radar Swath */}
    <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", paddingTop: "14px" }}>
      <div className="satellite-float-anim" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {/* Satellite Wireframe Image */}
        <img
          src={satelliteSrc}
          alt="Sentinel-6 Radar Altimeter"
          style={{ width: "115px", height: "auto", filter: "drop-shadow(0 0 8px rgba(56, 189, 248, 0.35))", position: "relative", zIndex: 3 }}
        />

        {/* Subtle, Soft Radar Highlight Emanating Directly From Satellite */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "320px",
            height: "115px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <svg viewBox="0 0 320 115" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="satNadirBeamGradSubtle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.1" />
                <stop offset="85%" stopColor="#38bdf8" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Soft Translucent Conical Swath */}
            <polygon
              points="155,0 165,0 305,115 15,115"
              fill="url(#satNadirBeamGradSubtle)"
            />

            {/* Delicate Hairline Guide Rays */}
            <line x1="155" y1="0" x2="15" y2="115" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="0.8" strokeDasharray="3 3" />
            <line x1="165" y1="0" x2="305" y2="115" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="0.8" strokeDasharray="3 3" />
          </svg>
        </div>
      </div>
    </div>

    {/* Ocean Surface Boundary & Reflection */}
    <div style={{ marginTop: "auto", position: "relative", zIndex: 3 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 4px" }}>
        <span style={{ fontFamily: "Inter, monospace", fontSize: "9px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.08em" }}>
          OCEAN SURFACE (1.0 mm)
        </span>
        <span style={{ fontFamily: "Inter, monospace", fontSize: "8.5px", fontWeight: 600, color: "#f87171", letterSpacing: "0.06em" }}>
          RADAR BOUNCES OFF WATER
        </span>
      </div>

      {/* Surface Glowing Horizon Line */}
      <div style={{ height: "2px", width: "100%", background: "linear-gradient(90deg, rgba(56,189,248,0.2) 0%, #38bdf8 50%, rgba(56,189,248,0.2) 100%)", boxShadow: "0 0 8px #38bdf8" }} />

      {/* Dark Unseen Ocean Depth */}
      <div style={{ height: "46px", background: "linear-gradient(180deg, #04101e 0%, #01060e 100%)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontFamily: "Inter, monospace", fontSize: "9px", fontWeight: 600, color: "rgba(186, 230, 253, 0.35)", letterSpacing: "0.14em" }}>
          UNSEEN OCEAN DEPTH (0 – 1,000m)
        </span>
      </div>
    </div>
  </div>
);

const ArgoSectionIllustration: React.FC = () => (
  <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(180deg, #051c36 0%, #031022 55%, #01060e 100%)", overflow: "hidden", display: "flex" }}>
    {/* Left Depth Scale */}
    <div style={{ width: "72px", borderRight: "1px solid rgba(251, 191, 36, 0.15)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10px 8px", boxSizing: "border-box", zIndex: 2, background: "rgba(2, 10, 22, 0.55)" }}>
      {[
        { d: "0 m", label: "SURFACE" },
        { d: "200 m", label: "THERMOCLINE" },
        { d: "500 m", label: "MID-DEPTH" },
        { d: "1,000 m", label: "ABYSS" },
      ].map((mark, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: "Inter, monospace", fontSize: "8.5px", fontWeight: 700, color: "#fbbf24" }}>{mark.d}</span>
          <span style={{ fontFamily: "Inter, monospace", fontSize: "7px", color: "rgba(253, 230, 138, 0.45)", letterSpacing: "0.04em" }}>{mark.label}</span>
        </div>
      ))}
    </div>

    {/* Center Water Column */}
    <div style={{ flex: 1, position: "relative", height: "100%", overflow: "hidden" }}>
      {/* 10-Day Profile Trajectory Curve */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        <path d="M 40,16 C 80,35 130,70 130,140 S 175,155 210,16" fill="none" stroke="rgba(251, 191, 36, 0.3)" strokeWidth="1.2" strokeDasharray="3 3" />

        {/* Sonar Acoustic Pulse Rings */}
        <circle cx="130" cy="98" r="14" fill="none" stroke="rgba(251, 191, 36, 0.35)" strokeWidth="0.8">
          <animate attributeName="r" values="8;30;8" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.75;0;0.75" dur="3.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="130" cy="98" r="26" fill="none" stroke="rgba(251, 191, 36, 0.18)" strokeWidth="0.8">
          <animate attributeName="r" values="14;44;14" dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3.2s" repeatCount="indefinite" />
        </circle>

        {/* Surface Satellite Transmission Beam */}
        <line x1="40" y1="16" x2="40" y2="4" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="40" cy="16" r="3" fill="#fbbf24" />
      </svg>

      {/* ARGO Float Asset */}
      <div className="argo-float-anim" style={{ position: "absolute", left: "118px", top: "48px", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <img
          src={argoSrc}
          alt="ARGO Profiling CTD Float"
          style={{ height: "80px", width: "auto", filter: "drop-shadow(0 0 12px rgba(251, 191, 36, 0.55))" }}
        />
      </div>

      {/* Floating Status Pill */}
      <div style={{ position: "absolute", right: "12px", bottom: "10px", zIndex: 4, background: "rgba(2, 10, 22, 0.85)", border: "1px solid rgba(251, 191, 36, 0.25)", borderRadius: "4px", padding: "3px 8px" }}>
        <span style={{ fontFamily: "Inter, monospace", fontSize: "8px", fontWeight: 600, color: "rgba(253, 230, 138, 0.85)", letterSpacing: "0.06em" }}>
          TEMPERATURE ACCURACY: ±0.002°C
        </span>
      </div>
    </div>
  </div>
);

const LiveDepthProfileGraph: React.FC<{ inView: boolean }> = ({ inView }) => {
  const isMobile = useIsMobile(768);
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
    <div style={{ background: "rgba(8,27,51,0.65)", border: "1px solid rgba(186,230,253,0.18)", borderRadius: isMobile ? "20px" : "24px", padding: isMobile ? "18px 14px" : "28px", backdropFilter: "blur(16px)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontFamily: "Inter,sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", color: "#7dd3fc", textTransform: "uppercase" }}>Verification Profile</div>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: isMobile ? "16px" : "18px", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>Depth vs. Temperature</div>
        </div>
        <div style={{ display: "flex", gap: isMobile ? "12px" : "18px", alignItems: "center" }}>
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

      <div style={{ position: "relative", width: "100%", height: isMobile ? "300px" : "430px" }}>
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
            RAPID COOLING ZONE (100m – 400m)
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
        <span style={{ fontFamily: "Inter,sans-serif", fontSize: "11px", color: "rgba(186,230,253,0.5)" }}>Arabian Sea Test Buoy (ID: 2901548)</span>
        <span style={{ fontFamily: "Inter,sans-serif", fontSize: "11px", fontWeight: 600, color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399", display: "inline-block" }} />
          Accuracy Match: 97.2% | Margin of Error: ±0.38°C
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
  const isMobile = useIsMobile(768);
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
    if (isMobile) return;
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
            ctx.fillText("EXPLORE REGION", tagX, tagY + 11);
          } else {
            ctx.font = '8px "Inter", monospace';
            ctx.fillStyle = "rgba(125, 211, 252, 0.45)";
            ctx.fillText("COORDINATE VIEW", tagX, tagY + 11);
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
  }, [isMobile]);

  if (isMobile) return null;

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

export const RECONSTRUCTION_STAGES = [
  {
    stg: 1,
    num: "01",
    label: "Surface Fingerprints",
    title: "Reading Surface Radar Clues",
    description: "Warm underwater water expands, creating tiny bumps on the ocean surface that satellite radars can detect. OceanEmbed collects live satellite data from NASA and European space agencies daily.",
    badge: "Satellite Feeds"
  },
  {
    stg: 2,
    num: "02",
    label: "Underwater Layers",
    title: "AI Physics Prediction",
    description: "Our AI model uses fluid physics laws to calculate how surface heat spreads downward, predicting water temperature across 15 standard depths down to 1,000 meters.",
    badge: "0m to 1,000m Depth"
  },
  {
    stg: 3,
    num: "03",
    label: "Interactive 3D Map",
    title: "Click Any Ocean Coordinate",
    description: "Click anywhere on the globe to inspect real-time temperatures, depth curves, and current flow with instant 3D visualization.",
    badge: "Real-Time Query",
  },
];


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
  const isMobile = useIsMobile(768);
  const [scrollY, setScrollY] = useState(0);
  const satelliteRef = useRef<HTMLDivElement>(null);
  const [orbitPath, setOrbitPath] = useState<{
    globeX: number;
    globeY: number;
    a: number;
    b: number;
    angle: number;
  } | null>(() => {
    if (typeof window === "undefined" || window.innerWidth < 768) return null;
    return computeOrbitGeometry(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    if (isMobile) return;
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
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
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
  }, [isMobile]);

  if (isMobile || scrollY > 1100) return null;

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
  const isMobile = useIsMobile(768);
  const accuracySectionRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLElement>(null);
  const [accuracyInView, setAccuracyInView] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Zero-render scroll progress wrapped in spring with silky, weighted inertia
  const { scrollYProgress: howItWorksScroll } = useScroll({
    target: howItWorksRef,
    offset: ["start start", "end end"],
  });
  const smoothHowItWorksProgress = useSpring(howItWorksScroll, {
    stiffness: 90,
    damping: 24,
    mass: 0.4,
  });

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

  // Interactive Ocean Blue Gradient for "BENEATH THE SURFACE."
  const heroHeadlineRef = useRef<HTMLHeadingElement>(null);
  const heroTextRef = useRef<HTMLSpanElement>(null);
  const heroGlowRef = useRef<HTMLDivElement>(null);
  const targetHeroCursor = useRef({ x: 50, y: 75 });
  const currentHeroCursor = useRef({ x: 50, y: 75 });
  const isHeroLerpRunning = useRef(false);

  const startHeroLerp = () => {
    if (isHeroLerpRunning.current) return;
    isHeroLerpRunning.current = true;
    const lerp = () => {
      const dx = targetHeroCursor.current.x - currentHeroCursor.current.x;
      const dy = targetHeroCursor.current.y - currentHeroCursor.current.y;
      if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
        currentHeroCursor.current.x += dx * 0.14;
        currentHeroCursor.current.y += dy * 0.14;
        const cx = currentHeroCursor.current.x;
        const cy = currentHeroCursor.current.y;
        if (heroTextRef.current) {
          const angle = 180 + (cx - 50) * 0.6;
          const blueStop = Math.max(35, Math.min(75, 55 + (cy - 50) * 0.4));
          heroTextRef.current.style.backgroundImage = `
            radial-gradient(ellipse 85% 70% at ${cx.toFixed(1)}% ${cy.toFixed(1)}%, rgba(56, 189, 248, 0.92) 0%, rgba(56, 189, 248, 0.45) 35%, rgba(56, 189, 248, 0) 75%),
            linear-gradient(${angle.toFixed(1)}deg, #ffffff 0%, #ffffff 28%, #bae6fd ${blueStop.toFixed(1)}%, #38bdf8 100%)
          `;
        }
        if (heroGlowRef.current) {
          heroGlowRef.current.style.transform = `translate(calc(-50% + ${(cx - 50) * 0.9}px), calc(-50% + ${(cy - 50) * 0.9}px))`;
        }
        requestAnimationFrame(lerp);
      } else {
        isHeroLerpRunning.current = false;
      }
    };
    requestAnimationFrame(lerp);
  };

  const updateHeroTarget = (clientX: number, clientY: number) => {
    const el = heroTextRef.current || heroHeadlineRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    targetHeroCursor.current = {
      x: Math.max(-20, Math.min(120, x)),
      y: Math.max(-30, Math.min(130, y)),
    };
    startHeroLerp();
  };

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    updateHeroTarget(e.clientX, e.clientY);
  };

  const handleHeroMouseLeave = () => {
    targetHeroCursor.current = { x: 50, y: 75 };
    startHeroLerp();
  };

  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight) return;
      updateHeroTarget(e.clientX, e.clientY);
    };
    const onWindowMouseLeave = () => {
      targetHeroCursor.current = { x: 50, y: 75 };
      startHeroLerp();
    };

    window.addEventListener("mousemove", onWindowMouseMove, { passive: true });
    document.addEventListener("mouseleave", onWindowMouseLeave);
    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      document.removeEventListener("mouseleave", onWindowMouseLeave);
    };
  }, []);

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
        .orbital-satellite-fixed-layer {
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        @keyframes bounceSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes horizonGlow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.85;transform:scale(1.05)} }
        @keyframes stageFadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseSlow { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes sweepLine { 0% { left: 0%; opacity: 0.1; } 50% { opacity: 0.7; } 100% { left: 100%; opacity: 0.1; } }
        @keyframes pointerRingPulse {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
        }
        @keyframes pointerBeaconGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); filter: brightness(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); filter: brightness(1.4); }
        }
        @keyframes scrubDotPulse {
          0%, 100% { box-shadow: 0 0 6px #38bdf8, 0 0 12px #38bdf8; }
          50% { box-shadow: 0 0 14px #38bdf8, 0 0 28px #38bdf8; }
        }
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
            display: none !important;
          }
          .landing-3d-profile-container,
          .stage2-3d-profile-container {
            height: 300px !important;
          }
        }
      `}</style>

      {/* Satellite Targeting Reticle & Water Refraction Interactive Canvas */}
      <OceanInteractiveOverlay />

      {/* Permanently Mounted 3D Wireframe Earth Globe Canvas */}
      <PersistentGlobeCanvas />

      {/* Hero Orbital Trajectory & Satellite Fly-Out Layer */}
      <HeroSatelliteOrbit />

      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: isMobile ? "12px 18px" : "16px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: isScrolled || mobileMenuOpen ? "rgba(8,27,51,0.92)" : "transparent",
          backdropFilter: isScrolled || mobileMenuOpen ? "blur(20px)" : "none",
          WebkitBackdropFilter: isScrolled || mobileMenuOpen ? "blur(20px)" : "none",
          borderBottom: isScrolled || mobileMenuOpen ? "1px solid rgba(186,230,253,0.12)" : "1px solid transparent",
          transition: "all .3s ease",
        }}
      >
        <Link to="/" onClick={closeMobileMenu} style={{ display:"flex", alignItems:"center", gap:"10px", textDecoration:"none" }}>
          <img src={Logo} alt="OceanEmbed" style={{ width: isMobile ? "24px" : "30px", height: isMobile ? "24px" : "30px" }} />
          <span style={{ fontFamily:"Syne,sans-serif", fontSize: isMobile ? "20px" : "24px", fontWeight:600, letterSpacing:"-0.5px", color:"#ffffff" }}>
            OceanEmbed
          </span>
        </Link>
        {!isMobile && (
          <nav style={{ display:"flex", gap:"36px", alignItems:"center" }}>
            <a href="#blind-spot" className="nav-anchor">The Blind Spot</a>
            <a href="#how-it-works" className="nav-anchor">How It Works</a>
            <a href="#accuracy" className="nav-anchor">Accuracy</a>
          </nav>
        )}
        <div style={{ display:"flex", alignItems:"center", gap: isMobile ? "10px" : "16px" }}>
          {!isMobile && (
            <Link to="/login" style={{ fontFamily:"Inter,sans-serif", fontSize:"13px", fontWeight:600, color:"rgba(186,230,253,0.8)", textDecoration:"none", padding:"8px 16px", borderRadius:"6px" }}>
              Sign In
            </Link>
          )}
          <Link
            to="/dashboard"
            className="btn-primary"
            style={{
              padding: isMobile ? "7px 15px" : "9px 22px",
              fontSize: isMobile ? "12px" : "13px",
            }}
          >
            {isMobile ? "Launch 3D" : "Launch 3D Globe"}
          </Link>
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(186, 230, 253, 0.2)",
                borderRadius: "8px",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Slide-down Glass Navigation Menu */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: "58px",
            left: 0,
            right: 0,
            background: "rgba(6, 20, 38, 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
            zIndex: 999,
            padding: "20px 18px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            animation: "stageFadeIn 0.25s ease-out",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          }}
        >
          <a
            href="#blind-spot"
            onClick={closeMobileMenu}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
              padding: "10px 0",
              borderBottom: "1px solid rgba(186, 230, 253, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>The Blind Spot</span>
            <span style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "Inter, monospace" }}>01 //</span>
          </a>
          <a
            href="#how-it-works"
            onClick={closeMobileMenu}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
              padding: "10px 0",
              borderBottom: "1px solid rgba(186, 230, 253, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>How It Works</span>
            <span style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "Inter, monospace" }}>02 //</span>
          </a>
          <a
            href="#accuracy"
            onClick={closeMobileMenu}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              color: "#ffffff",
              textDecoration: "none",
              padding: "10px 0",
              borderBottom: "1px solid rgba(186, 230, 253, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Accuracy & Validation</span>
            <span style={{ fontSize: "11px", color: "#38bdf8", fontFamily: "Inter, monospace" }}>03 //</span>
          </a>
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <Link
              to="/login"
              onClick={closeMobileMenu}
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: "Inter, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#bae6fd",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(186,230,253,0.2)",
                padding: "10px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              onClick={closeMobileMenu}
              className="btn-primary"
              style={{
                flex: 1,
                justifyContent: "center",
                padding: "10px",
                fontSize: "13px",
                borderRadius: "8px",
              }}
            >
              Enter 3D Globe
            </Link>
          </div>
        </div>
      )}

      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: isMobile ? "105px 18px 60px" : "120px 24px 80px",
          overflow: "hidden",
          background: "transparent",
          zIndex: 3
        }}
      >
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 40% 50%, transparent 25%, rgba(8,27,51,0.3) 65%, rgba(8,27,51,0.75) 100%)", pointerEvents:"none", zIndex:1 }} />
        <div ref={heroGlowRef} style={{ position:"absolute", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width: isMobile ? "320px" : "650px", height: isMobile ? "300px" : "450px", background:"radial-gradient(ellipse, rgba(2,132,199,0.18) 0%, transparent 70%)", filter:"blur(50px)", pointerEvents:"none", zIndex:1, transition: "transform 0.15s ease-out" }} />
        <div style={{ position:"relative", zIndex:2, maxWidth:"1040px" }}>
          <div style={{ fontFamily:"Inter,sans-serif", fontSize: isMobile ? "10.5px" : "12px", fontWeight:600, letterSpacing: isMobile ? "0.14em" : "0.18em", color:"rgba(186,230,253,0.7)", textTransform:"uppercase", marginBottom: isMobile ? "18px" : "24px" }}>
            AI-Powered Subsurface Ocean Intelligence
          </div>
          <h1
            ref={heroHeadlineRef}
            style={{
              fontFamily:"Syne,sans-serif",
              fontSize: isMobile ? "clamp(2.3rem, 10.5vw, 4.4rem)" : "clamp(3.4rem,8.5vw,8.2rem)",
              fontWeight:800,
              letterSpacing: isMobile ? "-0.03em" : "-0.04em",
              lineHeight: isMobile ? 1.02 : 0.95,
              margin: isMobile ? "0 auto 20px" : "0 auto 32px",
              userSelect:"none",
            }}
          >
            <span style={{ display:"block", color:"#ffffff", marginBottom: isMobile ? "4px" : "8px" }}>SEE</span>
            <span
              ref={heroTextRef}
              style={{
                display: "block",
                backgroundImage: `
                  radial-gradient(ellipse 85% 70% at 50% 75%, rgba(56, 189, 248, 0.92) 0%, rgba(56, 189, 248, 0.45) 35%, rgba(56, 189, 248, 0) 75%),
                  linear-gradient(180deg, #ffffff 0%, #ffffff 28%, #bae6fd 65%, #38bdf8 100%)
                `,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
                willChange: "background-image",
              }}
            >
              BENEATH THE SURFACE.
            </span>
          </h1>
          <p style={{ fontFamily:"Inter,sans-serif", fontSize: isMobile ? "15.5px" : "clamp(17px,2vw,21px)", fontWeight:400, color:"rgba(186,230,253,0.8)", lineHeight:1.65, maxWidth:"680px", margin: isMobile ? "0 auto 30px" : "0 auto 44px" }}>
            Satellites photograph the entire ocean every day, but they can only see the top millimeter of water. OceanEmbed uses deep learning to turn flat surface snapshots into a 3D underwater temperature map, 1,000 meters deep.
          </p>
          <div style={{ display:"flex", gap:"18px", justifyContent:"center", flexWrap:"wrap" }}>
            <Link
              to="/dashboard"
              className="btn-primary"
              style={{
                padding: isMobile ? "14px 30px" : "16px 36px",
                fontSize: isMobile ? "14px" : "15px",
                width: isMobile ? "100%" : "auto",
                maxWidth: "280px",
                justifyContent: "center",
              }}
            >
              Enter the 3D Globe
            </Link>
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
          padding: isMobile ? "70px 18px 90px" : "100px 32px 140px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 4,
        }}
      >
        <div style={{ maxWidth: "1140px", width: "100%" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ textAlign: "center", marginBottom: isMobile ? "36px" : "56px" }}>
              <div style={{ fontFamily: "Inter,sans-serif", fontSize: isMobile ? "11px" : "12px", fontWeight: 600, letterSpacing: "0.16em", color: "#7dd3fc", textTransform: "uppercase", marginBottom: "14px" }}>The Blind Spot</div>
              <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: isMobile ? "clamp(1.9rem, 7.5vw, 3.2rem)" : "clamp(2.4rem, 6.5vw, 5.4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
                <span style={{ color: "#ffffff" }}>SPACE SEES WIDE. </span>
                <span className="stroke-frost">SENSORS SEE DEEP.</span>
                <br />
                <span className="masked-ocean-headline">NOTHING SAW BOTH.</span>
              </h2>
              <p style={{
                fontFamily: "Inter, sans-serif",
                fontSize: isMobile ? "14px" : "16px",
                color: "rgba(186, 230, 253, 0.72)",
                maxWidth: "740px",
                margin: "16px auto 0",
                lineHeight: 1.6
              }}>
                To understand our oceans and climate, scientists need both wide global coverage and deep measurements. Today, no single instrument can do both.
              </p>
            </div>
          </ScrollFlyIn>

          {/* Master Telemetry Console (Single Monolithic Architectural Frame) */}
          <ScrollFlyIn from="bottom" delay={120}>
            <div
              style={{
                width: "100%",
                background: "linear-gradient(180deg, rgba(3, 14, 30, 0.94) 0%, rgba(2, 9, 20, 0.98) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.22)",
                borderRadius: isMobile ? "14px" : "16px",
                boxShadow: "0 28px 80px -20px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                overflow: "hidden",
                position: "relative",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              {/* Dual Observation Chamber */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  position: "relative",
                }}
              >
                {/* Desktop Central Demarcation Axis */}
                {!isMobile && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: "50%",
                      width: "1px",
                      background: "linear-gradient(180deg, rgba(56, 189, 248, 0.22) 0%, rgba(251, 191, 36, 0.22) 100%)",
                      zIndex: 10,
                      pointerEvents: "none"
                    }}
                  >
                    <div style={{ position: "absolute", top: "20%", left: "-5px", width: "11px", height: "1px", background: "rgba(56, 189, 248, 0.5)" }} />
                    <div style={{ position: "absolute", top: "50%", left: "-5px", width: "11px", height: "1px", background: "rgba(255, 255, 255, 0.4)" }} />
                    <div style={{ position: "absolute", top: "80%", left: "-5px", width: "11px", height: "1px", background: "rgba(251, 191, 36, 0.5)" }} />
                  </div>
                )}

                {/* Panel 01: Satellites */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: isMobile ? "20px 16px" : "28px 32px 24px",
                    borderBottom: isMobile ? "1px solid rgba(56, 189, 248, 0.16)" : "none",
                  }}
                >
                  {/* Header & Stats */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "16px", gap: "12px", minHeight: "60px" }}>
                    <div>
                      <div style={{ fontFamily: "Inter, monospace", fontSize: "10.5px", fontWeight: 700, color: "#38bdf8", letterSpacing: "0.1em", marginBottom: "4px" }}>
                        SPACE SATELLITES
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontFamily: "Syne, sans-serif", fontSize: isMobile ? "32px" : "38px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                          100%
                        </span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "rgba(186, 230, 253, 0.75)", whiteSpace: "nowrap" }}>
                          Global Coverage
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "Inter, monospace", fontSize: "9.5px", fontWeight: 700, color: "#f87171", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                        MAX DEPTH
                      </div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: isMobile ? "20px" : "24px", fontWeight: 800, color: "#f87171", letterSpacing: "-0.02em", lineHeight: 1, marginTop: "4px" }}>
                        1 mm
                      </div>
                    </div>
                  </div>

                  {/* Atmospheric Orbital Viewport */}
                  <div
                    style={{
                      height: isMobile ? "170px" : "210px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid rgba(56, 189, 248, 0.2)",
                      marginBottom: "18px",
                    }}
                  >
                    <SatelliteScanIllustration />
                  </div>

                  {/* Headline & Plain-English Explanation */}
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: isMobile ? "17px" : "19px", fontWeight: 700, color: "#ffffff", margin: "0 0 8px 0", lineHeight: 1.25 }}>
                    Space sees wide — but stops at the surface.
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13.5px", color: "rgba(186, 230, 253, 0.75)", lineHeight: 1.6, margin: "0 0 18px 0", flex: 1 }}>
                    Satellites scan every ocean daily from orbit. But radar signals bounce off the top millimeter of water, leaving the entire deep ocean completely invisible.
                  </p>

                  {/* Clear Takeaway Strip */}
                  <div
                    style={{
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#38bdf8" }}>
                      <span>✓ Strength: Scans the entire ocean surface daily</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(248, 113, 113, 0.9)" }}>
                      <span>✕ Blind spot: Cannot see below 1 millimeter</span>
                    </div>
                  </div>
                </div>

                {/* Panel 02: Underwater Sensors */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: isMobile ? "20px 16px" : "28px 32px 24px",
                  }}
                >
                  {/* Header & Stats */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "16px", gap: "12px", minHeight: "60px" }}>
                    <div>
                      <div style={{ fontFamily: "Inter, monospace", fontSize: "10.5px", fontWeight: 700, color: "#fbbf24", letterSpacing: "0.1em", marginBottom: "4px" }}>
                        UNDERWATER SENSORS
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span style={{ fontFamily: "Syne, sans-serif", fontSize: isMobile ? "32px" : "38px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                          1,000m
                        </span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 600, color: "rgba(253, 230, 138, 0.75)", whiteSpace: "nowrap" }}>
                          Diving Depth
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "Inter, monospace", fontSize: "9.5px", fontWeight: 700, color: "#f87171", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
                        UNMEASURED OCEAN
                      </div>
                      <div style={{ fontFamily: "Syne, sans-serif", fontSize: isMobile ? "20px" : "24px", fontWeight: 800, color: "#f87171", letterSpacing: "-0.02em", lineHeight: 1, marginTop: "4px" }}>
                        99.8%
                      </div>
                    </div>
                  </div>

                  {/* Atmospheric Sounding Viewport */}
                  <div
                    style={{
                      height: isMobile ? "170px" : "210px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid rgba(251, 191, 36, 0.2)",
                      marginBottom: "18px",
                    }}
                  >
                    <ArgoSectionIllustration />
                  </div>

                  {/* Headline & Plain-English Explanation */}
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: isMobile ? "17px" : "19px", fontWeight: 700, color: "#ffffff", margin: "0 0 8px 0", lineHeight: 1.25 }}>
                    Sensors see deep — but they are too far apart.
                  </h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13.5px", color: "rgba(186, 230, 253, 0.75)", lineHeight: 1.6, margin: "0 0 18px 0", flex: 1 }}>
                    Drifting robotic buoys descend 1,000 meters to record real underwater temperatures. But with only a few thousand floats worldwide, they leave 99% of the ocean unmeasured on any given day.
                  </p>

                  {/* Clear Takeaway Strip */}
                  <div
                    style={{
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#fbbf24" }}>
                      <span>✓ Strength: Measures real deep ocean water down to 1,000m</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(248, 113, 113, 0.9)" }}>
                      <span>✕ Blind spot: Too sparse — leaves 99% of the ocean blank</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Dock: Plain English Solution */}
              <div
                style={{
                  borderTop: "1px solid rgba(56, 189, 248, 0.2)",
                  background: "linear-gradient(180deg, rgba(6, 26, 52, 0.75) 0%, rgba(3, 13, 28, 0.95) 100%)",
                  padding: isMobile ? "18px 16px" : "22px 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {/* Synthesis Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Waves style={{ width: "16px", height: "16px", color: "#38bdf8" }} />
                    </div>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "#7dd3fc", textTransform: "uppercase" }}>
                      HOW OCEANEMBED BRIDGES THE GAP
                    </span>
                  </div>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "11px", color: "rgba(186, 230, 253, 0.6)" }}>
                    Physics + AI Reconstruction
                  </span>
                </div>

                {/* Comparison Table in Plain English */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr 1fr 1fr",
                    gap: "8px",
                    background: "rgba(2, 8, 18, 0.6)",
                    border: "1px solid rgba(56, 189, 248, 0.12)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontFamily: "Inter, sans-serif",
                    fontSize: isMobile ? "11px" : "12px",
                  }}
                >
                  <div style={{ display: isMobile ? "none" : "block", color: "rgba(186, 230, 253, 0.45)", fontWeight: 600 }}>SOURCE</div>
                  <div style={{ display: isMobile ? "none" : "block", color: "rgba(186, 230, 253, 0.45)", fontWeight: 600 }}>SURFACE COVERAGE</div>
                  <div style={{ display: isMobile ? "none" : "block", color: "rgba(186, 230, 253, 0.45)", fontWeight: 600 }}>UNDERWATER DEPTH</div>
                  <div style={{ display: isMobile ? "none" : "block", color: "rgba(186, 230, 253, 0.45)", fontWeight: 600 }}>UPDATE SPEED</div>

                  {/* Satellite Row */}
                  <div style={{ color: "#93c5fd", fontWeight: 500 }}>01. Satellites</div>
                  <div style={{ color: "rgba(186, 230, 253, 0.85)" }}>100% Global</div>
                  <div style={{ color: "#f87171" }}>1 mm (Surface only)</div>
                  <div style={{ color: "rgba(186, 230, 253, 0.85)" }}>Daily (24h)</div>

                  {/* ARGO Row */}
                  <div style={{ color: "#fde047", fontWeight: 500 }}>02. Ocean Buoys</div>
                  <div style={{ color: "#f87171" }}>Sparse (&lt; 1% of ocean)</div>
                  <div style={{ color: "rgba(253, 230, 138, 0.9)" }}>1,000m Deep</div>
                  <div style={{ color: "rgba(253, 230, 138, 0.9)" }}>Every 10 Days</div>

                  {/* OceanEmbed Resolution Row */}
                  <div style={{ color: "#38bdf8", fontWeight: 700 }}>03. OceanEmbed AI</div>
                  <div style={{ color: "#38bdf8", fontWeight: 700 }}>100% Global</div>
                  <div style={{ color: "#38bdf8", fontWeight: 700 }}>Continuous 1,000m</div>
                  <div style={{ color: "#38bdf8", fontWeight: 700 }}>Real-Time</div>
                </div>

                {/* Synthesis Conclusion */}
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: isMobile ? "13px" : "14px", color: "rgba(186, 230, 253, 0.85)", lineHeight: 1.55, margin: 0 }}>
                  <strong style={{ color: "#ffffff" }}>The Result:</strong> OceanEmbed pairs daily space satellite scans with ocean physics equations, turning surface radar into a complete 3D temperature map from the surface down to 1,000 meters in real time.
                </p>
              </div>
            </div>
          </ScrollFlyIn>
        </div>
      </section>

      <section
        id="how-it-works"
        ref={howItWorksRef}
        style={{
          position: "relative",
          height: "1150vh",
          background: "linear-gradient(180deg, rgba(4,28,51,0.95) 0%, rgba(3,18,36,0.98) 50%, rgba(2,12,24,1) 100%)",
          zIndex: 4,
        }}
      >
        {/* Un-pinned Top Intro Header - scrolls naturally out of view before the sticky showcase locks */}
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            padding: isMobile ? "64px 20px 48px" : "96px 32px 64px",
            textAlign: "center",
            position: "relative",
            zIndex: 2,
          }}
        >
          <ScrollFlyIn from="bottom">
            <div>
              <div
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: isMobile ? "10px" : "11.5px",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "#7dd3fc",
                  textTransform: "uppercase",
                  marginBottom: isMobile ? "6px" : "10px",
                }}
              >
                How It Works
              </div>
              <h2
                style={{
                  fontFamily: "Syne,sans-serif",
                  fontSize: isMobile ? "clamp(1.7rem, 6vw, 2.6rem)" : "clamp(2.4rem, 4.2vw, 3.8rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.08,
                  margin: 0,
                  color: "#ffffff",
                }}
              >
                TURNING FLAT SATELLITES INTO 3D OCEANS.
              </h2>
              <p
                style={{
                  fontFamily: "Inter,sans-serif",
                  fontSize: isMobile ? "13.5px" : "16px",
                  color: "rgba(186,230,253,0.72)",
                  maxWidth: "680px",
                  margin: "14px auto 0",
                  lineHeight: 1.55,
                }}
              >
                How OceanEmbed turns surface satellite scans into a complete 3D temperature map 1,000 meters deep in real time.
              </p>
            </div>
          </ScrollFlyIn>
        </div>

        {/* Sticky Showcase Stage Container */}
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: isMobile ? "68px 14px 14px" : "80px 32px 20px",
            boxSizing: "border-box",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              maxWidth: "1180px",
              width: "100%",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "center",
            }}
          >
            {/* Main Stage Grid (Left Editorial Chapters & Right Open Cinematic 3D Visualizer) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "330px 1fr",
                gap: isMobile ? "16px" : "36px",
                alignItems: "stretch",
                height: isMobile ? undefined : "510px",
                maxHeight: isMobile ? undefined : "530px",
                width: "100%",
              }}
            >
              {/* Left Column: Clean Minimalist Editorial Chapters */}
              <ScrollFlyIn from="left" delay={100} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <EditorialChaptersColumn smoothProgress={smoothHowItWorksProgress} isMobile={isMobile} />
              </ScrollFlyIn>

              {/* Right Column: Open Borderless Cinematic Stage Visualizer */}
              <ScrollFlyIn from="right" delay={200} style={{ height: "100%", display: "flex", flexDirection: "column", minWidth: 0 }}>
                <ScrollScrubbedStageVisualizer smoothProgress={smoothHowItWorksProgress} />
              </ScrollFlyIn>
            </div>
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
          padding: isMobile ? "70px 18px" : "120px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 4,
        }}
      >
        <div style={{ maxWidth:"1140px", width:"100%" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ marginBottom: isMobile ? "36px" : "64px" }}>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize: isMobile ? "11px" : "12px", fontWeight:600, letterSpacing:"0.16em", color:"#7dd3fc", textTransform:"uppercase", marginBottom:"14px" }}>Verified Accuracy</div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize: isMobile ? "clamp(1.9rem,6.8vw,3.2rem)" : "clamp(2.4rem,5.5vw,4.8rem)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.05, marginBottom: isMobile ? "14px" : "20px", color:"#ffffff" }}>TESTED AGAINST REAL OCEAN BUOYS.</h2>
              <p style={{ fontFamily:"Inter,sans-serif", fontSize: isMobile ? "15px" : "18px", color:"rgba(186,230,253,0.75)", maxWidth:"640px", lineHeight:1.6 }}>We do not ask scientists to trust a black box. Every prediction is automatically cross-checked against real physical thermometers diving in the Indian Ocean.</p>
            </div>
          </ScrollFlyIn>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(320px,1fr))", gap: isMobile ? "32px" : "60px", alignItems:"center" }}>
            <ScrollFlyIn from="left" delay={100}>
              <div style={{ display:"flex", flexDirection:"column", gap: isMobile ? "24px" : "44px" }}>
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
                        fontSize: isMobile ? "clamp(2.6rem, 10vw, 3.8rem)" : "clamp(3.8rem, 7vw, 5.5rem)",
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.05,
                        display: "inline-block",
                        paddingBottom: "4px"
                      }}
                    >
                      {val}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: isMobile ? "13.5px" : "15px", color: "rgba(186, 230, 253, 0.65)", marginTop: isMobile ? "6px" : "12px" }}>
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
          padding: isMobile ? "70px 18px 50px" : "120px 32px 80px",
          background: "linear-gradient(180deg, rgba(5,26,46,0.92) 0%, rgba(4,21,39,0.97) 100%)",
          borderTop: "1px solid rgba(186,230,253,0.08)",
          position: "relative",
          zIndex: 4,
        }}
      >
        <div style={{ maxWidth:"1140px", margin:"0 auto" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ textAlign:"center", marginBottom: isMobile ? "44px" : "80px" }}>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize: isMobile ? "11px" : "12px", fontWeight:600, letterSpacing:"0.16em", color:"#7dd3fc", textTransform:"uppercase", marginBottom:"14px" }}>Real-World Impact</div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize: isMobile ? "clamp(1.9rem,7vw,3rem)" : "clamp(2.2rem,5vw,4rem)", fontWeight:800, letterSpacing:"-0.03em", color:"#ffffff" }}>WHY SEEING BENEATH MATTERS.</h2>
            </div>
          </ScrollFlyIn>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(280px,1fr))", gap: isMobile ? "28px" : "48px" }}>
            {([
              { num:"01", from:"left" as const, title:"Monsoon and Cyclone Forecasting", body:"Subsurface ocean heat is the fuel tank for tropical cyclones and the Indian monsoon. Knowing what is 200 meters below tells meteorologists how much energy a storm will gain." },
              { num:"02", from:"bottom" as const, title:"Sustainable Fisheries", body:"Thermal boundaries underwater dictate where nutrient-rich waters and marine life gather. Fisheries using this data can find productive zones without over-trawling." },
              { num:"03", from:"right" as const, title:"Naval and Subsea Operations", body:"Sound travels differently through warm and cold water layers; accurate 3D thermal maps are vital for underwater navigation, sonar calibration, and submarine routing." },
            ]).map(({ num, from, title, body }) => (
              <ScrollFlyIn key={num} from={from} delay={parseInt(num) * 80}>
                <div style={{ borderLeft:"1px solid rgba(186,230,253,0.18)", paddingLeft: isMobile ? "18px" : "28px" }}>
                  <div className="number-outline-ice" style={{ fontFamily:"Syne,sans-serif", fontSize: isMobile ? "34px" : "42px", fontWeight:800, marginBottom:"12px" }}>{num}</div>
                  <h3 style={{ fontFamily:"Syne,sans-serif", fontSize: isMobile ? "18px" : "20px", fontWeight:700, color:"#ffffff", marginBottom:"10px" }}>{title}</h3>
                  <p style={{ fontFamily:"Inter,sans-serif", fontSize: isMobile ? "14px" : "15px", color:"rgba(186,230,253,0.65)", lineHeight:1.6 }}>{body}</p>
                </div>
              </ScrollFlyIn>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          minHeight: isMobile ? "70vh" : "85vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          position: "relative",
          padding: isMobile ? "70px 18px 60px" : "80px 24px 180px",
          background: "linear-gradient(180deg, rgba(4,21,39,0.96) 0%, #030e1e 60%, #020b16 100%)",
          overflow: "hidden",
          zIndex: 4,
        }}
      >
        <SeabedDunes />
        <div style={{ position:"absolute", bottom:"80px", left:"50%", transform:"translateX(-50%)", width: isMobile ? "90vw" : "70vw", height:"250px", borderRadius:"50%", background:"radial-gradient(ellipse,rgba(2,132,199,0.2) 0%,rgba(14,116,144,0.08) 40%,transparent 70%)", filter:"blur(50px)", pointerEvents:"none", animation:"horizonGlow 8s ease-in-out infinite" }} />
        {Array.from({ length: isMobile ? 8 : 18 }, (_, i) => {
          const left = `${5 + (i * 11) % 92}%`;
          const bottom = `${8 + (i * 4) % 35}%`;
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
        <div style={{ position:"relative", zIndex:3, maxWidth:"900px", width: "100%" }}>
          <ScrollFlyIn from="bottom">
            <div style={{ fontFamily:"Inter,sans-serif", fontSize: isMobile ? "11px" : "12px", fontWeight:600, letterSpacing:"0.18em", color:"rgba(186,230,253,0.55)", textTransform:"uppercase", marginBottom: isMobile ? "18px" : "24px" }}>The Ocean Awaits</div>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize: isMobile ? "clamp(2.4rem, 9.5vw, 4.2rem)" : "clamp(3.5rem,8.5vw,7.5rem)", fontWeight:800, letterSpacing:"-0.04em", lineHeight: isMobile ? 1.02 : 0.95, marginBottom: isMobile ? "28px" : "40px", color:"#ffffff" }}>
              DIVE INTO <span className="masked-ocean-headline">THE DATA.</span>
            </h2>
            <div style={{ display:"flex", gap:"20px", justifyContent:"center", flexWrap:"wrap" }}>
              <Link
                to="/dashboard"
                className="btn-primary"
                style={{
                  padding: isMobile ? "15px 30px" : "18px 44px",
                  fontSize: isMobile ? "14px" : "16px",
                  width: isMobile ? "100%" : "auto",
                  maxWidth: "300px",
                  justifyContent: "center",
                }}
              >
                Launch 3D Globe
              </Link>
            </div>
          </ScrollFlyIn>
        </div>
        <footer
          style={{
            position: isMobile ? "relative" : "absolute",
            bottom: isMobile ? "auto" : "24px",
            left: isMobile ? "auto" : "40px",
            right: isMobile ? "auto" : "40px",
            marginTop: isMobile ? "54px" : "0",
            width: isMobile ? "100%" : "auto",
            display: "flex",
            justifyContent: isMobile ? "center" : "space-between",
            alignItems: "center",
            flexDirection: isMobile ? "column" : "row",
            borderTop: "1px solid rgba(186,230,253,0.08)",
            paddingTop: "20px",
            flexWrap: "wrap",
            gap: isMobile ? "16px" : "12px",
            zIndex: 3
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <img src={Logo} alt="OceanEmbed" style={{ width:"20px", height:"20px", opacity:0.7 }} />
            <span style={{ fontFamily:"Syne,sans-serif", fontSize:"14px", fontWeight:700, color:"rgba(186,230,253,0.7)" }}>OceanEmbed</span>
            <span style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", color:"rgba(186,230,253,0.35)", marginLeft:"8px" }}>Subsurface Ocean Intelligence</span>
          </div>
          <div style={{ display:"flex", gap:"24px" }}>
            {([{to:"/dashboard",label:"3D Globe"},{to:"/login",label:"Sign In"},{to:"/signup",label:"Sign Up"}]).map(({ to, label }) => (
              <Link key={to} to={to} style={{ fontFamily:"Inter,sans-serif", fontSize:"12px", color:"rgba(186,230,253,0.4)", textDecoration:"none" }}>{label}</Link>
            ))}
          </div>
        </footer>
      </section>
    </div>
  );
};

export default LandingPage;
