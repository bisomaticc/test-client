const API_BASE = "https://test-server-silk.vercel.app/api";

function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function apiPut(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}
