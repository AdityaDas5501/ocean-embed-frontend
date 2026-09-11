import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Edges, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface DepthModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictions?: {
    depths_m: number[];
    temps_celsius: number[];
  };
}

const getColorForTemp = (temp: number) => {
  const colorHot = new THREE.Color('#ffa500'); // Orange for warm (30°C)
  const colorCold = new THREE.Color('#4b0082'); // Indigo for cold (4°C)
  // Map roughly 4°C - 30°C to 0 - 1
  const ratio = Math.min(Math.max((temp - 4) / 26, 0), 1);
  return colorCold.lerp(colorHot, ratio);
};

const Layer = ({ depth, temp }: { depth: number; temp: number }) => {
  // Use a logarithmic scale to smoothly separate the shallow layers.
  // Math.log(depth / 40 + 1) ensures 0m to 5m doesn't have a massive jump, 
  // keeping the gap near 0.32 units, which perfectly fits the 0.25 font size.
  const normalizedDepth = Math.log(depth / 40 + 1) / Math.log(1000 / 40 + 1);
  const yPos = 4.5 - (normalizedDepth * 9); // Scale total height to 9 units (4.5 to -4.5)
  const color = getColorForTemp(temp);

  return (
    <group position={[0, yPos, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 6]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.65}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Billboard position={[-3.2, 0, 3.2]}>
        <Text
          fontSize={0.22}
          color="rgba(255, 255, 255, 0.9)"
          anchorX="right"
          anchorY="middle"
        >
          {`${depth}m`}
        </Text>
      </Billboard>
      <Billboard position={[3.2, 0, 0]}>
        <Text
          fontSize={0.22}
          color="rgba(255, 255, 255, 0.9)"
          anchorX="left"
          anchorY="middle"
        >
          {`${temp.toFixed(1)}°C`}
        </Text>
      </Billboard>
    </group>
  );
};

const BoundingFrame = () => (
  <mesh position={[0, 0, 0]}>
    <boxGeometry args={[6, 9, 6]} />
    <Edges linewidth={1} color="#ffffff" transparent opacity={0.15} />
    <meshBasicMaterial visible={false} />
  </mesh>
);

const DepthModal: React.FC<DepthModalProps> = ({ isOpen, onClose, predictions }) => {
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
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#8bb6d6', fontWeight: 500 }}>Subsurface 3D Profile</h2>
              <button
                onClick={onClose}
                className="pill-button"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                Close
              </button>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Canvas camera={{ position: [8, 5, 8], fov: 50 }}>
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <pointLight position={[-10, -10, -10]} color="#4b0082" intensity={2} />
                <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={1} />
                <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
                <group position={[-1.5, 0, 0]}>
                  <BoundingFrame />
                  {predictions?.depths_m.map((depth, index) => (
                    <Layer
                      key={depth}
                      depth={depth}
                      temp={predictions.temps_celsius[index]}
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DepthModal;