import { API_URL } from "../config";

const DEFAULT_TIMEOUT_MS = 15000;

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getAuthToken() {
  const raw = localStorage.getItem("token") || "";
  const token = raw.trim();
  return token && token !== "null" && token !== "undefined" ? token : "";
}

export function withQuery(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    auth = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    query,
    headers = {},
    body,
    signal,
    ...rest
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = new Headers(headers);
  const isFormData = body instanceof FormData;

  if (!isFormData && body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAuthToken();
    if (!token) {
      clearTimeout(timer);
      throw new ApiError("Authentication required", 401);
    }
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const finalSignal = signal || controller.signal;
  const requestPath = query ? withQuery(path, query) : path;

  try {
    const response = await fetch(`${API_URL}${requestPath}`, {
      method,
      headers: requestHeaders,
      body: isFormData
        ? body
        : body !== undefined
        ? typeof body === "string"
          ? body
          : JSON.stringify(body)
        : undefined,
      signal: finalSignal,
      ...rest,
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const message =
        (payload && typeof payload === "object" && payload.error) ||
        response.statusText ||
        "Request failed";
      throw new ApiError(message, response.status, payload);
    }

    return payload;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Network error", 0);
  } finally {
    clearTimeout(timer);
  }
}

export function apiGet(path, options = {}) {
  return apiFetch(path, { ...options, method: "GET" });
}

export function apiPost(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "POST", body });
}

export function apiPut(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "PUT", body });
}

export function apiDelete(path, options = {}) {
  return apiFetch(path, { ...options, method: "DELETE" });
}
