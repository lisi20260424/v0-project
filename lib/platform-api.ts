export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost/api";

type FetchOptions = RequestInit & {
  token?: string;
};

async function request(path: string, options: FetchOptions = {}) {
  const { token, headers, ...rest } = options;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalized}`;

  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const platformAPI = {
  login: (email: string, password: string) => request("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: (token: string) => request("/v1/me", { method: "GET", token, cache: "no-store" }),
  createTask: (token: string, payload: { type: string; modelId: string; prompt: string; params?: Record<string, unknown> }) => request("/v1/tasks", { method: "POST", token, body: JSON.stringify(payload) }),
  listTasks: (token: string) => request("/v1/tasks", { method: "GET", token, cache: "no-store" }),
  getTask: (token: string, taskId: string) => request(`/v1/tasks/${taskId}`, { method: "GET", token, cache: "no-store" }),
  deleteTask: (token: string, taskId: string) => request(`/v1/tasks/${taskId}`, { method: "DELETE", token }),
  createOrder: (token: string, payload: { planKind: string; planCode: string; paymentMethod: string }) => request("/v1/pay/orders", { method: "POST", token, body: JSON.stringify(payload) }),
  getOrder: (token: string, orderId: string) => request(`/v1/pay/orders/${orderId}`, { method: "GET", token, cache: "no-store" }),
  listBilling: (token: string, query: string) => request(`/v1/pay/billing${query ? `?${query}` : ""}`, { method: "GET", token, cache: "no-store" }),
  listSubscriptions: (token: string, query: string) => request(`/v1/pay/subscriptions${query ? `?${query}` : ""}`, { method: "GET", token, cache: "no-store" }),
  userPoints: (token: string, query = "") => request(`/v1/user/points${query ? `?${query}` : ""}`, { method: "GET", token, cache: "no-store" }),
  userConsumption: (token: string, query = "") => request(`/v1/user/consumption${query ? `?${query}` : ""}`, { method: "GET", token, cache: "no-store" }),
  deleteAccount: (token: string) => request("/v1/account/delete", { method: "POST", token }),
};
