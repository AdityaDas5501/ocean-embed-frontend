import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { OceanData } from '../utils/regionalMockData';

interface ObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'SST' | 'SSS' | 'SSH' | 'Currents' | 'Winds' | null;
  data: OceanData | null;
  latRange?: [number, number];
  lngRange?: [number, number];
}

const ObservationModal: React.FC<ObservationModalProps> = ({ isOpen, onClose, metricType, data, latRange, lngRange }) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  const handleAnimationComplete = () => {
    if (!isOpen) setShouldRender(false);
  };

  // Generate 14-day mock historical data
  const chartData = useMemo(() => {
    if (!data || !metricType) return [];
    
    let baseValue = 0;
    let variance = 0;
    
    if (metricType === 'SST') {
      baseValue = data.surface_inputs.SST_celsius;
      variance = 1.5;
    } else if (metricType === 'SSS') {
      baseValue = data.surface_inputs.SSS_psu;
      variance = 0.5;
    } else if (metricType === 'SSH') {
      baseValue = data.surface_inputs.SSH_meters;
      variance = 0.2;
    } else if (metricType === 'Currents') {
      baseValue = Math.sqrt(Math.pow(data.surface_inputs.currents_uv[0], 2) + Math.pow(data.surface_inputs.currents_uv[1], 2));
      variance = 0.3;
    } else if (metricType === 'Winds') {
      baseValue = Math.sqrt(Math.pow(data.surface_inputs.winds_uv[0], 2) + Math.pow(data.surface_inputs.winds_uv[1], 2));
      variance = 2.0;
    }

    const history = [];
    // Generate past 14 days
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Jitter using sine wave + random noise
      const phase = (i / 14) * Math.PI * 2;
      const noise = (Math.random() - 0.5) * variance;
      const wave = Math.sin(phase) * (variance / 2);
      
      const val = baseValue + wave + noise;
      
      history.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Number(val.toFixed(2))
      });
    }
    return history;
  }, [data, metricType]);

  if (!shouldRender || !data || !metricType) return null;

  const config = {
    'SST': { title: 'Sea Surface Temperature (SST)', color: '#ff7882', unit: '°C' },
    'SSS': { title: 'Sea Surface Salinity (SSS)', color: '#35b779', unit: ' psu' },
    'SSH': { title: 'Sea Surface Height (SSH)', color: '#8bb6d6', unit: 'm' },
    'Currents': { title: 'Surface Currents Magnitude', color: '#fde725', unit: ' m/s' },
    'Winds': { title: 'Surface Winds Magnitude', color: '#d4a5a5', unit: ' m/s' },
  }[metricType];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={handleAnimationComplete}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(2, 8, 16, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '800px',
              height: '70vh',
              background: 'linear-gradient(145deg, rgba(16, 33, 54, 0.95), rgba(8, 16, 28, 0.95))',
              border: '1px solid rgba(139, 182, 214, 0.2)',
              borderRadius: '24px',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: config.color, letterSpacing: '0.5px' }}>
                  {config.title}
                </h2>
                <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                  {latRange && lngRange 
                    ? `14-Day Historical Trend for Region: ${latRange[0]}°N - ${latRange[1]}°N, ${lngRange[0]}°E - ${lngRange[1]}°E`
                    : '14-Day Historical Trend'}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 50, 50, 0.15)';
                  e.currentTarget.style.color = '#ff6b6b';
                  e.currentTarget.style.borderColor = 'rgba(255, 50, 50, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '32px', minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={config.color} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.4)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.4)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(val) => `${val}${config.unit}`}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(10,25,45,0.95)', border: `1px solid ${config.color}`, borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)}${config.unit}`, 'Observed Value']}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 4px 0' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={config.color} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ r: 6, fill: config.color, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ObservationModal;
