export const API_BASE_URL =
  (typeof window === "undefined"
    ? process.env.API_INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL
  )?.replace(/\/$/, "") || "http://localhost/api"

export class PlatformApiError extends Error {
  status: number
  code?: number
  data?: unknown

  constructor(message: string, status: number, code?: number, data?: unknown) {
    super(message)
    this.name = "PlatformApiError"
    this.status = status
    this.code = code
    this.data = data
  }
}

type FetchOptions = RequestInit & {
  token?: string
}

async function request(path: string, options: FetchOptions = {}) {
  const { token, headers, ...rest } = options
  const normalized = path.startsWith("/") ? path : `/${path}`
  const url = `${API_BASE_URL}${normalized}`

  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Request failed: ${res.status}`
    throw new PlatformApiError(message, res.status, data?.code, data?.data)
  }
  return data
}

export const platformAPI = {
  login: (email: string, password: string) => request("/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  requestRegisterOtp: (email: string, password: string, displayName?: string) =>
    request("/v1/auth/register/request-otp", { method: "POST", body: JSON.stringify({ email, password, displayName }) }),
  verifyRegisterOtp: (email: string, otp: string) =>
    request("/v1/auth/register/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) }),
  forgotPassword: (email: string) =>
    request("/v1/auth/password/forgot", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    request("/v1/auth/password/reset", { method: "POST", body: JSON.stringify({ email, otp, newPassword }) }),
  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request("/v1/auth/password/change", { method: "POST", token, body: JSON.stringify({ currentPassword, newPassword }) }),
  logout: (token: string, refreshToken?: string) =>
    request("/v1/auth/logout", { method: "POST", token, body: JSON.stringify({ refreshToken }) }),
  me: (token: string) => request("/v1/me", { method: "GET", token, cache: "no-store" }),
  publicModels: (modelType?: string) => request(`/v1/models${modelType ? `?type=${encodeURIComponent(modelType)}` : ""}`, { method: "GET", cache: "no-store" }),
  publicProviders: () => request("/v1/providers", { method: "GET", cache: "no-store" }),
  publicPrompts: (modelType?: string) => request(`/v1/prompts${modelType ? `?type=${encodeURIComponent(modelType)}` : ""}`, { method: "GET", cache: "no-store" }),
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
  getProfile: (token: string) => request("/v1/user/profile", { method: "GET", token, cache: "no-store" }),
  updateProfile: (token: string, payload: { displayName: string; avatarUrl: string; bio: string; location: string; website: string }) =>
    request("/v1/user/profile", { method: "PATCH", token, body: JSON.stringify(payload) }),
  uploadAsset: async (token: string, file: File, kind = "asset") => {
    const presign = await request("/v1/assets/presign-upload", {
      method: "POST",
      token,
      body: JSON.stringify({ kind, fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size }),
    })
    const uploadUrl = presign.data?.uploadUrl
    const assetId = presign.data?.asset?.id
    if (!uploadUrl || !assetId) throw new Error("Invalid upload signature response")
    const put = await fetch(uploadUrl, {
      method: presign.data?.method || "PUT",
      headers: presign.data?.headers || { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    })
    if (!put.ok) throw new Error(`Upload failed: ${put.status}`)
    const completed = await request("/v1/assets/complete-upload", {
      method: "POST",
      token,
      body: JSON.stringify({ assetId, sizeBytes: file.size }),
    })
    return request(`/v1/assets/${completed.data?.id || assetId}`, { method: "GET", token, cache: "no-store" })
  },
  getPreferences: (token: string) => request("/v1/user/preferences", { method: "GET", token, cache: "no-store" }),
  updatePreferences: (
    token: string,
    payload: {
      defaultVideoModel: string
      defaultImageModel: string
      defaultRatio: string
      language: string
      theme: string
      notifyEmail: boolean
      notifySms: boolean
      notifyInbox: boolean
    },
  ) => request("/v1/user/preferences", { method: "PUT", token, body: JSON.stringify(payload) }),
  getSecurity: (token: string) => request("/v1/user/security", { method: "GET", token, cache: "no-store" }),
  deleteAccount: (token: string) => request("/v1/account/delete", { method: "POST", token }),
}
