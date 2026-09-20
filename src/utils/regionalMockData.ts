export interface OceanData {
  latitude_range: string;
  longitude_range: string;
  surface_inputs: {
    SST_celsius: number;
    SSS_psu: number;
    SSH_meters: number;
    currents_uv: number[];
    winds_uv: number[];
    currents_vector_grid: [number, number][][];
    winds_vector_grid: [number, number][][];
  };
  ai_predictions: {
    depths_m: number[];
    temps_celsius: number[];
    argo_temps_celsius: number[];
  };
  validation_metrics: {
    RMSE: number;
    correlation: number;
    bias: number;
  };
}

/**
 * Formats a Date object into an ISO date key string (YYYY-MM-DD).
 * Used to index into the per-date mock data dictionaries.
 */
export const formatDateKey = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const regionalMockData: Record<string, Record<string, OceanData>> = {};

const depths_m = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000];
const baseTemps_celsius = [29.4, 29.3, 29.1, 28.8, 28.5, 27.2, 25.4, 22.1, 19.5, 17.2, 14.8, 11.2, 8.4, 6.1, 4.3];

// The dates we generate mock data for
const MOCK_DATES = ['2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21'];

const addVariation = (arr: number[], factor: number) => 
  arr.map(val => Number((val + (Math.random() * factor - factor / 2)).toFixed(1)));

const generateVectorGrid = (baseU: number, baseV: number, variance: number): [number, number][][] => {
  const grid: [number, number][][] = [];
  const phaseX = Math.random() * Math.PI * 2;
  const phaseY = Math.random() * Math.PI * 2;
  for (let i = 0; i < 20; i++) {
    const row: [number, number][] = [];
    for (let j = 0; j < 20; j++) {
      const dx = Math.sin(phaseX + i * 0.2 + j * 0.1) * variance;
      const dy = Math.cos(phaseY + j * 0.2 + i * 0.1) * variance;
      row.push([Number((baseU + dx).toFixed(3)), Number((baseV + dy).toFixed(3))]);
    }
    grid.push(row);
  }
  return grid;
};

/**
 * Generates OceanData for a given coordinate and date index.
 * The dateIndex (0–3) applies a deterministic offset on top of the base random values
 * so that stepping between days produces visible but subtle changes.
 */
const generateDataForCoordDate = (
  lat: number,
  lon: number,
  tempOffset: number,
  baseSSSCenter: number,
  sssRange: number,
  windRange: number,
  windGridVariance: number,
  dateIndex: number,
  rmseBase: number,
  corrBase: number,
  biasBase: number,
): OceanData => {
  // Deterministic day-to-day offsets — subtle but visible
  const dayTempShift = (dateIndex - 1.5) * 0.15;  // roughly ±0.2°C across 4 days
  const daySSSShift = (dateIndex - 1.5) * 0.08;   // roughly ±0.12 psu
  const dayWindShift = (dateIndex - 1.5) * 0.3;   // roughly ±0.45 m/s

  const temps = addVariation(
    baseTemps_celsius.map(t => t + tempOffset + dayTempShift), 
    0.4
  );
  const argoTemps = addVariation(temps, 0.4);

  const cU = Number((Math.random() * 0.8 - 0.4).toFixed(2));
  const cV = Number((Math.random() * 0.8 - 0.4).toFixed(2));
  const wU = Number((Math.random() * windRange - windRange / 2 + dayWindShift).toFixed(1));
  const wV = Number((Math.random() * windRange - windRange / 2 + dayWindShift).toFixed(1));

  return {
    latitude_range: `${lat}°N - ${lat + 5}°N`,
    longitude_range: `${lon}°E - ${lon + 5}°E`,
    surface_inputs: {
      SST_celsius: temps[0],
      SSS_psu: Number((baseSSSCenter + Math.random() * sssRange - sssRange / 2 + daySSSShift).toFixed(1)),
      SSH_meters: Number((0.1 + Math.random() * 0.1 + dateIndex * 0.005).toFixed(2)),
      currents_uv: [cU, cV],
      winds_uv: [wU, wV],
      currents_vector_grid: generateVectorGrid(cU, cV, 0.4),
      winds_vector_grid: generateVectorGrid(wU, wV, windGridVariance),
    },
    ai_predictions: {
      depths_m,
      temps_celsius: temps,
      argo_temps_celsius: argoTemps,
    },
    validation_metrics: {
      RMSE: Number((rmseBase + Math.random() * 0.2).toFixed(2)),
      correlation: Number((corrBase + Math.random() * 0.1).toFixed(2)),
      bias: Number((biasBase + Math.random() * 0.08).toFixed(2)),
    },
  };
};

// Bay of Bengal (Latitude 5°N to 20°N, Longitude 80°E to 100°E)
// SSS ~32 psu
for (let lat = 5; lat <= 20; lat += 5) {
  for (let lon = 80; lon <= 95; lon += 5) {
    const isNorth = lat >= 15;
    const tempOffset = isNorth ? -0.5 : 0.5;
    const coordKey = `${lat},${lon}`;
    regionalMockData[coordKey] = {};

    MOCK_DATES.forEach((dateStr, dateIndex) => {
      regionalMockData[coordKey][dateStr] = generateDataForCoordDate(
        lat, lon, tempOffset,
        /* baseSSSCenter */ 32.0, /* sssRange */ 1.5,
        /* windRange */ 6, /* windGridVariance */ 3.0,
        dateIndex,
        /* rmseBase */ 0.3, /* corrBase */ 0.85, /* biasBase */ 0.01,
      );
    });
  }
}

// Arabian Sea (Latitude 10°N to 25°N, Longitude 50°E to 75°E)
// SSS ~35 psu
for (let lat = 10; lat <= 25; lat += 5) {
  for (let lon = 50; lon <= 75; lon += 5) {
    const isNorth = lat >= 20;
    const tempOffset = isNorth ? -1.0 : 0.2;
    const coordKey = `${lat},${lon}`;
    regionalMockData[coordKey] = {};

    MOCK_DATES.forEach((dateStr, dateIndex) => {
      regionalMockData[coordKey][dateStr] = generateDataForCoordDate(
        lat, lon, tempOffset,
        /* baseSSSCenter */ 35.5, /* sssRange */ 1.0,
        /* windRange */ 8, /* windGridVariance */ 4.0,
        dateIndex,
        /* rmseBase */ 0.35, /* corrBase */ 0.82, /* biasBase */ 0.02,
      );
    });
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
