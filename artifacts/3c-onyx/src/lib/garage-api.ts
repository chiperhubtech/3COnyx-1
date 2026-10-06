const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
export async function garageApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("3c_auth_token");
  const response = await fetch(`${BASE}/api/garage${path}`, {
    ...options,
    credentials: "include",
    headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Garage request failed. Please try again.");
  return data;
}
