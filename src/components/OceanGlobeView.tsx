import React, { useEffect, useRef, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import DepthModal from './DepthModal';
import { dummyOceanData } from '../utils/mockOceanData';
import LoadingBg from '../assets/images/Loading-Background.webp';

interface GeoJsonGeometry {
  type: string;
  coordinates: any[];
}

interface Feature {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties: any;
}

interface LabelData {
  text: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  isOcean?: boolean;
}

const OCEANS: LabelData[] = [
  { text: 'Indian Ocean', lat: -10, lng: 75, size: 2, color: 'rgba(50, 50, 50, 0.6)', isOcean: true },
  { text: 'South Atlantic Ocean', lat: -20, lng: -15, size: 2, color: 'rgba(50, 50, 50, 0.6)', isOcean: true },
  { text: 'North Atlantic Ocean', lat: 30, lng: -40, size: 2, color: 'rgba(50, 50, 50, 0.6)', isOcean: true },
  { text: 'Pacific Ocean', lat: 0, lng: -150, size: 2, color: 'rgba(50, 50, 50, 0.6)', isOcean: true },
  { text: 'Southern Ocean', lat: -60, lng: 90, size: 2, color: 'rgba(50, 50, 50, 0.6)', isOcean: true },
  { text: 'Arctic Ocean', lat: 80, lng: 0, size: 2, color: 'rgba(50, 50, 50, 0.6)', isOcean: true },
  { text: 'Arabian Sea', lat: 15, lng: 65, size: 1.5, color: 'rgba(50, 50, 50, 0.6)', isOcean: true },
  { text: 'Bay of Bengal', lat: 15, lng: 90, size: 1.5, color: 'rgba(50, 50, 50, 0.6)', isOcean: true },
  { text: 'Mediterranean Sea', lat: 35, lng: 18, size: 1.2, color: 'rgba(50, 50, 50, 0.6)', isOcean: true }
];

const OceanGlobeView: React.FC = () => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const reqIdRef = useRef<number | null>(null);
  const isIntroPlaying = useRef<boolean>(true);
  const [landPolygons, setLandPolygons] = useState<Feature[]>([]);
  const [labels, setLabels] = useState<LabelData[]>(OCEANS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [focusedRegion, setFocusedRegion] = useState<'bob' | 'as' | null>(null);
  const focusedRegionRef = useRef<'bob' | 'as' | null>(null);
  const cleanupMouseRef = useRef<(() => void) | null>(null);
  const [clickedCell, setClickedCell] = useState<{ minLat: number; maxLat: number; minLng: number; maxLng: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<Feature | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isGlobeReady, setIsGlobeReady] = useState(false);
  const [isMapDataLoaded, setIsMapDataLoaded] = useState(false);
  const [isBgLoaded, setIsBgLoaded] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const [fadeOutLoading, setFadeOutLoading] = useState(false);

  // Geographic bounds for clickable grid cells
  const REGION_BOUNDS = {
    bob: { minLat: 5, maxLat: 25, minLng: 80, maxLng: 100 },  // Bay of Bengal
    as: { minLat: 5, maxLat: 25, minLng: 50, maxLng: 80 },   // Arabian Sea
  };

  useEffect(() => {
    const preventNativeZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault(); // Prevents trackpad pinch-to-zoom from zooming the browser UI
      }
    };
    window.addEventListener('wheel', preventNativeZoom, { passive: false });

    return () => {
      window.removeEventListener('wheel', preventNativeZoom);
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      if (cleanupMouseRef.current) cleanupMouseRef.current();
    };
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.enableRotate = !focusedRegion;
        controls.enableZoom = !focusedRegion;
      }
    }
  }, [focusedRegion]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        setLandPolygons(data.features);

        const countryLabels: LabelData[] = data.features
          .filter((d: Feature) => d.properties.LABEL_Y && d.properties.LABEL_X && d.properties.NAME)
          .map((d: Feature) => ({
            text: d.properties.NAME,
            lat: d.properties.LABEL_Y,
            lng: d.properties.LABEL_X,
            size: 1.2,
            color: 'rgba(100, 100, 100, 0.8)',
            isOcean: false
          }));

        setLabels([...OCEANS, ...countryLabels]);
        setIsMapDataLoaded(true);
      })
      .catch(err => {
        console.error("Failed to load map data:", err);
        setIsMapDataLoaded(true);
      });

    const img = new Image();
    img.src = "//unpkg.com/three-globe/example/img/night-sky.png";
    img.onload = () => setIsBgLoaded(true);
    img.onerror = () => setIsBgLoaded(true);
  }, []);

  const isFullyLoaded = isGlobeReady && isMapDataLoaded && isBgLoaded;

  useEffect(() => {
    if (isFullyLoaded) {
      setTimeout(() => {
        setFadeOutLoading(true);
        setTimeout(() => {
          setShowLoading(false);
          if (globeRef.current) {
            globeRef.current.pointOfView({ lat: 5, lng: 80, altitude: 0.8 }, 4000);
            setTimeout(() => {
              isIntroPlaying.current = false;
              if (globeRef.current) {
                globeRef.current.controls().maxDistance = 240;
              }
            }, 4000);
          }
        }, 800);
      }, 500);
    }
  }, [isFullyLoaded]);

  const globeMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create vertical gradient (poles to equator to poles) for aesthetic ocean depth
      const gradient = ctx.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, '#04152d');   // Deep dark navy at North Pole
      gradient.addColorStop(0.3, '#0b355c'); // Mid blue
      gradient.addColorStop(0.5, '#175d96'); // Brighter aesthetic blue at Equator
      gradient.addColorStop(0.7, '#0b355c'); // Mid blue
      gradient.addColorStop(1, '#04152d');   // Deep dark navy at South Pole

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 512);
    }
    const texture = new THREE.CanvasTexture(canvas);

    return new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 12,
    });
  }, []);

  const graticules = useMemo(() => {
    const paths = [];

    // Latitudes (parallels) every 5 degrees
    for (let lat = -85; lat <= 85; lat += 5) {
      const coords = [];
      for (let lng = -180; lng <= 180; lng += 5) {
        coords.push([lat, lng]);
      }
      paths.push(coords);
    }

    // Longitudes (meridians) every 5 degrees
    for (let lng = -180; lng <= 175; lng += 5) {
      const coords = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        coords.push([lat, lng]);
      }
      paths.push(coords);
    }

    return paths;
  }, []);

  const handleFocusBayOfBengal = () => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 13.5, lng: 90, altitude: 0.45 }, 2000);
      setFocusedRegion('bob');
      focusedRegionRef.current = 'bob';
    }
  };

  const handleFocusArabianSea = () => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 16.5, lng: 63.5, altitude: 0.45 }, 2000);
      setFocusedRegion('as');
      focusedRegionRef.current = 'as';
    }
  };

  const handleBackToOverview = () => {
    setFocusedRegion(null);
    focusedRegionRef.current = null;
    setClickedCell(null);
    setHoveredCell(null);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 5, lng: 80, altitude: 0.8 }, 1500);
    }
  };




  const clickedCellPolygon = useMemo(() => {
    if (!clickedCell) return null;
    const { minLat, minLng } = clickedCell;
    const coords = [];
    const numSegments = 10;
    const step = 5 / numSegments;

    for (let i = 0; i < numSegments; i++) coords.push([minLng, minLat + i * step]);
    for (let i = 0; i < numSegments; i++) coords.push([minLng + i * step, minLat + 5]);
    for (let i = 0; i < numSegments; i++) coords.push([minLng + 5, minLat + 5 - i * step]);
    for (let i = 0; i < numSegments; i++) coords.push([minLng + 5 - i * step, minLat]);
    coords.push([minLng, minLat]);

    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: { isClicked: true, isFadingOut: isClosing }
    };
  }, [clickedCell, isClosing]);

  const allPolygons = useMemo(() => {
    const polys = [...landPolygons];
    if (clickedCellPolygon) polys.push(clickedCellPolygon as any);

    if (hoveredCell) {
      if (clickedCell) {
        const hCoords = hoveredCell.geometry.coordinates[0][0]; // [lng, lat]
        if (hCoords[0] === clickedCell.minLng && hCoords[1] === clickedCell.minLat) {
          // Do not push hoveredCell if it matches clickedCell to prevent yellow overriding red
        } else {
          polys.push(hoveredCell);
        }
      } else {
        polys.push(hoveredCell);
      }
    }
    return polys;
  }, [landPolygons, hoveredCell, clickedCellPolygon, clickedCell]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
      <Globe
        ref={globeRef}
        backgroundColor="#000000"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        globeMaterial={globeMaterial}
        showAtmosphere={true}
        atmosphereColor="#00c8ff"
        atmosphereAltitude={0.1}
        pathsData={graticules}
        pathPoints={(d: any) => d}
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathColor={() => 'rgba(200, 200, 200, 0.12)'}
        polygonsData={allPolygons}
        polygonsTransitionDuration={800}
        polygonAltitude={(d: any) => (d.properties?.isHovered || d.properties?.isClicked) ? 0.011 : 0.01}
        polygonCapColor={(d: any) =>
          d.properties?.isFadingOut ? 'rgba(255, 50, 50, 0)' :
            d.properties?.isClicked ? 'rgba(255, 50, 50, 0.25)' :
              d.properties?.isHovered ? 'rgba(255, 191, 0, 0.15)' : '#ffffff'
        }
        polygonSideColor={(d: any) => (d.properties?.isHovered || d.properties?.isClicked) ? 'rgba(0, 0, 0, 0)' : '#ffffff'}
        polygonStrokeColor={(d: any) =>
          d.properties?.isFadingOut ? 'rgba(255, 50, 50, 0)' :
            d.properties?.isClicked ? 'rgba(255, 50, 50, 1)' :
              d.properties?.isHovered ? 'rgba(255, 191, 0, 1)' : 'rgba(255, 120, 130, 0.45)'
        }
        htmlElementsData={labels}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.innerHTML = d.text;
          el.style.color = d.isOcean ? 'rgba(255, 255, 255, 0.45)' : 'rgba(120, 120, 120, 0.6)';
          el.style.fontSize = d.isOcean ? '13px' : '10px';
          el.style.fontWeight = '300';
          el.style.fontFamily = 'Inter, sans-serif';
          el.style.letterSpacing = d.isOcean ? '1px' : '0.5px';
          el.style.pointerEvents = 'none';
          el.style.textShadow = d.isOcean ? 'none' : '0px 0px 2px rgba(255,255,255,0.8)';
          el.style.whiteSpace = 'nowrap';
          el.style.zIndex = '1';
          return el;
        }}
        onGlobeReady={() => {
          if (globeRef.current) {
            const renderer = globeRef.current.renderer();
            const camera = globeRef.current.camera();
            const scene = globeRef.current.scene();

            // --- Mouse hover raycasting for cursor pointer ---
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            let lastHoveredGrid: string | null = null;
            let pointerDownPos = { x: 0, y: 0 };
            let cachedGlobeMesh: any = null;
            let cachedSphereMesh: any = null;
            const onMouseMove = (event: MouseEvent) => {
              if (!focusedRegionRef.current) {
                renderer.domElement.style.cursor = 'default';
                if (lastHoveredGrid !== null) {
                  lastHoveredGrid = null;
                  setHoveredCell(null);
                }
                return;
              }

              const rect = renderer.domElement.getBoundingClientRect();
              mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
              mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
              raycaster.setFromCamera(mouse, camera);

              if (!cachedGlobeMesh) {
                cachedGlobeMesh = scene.children.find((c: any) => c.type === 'Group') || null;
              }
              if (!cachedGlobeMesh) return;

              if (!cachedSphereMesh) {
                // OPTIMIZATION: Instead of intersecting every complex country polygon and path on the globe (O(N) cost),
                // we specifically target the cached base globe sphere for an O(1) perfect mathematical intersection.
                cachedSphereMesh = cachedGlobeMesh.children.find((c: any) => c.type === 'Mesh' && c.material === globeMaterial) || null;
              }

              const intersects = cachedSphereMesh
                ? raycaster.intersectObject(cachedSphereMesh)
                : raycaster.intersectObjects(cachedGlobeMesh.children, true);

              if (intersects.length > 0) {
                const point = intersects[0].point;
                // Convert 3D point to lat/lng (globe radius ~100)
                const r = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
                const lat = (Math.asin(point.y / r) * 180) / Math.PI;
                const lng = (Math.atan2(point.x, point.z) * 180) / Math.PI;

                const bounds = REGION_BOUNDS[focusedRegionRef.current];
                if (lat >= bounds.minLat && lat <= bounds.maxLat &&
                  lng >= bounds.minLng && lng <= bounds.maxLng) {
                  renderer.domElement.style.cursor = 'pointer';

                  const minLat = Math.floor(lat / 5) * 5;
                  const minLng = Math.floor(lng / 5) * 5;
                  const gridKey = `${minLat}-${minLng}`;

                  if (lastHoveredGrid !== gridKey) {
                    lastHoveredGrid = gridKey;

                    const coords = [];
                    const numSegments = 10;
                    const step = 5 / numSegments;

                    // Left edge (up)
                    for (let i = 0; i < numSegments; i++) coords.push([minLng, minLat + i * step]);
                    // Top edge (right)
                    for (let i = 0; i < numSegments; i++) coords.push([minLng + i * step, minLat + 5]);
                    // Right edge (down)
                    for (let i = 0; i < numSegments; i++) coords.push([minLng + 5, minLat + 5 - i * step]);
                    // Bottom edge (left)
                    for (let i = 0; i < numSegments; i++) coords.push([minLng + 5 - i * step, minLat]);

                    coords.push([minLng, minLat]); // close loop

                    setHoveredCell({
                      type: 'Feature',
                      geometry: {
                        type: 'Polygon',
                        coordinates: [coords]
                      },
                      properties: { isHovered: true }
                    });
                  }
                } else {
                  renderer.domElement.style.cursor = 'default';
                  if (lastHoveredGrid !== null) {
                    lastHoveredGrid = null;
                    setHoveredCell(null);
                  }
                }
              } else {
                renderer.domElement.style.cursor = 'default';
                if (lastHoveredGrid !== null) {
                  lastHoveredGrid = null;
                  setHoveredCell(null);
                }
              }
            };

            const onPointerDown = (e: PointerEvent) => {
              pointerDownPos = { x: e.clientX, y: e.clientY };
            };

            const onPointerUp = (e: PointerEvent) => {
              const dx = e.clientX - pointerDownPos.x;
              const dy = e.clientY - pointerDownPos.y;
              if (Math.sqrt(dx * dx + dy * dy) > 5) return; // It was a drag

              const currentRegion = focusedRegionRef.current;
              if (!currentRegion) return;

              const rect = renderer.domElement.getBoundingClientRect();
              mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
              raycaster.setFromCamera(mouse, camera);

              if (!cachedGlobeMesh) {
                cachedGlobeMesh = scene.children.find((c: any) => c.type === 'Group') || null;
              }
              if (!cachedGlobeMesh) return;

              if (!cachedSphereMesh) {
                cachedSphereMesh = cachedGlobeMesh.children.find((c: any) => c.type === 'Mesh' && c.material === globeMaterial) || null;
              }

              const intersects = cachedSphereMesh
                ? raycaster.intersectObject(cachedSphereMesh)
                : raycaster.intersectObjects(cachedGlobeMesh.children, true);

              if (intersects.length > 0) {
                const point = intersects[0].point;
                const r = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
                const lat = (Math.asin(point.y / r) * 180) / Math.PI;
                const lng = (Math.atan2(point.x, point.z) * 180) / Math.PI;

                const bounds = REGION_BOUNDS[currentRegion];
                if (lat >= bounds.minLat && lat <= bounds.maxLat &&
                  lng >= bounds.minLng && lng <= bounds.maxLng) {
                  const minLat = Math.floor(lat / 5) * 5;
                  const maxLat = minLat + 5;
                  const minLng = Math.floor(lng / 5) * 5;
                  const maxLng = minLng + 5;

                  if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                  setClickedCell({ minLat, maxLat, minLng, maxLng });
                  setIsClosing(false);
                }
              }
            };

            renderer.domElement.addEventListener('mousemove', onMouseMove);
            renderer.domElement.addEventListener('pointerdown', onPointerDown);
            renderer.domElement.addEventListener('pointerup', onPointerUp);
            cleanupMouseRef.current = () => {
              renderer.domElement.removeEventListener('mousemove', onMouseMove);
              renderer.domElement.removeEventListener('pointerdown', onPointerDown);
              renderer.domElement.removeEventListener('pointerup', onPointerUp);
            };

            // Add aesthetic bloom effect using post-processing
            const composer = globeRef.current.postProcessingComposer();
            // params: resolution, strength, radius, threshold
            // Adjusted for a very subtle sweet spot
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.04, 0.2, 0.85);
            composer.addPass(bloomPass);

            let isZooming = false;
            let zoomSnapTimeout: ReturnType<typeof setTimeout> | null = null;
            renderer.domElement.addEventListener('wheel', () => {
              isZooming = true;
              if (zoomSnapTimeout) clearTimeout(zoomSnapTimeout);
              zoomSnapTimeout = setTimeout(() => {
                isZooming = false;
                if (!globeRef.current || isIntroPlaying.current || focusedRegionRef.current) return;
                const pov = globeRef.current.pointOfView();
                // If zoomed out past altitude 0.8, snap it back instantly
                if (pov.altitude > 0.8) {
                  globeRef.current.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: 0.8 }, 400);
                }
              }, 50);
            });

            // Cinematic Entrance: Start zoomed out on the opposite side of the globe
            globeRef.current.pointOfView({ lat: 0, lng: -100, altitude: 3.5 }, 0);

            // Mark globe as ready, flight animation triggered by useEffect
            setIsGlobeReady(true);

            const controls = globeRef.current.controls();
            // Add resistance feel by making rotation slightly heavier
            controls.rotateSpeed = 0.4;
            controls.zoomSpeed = 1.0; // Set once; never touched in the rAF loop
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // Free up the hard constraints to allow for our custom "catapult" physics
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = Math.PI;
            controls.minAzimuthAngle = -Infinity;
            controls.maxAzimuthAngle = Infinity;

            const softMinAz = (75 * Math.PI) / 180;
            const softMaxAz = (85 * Math.PI) / 180;
            const softMinPol = (80 * Math.PI) / 180;
            const softMaxPol = (90 * Math.PI) / 180;

            // Event listener for snapping back (catapult effect) when they let go
            controls.addEventListener('end', () => {
              // Prevent rotation snap from fighting with zoom wheel events (glitching)
              if (isZooming || !globeRef.current || isIntroPlaying.current || focusedRegionRef.current) return;

              const az = controls.getAzimuthalAngle();
              const pol = controls.getPolarAngle();
              const pov = globeRef.current.pointOfView();
              let needsSnap = false;

              let targetLat = pov.lat;
              let targetLng = pov.lng;
              let targetAlt = pov.altitude;

              // If rotation is out of bounds, snap rotation to center
              if (az < softMinAz || az > softMaxAz || pol < softMinPol || pol > softMaxPol) {
                targetLat = 5;
                targetLng = 80;
                needsSnap = true;
              }

              if (needsSnap) {
                globeRef.current.pointOfView({ lat: targetLat, lng: targetLng, altitude: targetAlt }, 800);
              }
            });

            // Physics loop for dynamic dragging resistance
            let lastRotOutAmount = 0;
            const applyResistance = () => {
              if (globeRef.current && !isIntroPlaying.current && !focusedRegionRef.current) {
                const az = controls.getAzimuthalAngle();
                const pol = controls.getPolarAngle();

                let rotOutAmount = 0;
                if (az < softMinAz) rotOutAmount = Math.max(rotOutAmount, softMinAz - az);
                if (az > softMaxAz) rotOutAmount = Math.max(rotOutAmount, az - softMaxAz);
                if (pol < softMinPol) rotOutAmount = Math.max(rotOutAmount, softMinPol - pol);
                if (pol > softMaxPol) rotOutAmount = Math.max(rotOutAmount, pol - softMaxPol);

                // Apply rotation resistance
                if (rotOutAmount > 0 && rotOutAmount >= lastRotOutAmount) {
                  controls.rotateSpeed = Math.max(0.01, 0.4 - (rotOutAmount * 1.5));
                } else {
                  controls.rotateSpeed = 0.4; // normal speed
                }

                lastRotOutAmount = rotOutAmount;
              }
              reqIdRef.current = requestAnimationFrame(applyResistance);
            };

            // Start the physics loop
            applyResistance();
          }
        }}
      />

      {/* Overlay controls */}
      <div
        className="glass-panel"
        onMouseEnter={() => setHoveredCell(null)}
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '16px',
          padding: '16px 24px',
          borderRadius: '24px',
          zIndex: 10
        }}
      >
        {focusedRegion ? (
          <button className="pill-button" onClick={handleBackToOverview}>
            ← Back to Overview
          </button>
        ) : (
          <>
            <button className="pill-button" onClick={handleFocusArabianSea}>
              Focus Arabian Sea
            </button>
            <button className="pill-button" onClick={handleFocusBayOfBengal}>
              Focus Bay of Bengal
            </button>
          </>
        )}
      </div>

      {/* Grid cell popup — only shown when in focus and a cell is clicked */}
      {clickedCell && focusedRegion && (
        <div
          className={`sidebar-panel ${isClosing ? 'sidebar-panel-closing' : ''}`}
          onMouseEnter={() => setHoveredCell(null)}
          onAnimationEnd={() => {
            if (isClosing) {
              // Sidebar takes 400ms to close. Wait 400ms more for the 800ms fade to finish completely.
              closeTimeoutRef.current = setTimeout(() => {
                setClickedCell(null);
                setIsClosing(false);
              }, 400);
            }
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '500', letterSpacing: '0.5px' }}>
              Ocean State Profile
            </h3>
            <button
              onClick={() => setIsClosing(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0 4px',
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '300', lineHeight: '1.8', color: 'rgba(255,255,255,0.65)' }}>
            <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Latitude:</span> {clickedCell.minLat}°N – {clickedCell.maxLat}°N</div>
            <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Longitude:</span> {clickedCell.minLng}°E – {clickedCell.maxLng}°E</div>

            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '500', color: '#8bb6d6', textTransform: 'uppercase', letterSpacing: '1px' }}>Satellite Surface Inputs</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>SST:</span> {dummyOceanData.surface_inputs.SST_celsius}°C</div>
                <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>SSS:</span> {dummyOceanData.surface_inputs.SSS_psu} psu</div>
                <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>SSH:</span> {dummyOceanData.surface_inputs.SSH_meters}m</div>
                <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Currents:</span> {dummyOceanData.surface_inputs.currents_uv.join(', ')}</div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'rgba(255,255,255,0.4)' }}>Winds:</span> {dummyOceanData.surface_inputs.winds_uv.join(', ')} m/s</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '500', color: '#8bb6d6', textTransform: 'uppercase', letterSpacing: '1px' }}>Model Validation</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>RMSE:</span> {dummyOceanData.validation_metrics.RMSE}</div>
                <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Corr:</span> {dummyOceanData.validation_metrics.correlation}</div>
                <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Bias:</span> {dummyOceanData.validation_metrics.bias}</div>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #175d96, #0b355c)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(23, 93, 150, 0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(23, 93, 150, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(23, 93, 150, 0.4)';
              }}
            >
              View 3D Subsurface Profile
            </button>
          </div>
        </div>
      )}

      <DepthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} predictions={dummyOceanData.ai_predictions} />

      {showLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            backgroundColor: '#000',
            opacity: fadeOutLoading ? 0 : 1,
            transition: 'opacity 0.8s ease-in-out',
            pointerEvents: 'none',
            backgroundImage: `url(${LoadingBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: '60px',
          }}
        >
          <h1 style={{
            margin: 0,
            fontSize: '56px',
            fontWeight: 500,
            fontFamily: "'Google Sans', 'Product Sans', sans-serif",
            color: '#fff',
            letterSpacing: '-1.5px',
            animation: 'strobe 2s ease-in-out infinite',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            OceanEmbed
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '15px',
            fontWeight: 400,
            fontFamily: "'Google Sans', 'Product Sans', sans-serif",
            color: 'rgba(255, 255, 255, 0.8)',
            letterSpacing: '-0.2px',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}>
            Satellite Embedding-Based Ocean Reconstruction
          </p>
        </div>
      )}
    </div>
  );
};

export default OceanGlobeView;
