export interface OceanData {
  latitude_range: string;
  longitude_range: string;
  surface_inputs: {
    SST_celsius: number;
    SSS_psu: number;
    SSH_meters: number;
    currents_uv: number[];
    winds_uv: number[];
  };
  ai_predictions: {
    depths_m: number[];
    temps_celsius: number[];
  };
  validation_metrics: {
    RMSE: number;
    correlation: number;
    bias: number;
  };
}

export const regionalMockData: Record<string, OceanData> = {};

const depths_m = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000];
const baseTemps_celsius = [29.4, 29.3, 29.1, 28.8, 28.5, 27.2, 25.4, 22.1, 19.5, 17.2, 14.8, 11.2, 8.4, 6.1, 4.3];

const addVariation = (arr: number[], factor: number) => 
  arr.map(val => Number((val + (Math.random() * factor - factor / 2)).toFixed(1)));

// Bay of Bengal (Latitude 5°N to 20°N, Longitude 80°E to 100°E)
// SSS ~32 psu
for (let lat = 5; lat <= 20; lat += 5) {
  for (let lon = 80; lon <= 95; lon += 5) {
    // Simulate slight temperature and salinity variations
    const isNorth = lat >= 15;
    const tempOffset = isNorth ? -0.5 : 0.5; // Cooler in north
    const temps = addVariation(baseTemps_celsius.map(t => t + tempOffset), 0.4);
    
    regionalMockData[`${lat},${lon}`] = {
      latitude_range: `${lat}°N - ${lat + 5}°N`,
      longitude_range: `${lon}°E - ${lon + 5}°E`,
      surface_inputs: {
        SST_celsius: temps[0],
        SSS_psu: Number((32.0 + Math.random() * 1.5 - 0.75).toFixed(1)), // Bay of Bengal has lower salinity
        SSH_meters: Number((0.1 + Math.random() * 0.1).toFixed(2)),
        currents_uv: [Number((Math.random() * 0.8 - 0.4).toFixed(2)), Number((Math.random() * 0.8 - 0.4).toFixed(2))],
        winds_uv: [Number((Math.random() * 6 - 3).toFixed(1)), Number((Math.random() * 6 - 3).toFixed(1))]
      },
      ai_predictions: {
        depths_m,
        temps_celsius: temps
      },
      validation_metrics: {
        RMSE: Number((0.3 + Math.random() * 0.2).toFixed(2)),
        correlation: Number((0.85 + Math.random() * 0.1).toFixed(2)),
        bias: Number((0.01 + Math.random() * 0.08).toFixed(2))
      }
    };
  }
}

// Arabian Sea (Latitude 10°N to 25°N, Longitude 50°E to 75°E)
// SSS ~35 psu
for (let lat = 10; lat <= 25; lat += 5) {
  for (let lon = 50; lon <= 75; lon += 5) {
    // Simulate slight temperature and salinity variations
    const isNorth = lat >= 20;
    const tempOffset = isNorth ? -1.0 : 0.2; // Cooler in north
    const temps = addVariation(baseTemps_celsius.map(t => t + tempOffset), 0.4);
    
    regionalMockData[`${lat},${lon}`] = {
      latitude_range: `${lat}°N - ${lat + 5}°N`,
      longitude_range: `${lon}°E - ${lon + 5}°E`,
      surface_inputs: {
        SST_celsius: temps[0],
        SSS_psu: Number((35.5 + Math.random() * 1.0 - 0.5).toFixed(1)), // Arabian Sea has higher salinity
        SSH_meters: Number((0.15 + Math.random() * 0.1).toFixed(2)),
        currents_uv: [Number((Math.random() * 0.8 - 0.4).toFixed(2)), Number((Math.random() * 0.8 - 0.4).toFixed(2))],
        winds_uv: [Number((Math.random() * 8 - 4).toFixed(1)), Number((Math.random() * 8 - 4).toFixed(1))]
      },
      ai_predictions: {
        depths_m,
        temps_celsius: temps
      },
      validation_metrics: {
        RMSE: Number((0.35 + Math.random() * 0.2).toFixed(2)),
        correlation: Number((0.82 + Math.random() * 0.1).toFixed(2)),
        bias: Number((0.02 + Math.random() * 0.08).toFixed(2))
      }
    };
  }
}

// Special case: Explicitly remove or simulate landmass for known land coordinates if desired.
// We will handle "landmass fallback UI" directly in the component when the key is missing or explicitly dropped.
// For coastline grids, we still keep them in the dictionary so the 3D plot shows the ocean part,
// and we'll randomly mask null values in the 3D plot renderer itself.

// Let's remove purely inland grids if they exist in the bounding box.
// (e.g. 20, 75 is inland India, we can delete it so it falls back to the "Landmass" UI)
delete regionalMockData['20,75'];
delete regionalMockData['25,75'];
delete regionalMockData['15,75'];
delete regionalMockData['20,80'];
delete regionalMockData['25,80'];
delete regionalMockData['25,85'];
