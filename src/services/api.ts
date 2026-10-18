// ─── OceanEmbed API Client ────────────────────────────────────────────────────
// Backend: Configured via VITE_API_BASE_URL in .env
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export let inMemoryToken: string | null = null;
export const setInMemoryToken = (token: string | null) => {
  inMemoryToken = token;
};

// ─── TypeScript Interfaces (mirrors backend Pydantic schemas) ─────────────────

export interface SurfaceInputs {
  SST_celsius: number;
  SSS_psu: number;
  SSH_meters: number;
  currents_uv: number[];
  winds_uv: number[];
  currents_vector_grid: ({ u: number; v: number } | null)[][];
  winds_vector_grid: ({ u: number; v: number } | null)[][];
}

export interface AIPrediction {
  depth: number;
  temps_celsius: number;
  argo_temps_celsius: number;
  temps_grid?: (number | null)[][];
}

export interface ValidationMetrics {
  RMSE: number;
  correlation: number;
  bias: number;
}

export interface OceanDataResponse {
  latitude_range: string;
  longitude_range: string;
  surface_inputs: SurfaceInputs;
  ai_predictions: AIPrediction[];
  validation_metrics: ValidationMetrics;
}

export interface OceanTaskResponse {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  result?: OceanDataResponse;
}

/** Returned by the backend on 404 / 422 */
export interface ErrorResponse {
  error_code: string;
  message: string;
  lat: number;
  lon: number;
  date: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// ─── Custom Error Classes ─────────────────────────────────────────────────────

/** Thrown when the backend returns 404 (no telemetry) or 422 (invalid input). */
export class ApiDataError extends Error {
  public readonly statusCode: number;
  public readonly errorPayload: ErrorResponse;

  constructor(statusCode: number, payload: ErrorResponse) {
    super(payload.message);
    this.name = 'ApiDataError';
    this.statusCode = statusCode;
    this.errorPayload = payload;
  }
}

/** Thrown when the backend is unreachable (network failure / timeout). */
export class NetworkError extends Error {
  constructor(cause?: unknown, message?: string) {
    super(message || 'Backend is unreachable. Check your network connection.');
    this.name = 'NetworkError';
    if (cause instanceof Error) {
      this.stack = cause.stack;
    }
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Formats a Date object into an ISO date string (YYYY-MM-DD).
 * Used as the `date` query parameter for the ocean profile endpoint.
 */
export const formatDateKey = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Centralized fetch wrapper to inject headers and handle 422s */
async function fetchWithTracing(url: string, options: RequestInit = {}, traceId?: string) {
  const headers = new Headers(options.headers || {});
  if (traceId) headers.set('x-trace-id', traceId);
  
  // Inject JWT token for authenticated Node Gateway routes
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || inMemoryToken;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, { ...options, headers });
}

async function handleApiError(response: Response, defaultErrorPayload: Partial<ErrorResponse>): Promise<never> {
  let errorData: any = null;
  try {
    errorData = await response.json();
  } catch {
    // response is not JSON
  }

  if (response.status === 404 || response.status === 422) {
    let payload: ErrorResponse;
    if (response.status === 422 && errorData?.detail && Array.isArray(errorData.detail) && errorData.detail.length > 0) {
      payload = {
        error_code: `HTTP_422`,
        message: errorData.detail[0].msg,
        lat: defaultErrorPayload.lat || 0,
        lon: defaultErrorPayload.lon || 0,
        date: defaultErrorPayload.date || ''
      };
    } else {
      payload = (errorData as ErrorResponse) || {
        error_code: `HTTP_${response.status}`,
        message: response.statusText || 'No data available.',
        lat: defaultErrorPayload.lat || 0,
        lon: defaultErrorPayload.lon || 0,
        date: defaultErrorPayload.date || '',
      };
    }
    throw new ApiDataError(response.status, payload);
  }

  if (response.status === 401 || response.status === 403) {
    const msg = errorData?.message || 'Authentication required. Please sign in to access forecasts.';
    throw new NetworkError(new Error(msg), msg);
  }

  if (response.status === 503) {
    const msg = errorData?.detail || errorData?.message || 'AI Model is not loaded on the backend (LOAD_MODEL=false).';
    throw new NetworkError(new Error(msg), msg);
  }

  const msg = errorData?.message || errorData?.detail || `Unexpected server error (${response.status}): ${response.statusText}`;
  throw new NetworkError(new Error(msg), msg);
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetches the ocean subsurface profile for a given 5° grid cell corner
 * (bottom-left lat/lon) and date.
 *
 * @param lat   - Latitude of the grid cell's southern edge (e.g. 10)
 * @param lon   - Longitude of the grid cell's western edge (e.g. 80)
 * @param date  - ISO date string (YYYY-MM-DD)
 * @param signal - Optional AbortSignal to cancel an in-flight request
 * @param traceId - Optional tracing ID for telemetry
 *
 * @throws {NetworkError}  if the server is unreachable
 * @throws {ApiDataError}  if the server returns 404 or 422
 */
export async function fetchOceanProfile(
  lat: number,
  lon: number,
  date: string,
  signal?: AbortSignal,
  traceId?: string
): Promise<OceanDataResponse | OceanTaskResponse> {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw new ApiDataError(422, {
      error_code: 'VALIDATION_ERROR',
      message: 'Date must strictly match YYYY-MM-DD format',
      lat,
      lon,
      date,
    });
  }

  const url = `${API_BASE_URL}/ocean/profile?lat=${lat}&lon=${lon}&date=${date}&async=true`;
  let response: Response;
  try {
    response = await fetchWithTracing(url, { signal }, traceId);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new NetworkError(err);
  }

  if (response.ok) {
    return response.json() as Promise<OceanDataResponse | OceanTaskResponse>;
  }
  return handleApiError(response, { lat, lon, date });
}

export async function fetchOceanTask(
  taskId: string,
  lat: number,
  lon: number,
  date: string,
  signal?: AbortSignal,
  traceId?: string
): Promise<OceanTaskResponse> {
  const url = `${API_BASE_URL}/ocean/task/${taskId}?lat=${lat}&lon=${lon}&date=${date}`;
  let response: Response;
  try {
    response = await fetchWithTracing(url, { signal }, traceId);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new NetworkError(err);
  }

  if (response.ok) {
    return response.json() as Promise<OceanTaskResponse>;
  }
  return handleApiError(response, { lat, lon, date });
}

export async function fetchAvailableDates(lat: number, lon: number, traceId?: string): Promise<any> {
  const url = `${API_BASE_URL}/ocean/available-dates?lat=${lat}&lon=${lon}`;
  let response: Response;
  try {
    response = await fetchWithTracing(url, {}, traceId);
  } catch (err) {
    throw new NetworkError(err);
  }
  if (response.ok) return response.json();
  return handleApiError(response, { lat, lon });
}

export async function fetchRegionSummary(region: string, date: string, traceId?: string): Promise<any> {
  const url = `${API_BASE_URL}/ocean/region-summary?region=${region}&date=${date}`;
  let response: Response;
  try {
    response = await fetchWithTracing(url, {}, traceId);
  } catch (err) {
    throw new NetworkError(err);
  }
  if (response.ok) return response.json();
  return handleApiError(response, { date });
}

export async function fetchHistoricalData(lat: number, lon: number, end_date: string, metric: string = 'SST', traceId?: string): Promise<any> {
  const url = `${API_BASE_URL}/ocean/historical?lat=${lat}&lon=${lon}&end_date=${end_date}&metric=${metric}`;
  let response: Response;
  try {
    response = await fetchWithTracing(url, {}, traceId);
  } catch (err) {
    throw new NetworkError(err);
  }
  if (response.ok) return response.json();
  return handleApiError(response, { lat, lon, date: end_date });
}

/**
 * Pings the health endpoint to check if the backend is reachable.
 * Returns `true` if healthy, `false` otherwise.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(5000), // 5-second hard timeout
    });
    return res.ok;
  } catch {
    return false;
  }
}
