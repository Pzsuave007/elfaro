import axios from "axios";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("foro_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Resolve media/image URLs (uploaded files are relative to backend)
export function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/")) return `${BACKEND_URL}${path}`;
  return `${API}/media/file/${path}`;
}

export function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

export function track(event, extra = {}) {
  api.post("/analytics/track", { event, path: window.location.pathname, ...extra }).catch(() => {});
}

export function formatApiError(detail) {
  if (detail == null) return "Ocurrió un error. Intenta de nuevo.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}
