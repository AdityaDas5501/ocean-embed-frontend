export const dummyOceanData = {
  "latitude_range": "10°N - 15°N",
  "longitude_range": "85°E - 90°E",
  "surface_inputs": {
    "SST_celsius": 29.4,
    "SSS_psu": 33.1,
    "SSH_meters": 0.14,
    "currents_uv": [0.4, -0.2],
    "winds_uv": [5.1, 1.2]
  },
  "ai_predictions": {
    "depths_m": [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000],
    "temps_celsius": [29.4, 29.3, 29.1, 28.8, 28.5, 27.2, 25.4, 22.1, 19.5, 17.2, 14.8, 11.2, 8.4, 6.1, 4.3]
  },
  "validation_metrics": {
    "RMSE": 0.42,
    "correlation": 0.91,
    "bias": 0.05
  }
};
