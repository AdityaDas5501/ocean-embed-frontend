import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle,
  LogOut,
  ChevronRight,
  X,
  Shield,
  Globe,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOutUser } from '../services/firebase';

const DRAWER_WIDTH = 320; // width of the sliding profile panel in px

const UserProfileDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'OE';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* ── Darkened Backdrop for focus when open ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 1400,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sliding Panel Container (carries the sticking-out Tab on its right edge) ── */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : -DRAWER_WIDTH }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: `${DRAWER_WIDTH}px`,
          zIndex: 1450,
          pointerEvents: 'none', // let clicks pass through the wrapper; panel & tab re-enable pointerEvents
        }}
      >
        {/* ── The Left-Edge Sticking-Out Tab ("Chamfered Handle") ── */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${DRAWER_WIDTH - 1}px`, // anchored to panel's right edge so it sticks out into the viewport
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
            cursor: 'pointer',
            zIndex: 10,
          }}
          onClick={() => setIsOpen((prev) => !prev)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title={isOpen ? 'Collapse Profile' : 'Open User Profile'}
        >
          <motion.div
            animate={{
              x: !isOpen && isHovered ? 4 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{
              position: 'relative',
              width: '38px',
              height: '84px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: isHovered
                ? 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.55)) drop-shadow(2px 0 8px rgba(0, 0, 0, 0.6))'
                : 'drop-shadow(2px 0 10px rgba(0, 0, 0, 0.5))',
              transition: 'filter 0.25s ease',
            }}
          >
            {/* SVG Chamfered Shape matching the user's sketch */}
            <svg
              width="38"
              height="84"
              viewBox="0 0 38 84"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <path
                d="M 0 0 L 36 22 L 36 62 L 0 84 Z"
                fill="rgba(6, 20, 42, 0.92)"
                stroke={isHovered ? 'rgba(56, 189, 248, 0.8)' : 'rgba(139, 182, 214, 0.35)'}
                strokeWidth="1.5"
                style={{
                  transition: 'stroke 0.25s ease',
                  backdropFilter: 'blur(16px)',
                }}
              />
            </svg>

            {/* Chevron Icon (flips 180° when open) */}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isHovered ? '#38bdf8' : 'rgba(139, 182, 214, 0.85)',
                transition: 'color 0.2s ease',
                paddingLeft: '2px', // slight visual optical centering on the tapered handle
              }}
            >
              <ChevronRight size={18} strokeWidth={2.6} />
            </motion.div>
          </motion.div>
        </div>

        {/* ── Main Sidepanel Body ── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '100%',
            background: 'rgba(4, 18, 38, 0.94)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRight: '1px solid rgba(139, 182, 214, 0.22)',
            boxShadow: '12px 0 45px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
            fontFamily: "'Inter', -apple-system, sans-serif",
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {/* ── Panel Header ── */}
          <div
            style={{
              padding: '24px 20px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(139, 182, 214, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <UserCircle size={18} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#ffffff',
                    fontFamily: "'Syne', sans-serif",
                    letterSpacing: '-0.3px',
                  }}
                >
                  Explorer Account
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    color: '#34d399',
                    fontWeight: 500,
                    marginTop: '2px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#34d399',
                      boxShadow: '0 0 8px #34d399',
                    }}
                  />
                  Online Session
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(139, 182, 214, 0.18)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'rgba(255, 255, 255, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Close Profile"
            >
              <X size={16} />
            </button>
          </div>

          {/* ── User Profile Card ── */}
          <div style={{ padding: '20px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(14, 38, 70, 0.6), rgba(8, 24, 48, 0.4))',
                border: '1px solid rgba(139, 182, 214, 0.2)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle accent glow top-right */}
              <div
                style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Avatar with glow and status dot */}
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    padding: '3px',
                    background: 'linear-gradient(135deg, #38bdf8, #2563eb, #0284c7)',
                    boxShadow: '0 0 16px rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.name || 'User'}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #075985, #1e3a8a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 700,
                        fontSize: '22px',
                        color: '#ffffff',
                        letterSpacing: '1px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {getInitials(user?.name)}
                    </div>
                  )}
                </div>

                {/* Verified badge icon */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#04152d',
                    border: '1.5px solid #04152d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <CheckCircle2 size={16} fill="#0284c7" color="#ffffff" />
                </div>
              </div>

              {/* Name */}
              <h2
                style={{
                  margin: '0 0 4px',
                  fontSize: '17px',
                  fontWeight: 600,
                  color: '#ffffff',
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: '-0.3px',
                }}
              >
                {user?.name || 'Aditya Das'}
              </h2>

              {/* Email */}
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  maxWidth: '240px',
                  wordBreak: 'break-all',
                }}
              >
                {user?.email || 'aditya@oceanembed.ai'}
              </p>

              {/* Role Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.2px',
                }}
              >
                <Shield size={12} />
                <span>{user?.role || 'Lead Oceanographer'}</span>
              </div>
            </div>
          </div>

          {/* ── Telemetry & System Specs ── */}
          <div style={{ padding: '0 20px 20px', flex: 1 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#64748b',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Activity size={13} color="#38bdf8" />
              <span>Workspace Diagnostics</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Coverage Scope */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(139, 182, 214, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                  <Globe size={14} color="#34d399" />
                  <span>Coverage Scope</span>
                </div>
                <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500 }}>
                  BoB & Arabian Sea
                </span>
              </div>

              {/* AI Architecture */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(139, 182, 214, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                  <Cpu size={14} color="#f472b6" />
                  <span>AI Architecture</span>
                </div>
                <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500 }}>
                  PyTorch SIH-v1
                </span>
              </div>

              {/* Spatial Sampling */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(139, 182, 214, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                  <Layers size={14} color="#fbbf24" />
                  <span>Spatial Resolution</span>
                </div>
                <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500 }}>
                  5.0° Grid Cells
                </span>
              </div>
            </div>

            {/* Hint Box */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.04)',
                border: '1px dashed rgba(56, 189, 248, 0.2)',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: 1.5,
              }}
            >
              Click any 5° cell on the 3D globe to run subsurface profiles reconstructed from Copernicus SST/SSS & NASA SSH/Winds telemetry.
            </div>
          </div>

          {/* ── Bottom Section: Logout Button ── */}
          <div
            style={{
              padding: '18px 20px 24px',
              borderTop: '1px solid rgba(139, 182, 214, 0.12)',
              marginTop: 'auto',
            }}
          >
            <button
              id="user-logout-btn"
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default UserProfileDrawer;
