import React, { useMemo } from 'react';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { OceanData } from '../utils/regionalMockData';

interface Props {
  data: OceanData;
}

const ValidationMetricsDisplay: React.FC<Props> = ({ data }) => {
  const chartData = useMemo(() => {
    return data.ai_predictions.depths_m.map((depth, idx) => ({
      depth,
      predicted: data.ai_predictions.temps_celsius[idx],
      argo: data.ai_predictions.argo_temps_celsius[idx],
    }));
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      
      {/* Top Section: Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Correlation</div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#8bb6d6' }}>{data.validation_metrics.correlation.toFixed(2)}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>RMSE</div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#ff7882' }}>{data.validation_metrics.RMSE.toFixed(2)}°C</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bias</div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#ffd56b' }}>{data.validation_metrics.bias > 0 ? '+' : ''}{data.validation_metrics.bias.toFixed(2)}°C</div>
        </div>
      </div>

      {/* Bottom Section: Chart */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>Subsurface Temperature Profile</h4>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
              style={{ outline: 'none' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
              
              {/* Inverted Y-axis for Depth */}
              <YAxis 
                type="number" 
                dataKey="depth" 
                reversed={true} 
                domain={[0, 1000]}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                tickFormatter={(val) => `${val}m`}
                axisLine={false}
                tickLine={false}
              />
              
              <XAxis 
                type="number" 
                domain={['dataMin - 1', 'dataMax + 1']}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                tickFormatter={(val) => `${Number(val.toFixed(1))}°`}
                axisLine={false}
                tickLine={false}
                orientation="top"
              />
              
              <Tooltip 
                contentStyle={{ background: 'rgba(10,25,45,0.95)', border: '1px solid rgba(139,182,214,0.3)', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: any, name: any) => [`${Number(value).toFixed(2)} °C`, name === 'predicted' ? 'AI Prediction' : 'ARGO Float']}
                labelFormatter={(label) => `Depth: ${label}m`}
              />
              
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value === 'predicted' ? 'AI Prediction' : 'ARGO In-Situ'}</span>}
              />
              
              <Line 
                dataKey="predicted" 
                type="monotone" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff' }}
              />
              
              <Scatter 
                dataKey="argo" 
                fill="#ef4444" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
};

export default ValidationMetricsDisplay;
