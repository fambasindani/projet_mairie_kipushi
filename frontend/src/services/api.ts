const BASE_URL = import.meta.env.VITE_API_URL || "/api";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const base = BASE_URL.replace(/\/+$/, "");
  const ep = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const isAbsolute = base.startsWith("http");
  if (isAbsolute) {
    const url = new URL(`${base}${ep}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }
  const fullUrl = `${base}${ep}`;
  const url = new URL(fullUrl, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.pathname + url.search;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

export class ApiError extends Error {
  errors?: Record<string, string[]>;
  status: number;
  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function api<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  const token = localStorage.getItem("token");

  const publicEndpoints = ["/login", "/inscription", "/activites-economiques", "/provinces", "/villes", "/communes", "/quartiers"];
  const isPublic = publicEndpoints.some((ep) => endpoint === ep || endpoint.startsWith(ep + "/"));

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (token && !isPublic) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const url = buildUrl(endpoint, params);

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 && !isPublic) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new ApiError("Session expirée. Veuillez vous reconnecter.", 401);
  }

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  let raw: unknown;
  if (isJson) {
    raw = await response.json();
  } else if (response.status !== 204) {
    raw = await response.text();
  }

  if (!response.ok) {
    const apiResp = raw as { success?: boolean; message?: string; errors?: Record<string, string[]> } | undefined;
    const message = apiResp?.message || `Erreur ${response.status}`;
    throw new ApiError(message, response.status, apiResp?.errors);
  }

  // Laravel wraps responses in {success, message, data}
  if (raw && typeof raw === "object" && "data" in raw) {
    const resp = raw as Record<string, unknown>;
    // Paginated: {success, data: [...], pagination: {...}} -> flatten to {data: [...], current_page, ...}
    if (resp.pagination && typeof resp.pagination === "object" && Array.isArray(resp.data)) {
      return { data: resp.data, ...resp.pagination } as T;
    }
    return resp.data as T;
  }

  return raw as T;
}

export function get<T = unknown>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  return api<T>(endpoint, { method: "GET", params });
}

export function post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function put<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: "PUT",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function patch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: "PATCH",
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function del<T = unknown>(endpoint: string): Promise<T> {
  return api<T>(endpoint, { method: "DELETE" });
}

export default api;
