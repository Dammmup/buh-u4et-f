import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"
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
