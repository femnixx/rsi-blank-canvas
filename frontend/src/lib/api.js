const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getAuthHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function apiFetch(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: getAuthHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed (${res.status})`);
  }
  return data;
}

// --- Auth API ---

export async function login(email, password) {
  return apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
}

export async function loginWithNim(nim, password) {
  return apiFetch("/api/auth/login", { method: "POST", body: { nim, password } });
}

export async function register(email, password, nim) {
  return apiFetch("/api/auth/register", { method: "POST", body: { email, password, nim } });
}

export async function fetchMe(token) {
  return apiFetch("/api/auth/me", { token });
}

// --- Workshop API ---

export async function fetchWorkshops() {
  return apiFetch("/api/workshops");
}

export async function fetchWorkshop(id) {
  return apiFetch(`/api/workshops/${id}`);
}

export async function createWorkshop(payload, token) {
  return apiFetch("/api/workshops", { method: "POST", body: payload, token });
}

export async function updateWorkshop(id, payload, token) {
  return apiFetch(`/api/workshops/${id}`, { method: "PUT", body: payload, token });
}

export async function deleteWorkshop(id, token) {
  return apiFetch(`/api/workshops/${id}`, { method: "DELETE", token });
}

export async function registerParticipant(workshopId, token) {
  return apiFetch(`/api/workshops/${workshopId}/register`, { method: "POST", token });
}

export async function fetchWorkshopRegistrations(workshopId, token) {
  return apiFetch(`/api/workshops/${workshopId}/registrations`, { token });
}

// --- Student API ---

export async function fetchMyWorkshops(token) {
  return apiFetch("/api/student/my-workshops", { token });
}

// --- Materials API ---

export async function fetchMaterials(workshopId, token) {
  return apiFetch(`/api/workshops/${workshopId}/materials`, { token });
}

export async function addMaterial(workshopId, payload, token) {
  return apiFetch(`/api/workshops/${workshopId}/materials`, {
    method: "POST",
    body: payload,
    token,
  });
}
