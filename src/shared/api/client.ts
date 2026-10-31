import axios from "axios";

const DEV_API_URL = "http://localhost:3000/api";

/**
 * VITE_API_URL wins when set. Otherwise: the dev server talks to the local API,
 * and a deployed build falls back to same-origin /api, so a production bundle never
 * silently points at localhost.
 */
function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    return DEV_API_URL;
  }

  return "/api";
}

export const apiBaseUrl = resolveBaseUrl();

/** Origin serving the API, used for non-API assets such as /files. */
export function apiOrigin(): string {
  const withoutApi = apiBaseUrl.replace(/\/api$/, "");
  if (withoutApi.startsWith("http")) {
    return withoutApi;
  }

  return `${window.location.origin}${withoutApi}`;
}

export const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = String(error.config?.url ?? "");
      const isAuthAttempt = url.includes("/auth/login") || url.includes("/auth/register");
      if (!isAuthAttempt) {
        localStorage.removeItem("auth_token");
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    return Promise.reject(error);
  }
);

export function formatMoney(value: number, currency = "KZT") {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("ru-KZ", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function getApiErrorStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const payload = error.response?.data as
    | { message?: string; details?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } }
    | undefined;

  if (payload?.message && payload.message !== "Validation failed") {
    return payload.message;
  }

  const fieldErrors = payload?.details?.fieldErrors
    ? Object.values(payload.details.fieldErrors).flat()
    : [];
  const formErrors = payload?.details?.formErrors ?? [];
  const details = [...formErrors, ...fieldErrors].filter(Boolean);

  if (details.length > 0) {
    return details.join(". ");
  }

  return payload?.message || fallback;
}
